import os
import uuid
from typing import List, Dict, Any, Optional, Sequence, Literal
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from .pdf_tool import search_pdf       
from .sql_tool import get_database_schema
from .tavily_search_tool import tavily_search  


load_dotenv()


# Load API keys
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    os.environ["OPENAI_API_KEY"] = openai_api_key

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    os.environ["GOOGLE_API_KEY"] = gemini_api_key

# Model type
ModelType = Literal["gemini", "openai"]
DEFAULT_MODEL: ModelType = "gemini"

# Available models configuration
AVAILABLE_MODELS = {
    "gemini": {
        "name": "Gemini 2.0 Flash",
        "model_id": "gemini-2.0-flash",
        "provider": "Google",
        "available": bool(gemini_api_key),
    },
    "openai": {
        "name": "GPT-4o",
        "model_id": "gpt-4o", 
        "provider": "OpenAI",
        "available": bool(openai_api_key),
    },
}


SYSTEM_PROMPT = """You are Axon Copilot, an assistant that combines retrieved document knowledge with live tools.

CRITICAL SQL GUIDELINES - YOU MUST FOLLOW THESE:
1. When users ask about database content or want to query/modify data, FIRST use get_database_schema to understand the structure.
2. You CANNOT execute SQL queries directly. You do NOT have a tool to run SQL.
3. After understanding the schema, you MUST return the SQL query in a markdown code block for user approval:

```sql
YOUR_QUERY_HERE
```

4. The user will review the query in their SQL console and decide whether to run it.
5. ALWAYS explain what the query will do BEFORE showing the code block.
6. Only provide ONE SQL query at a time.
7. Wait for user confirmation before suggesting additional queries.

EXAMPLE RESPONSE FOR DATABASE QUESTIONS:
"Based on the database schema, here's a query to retrieve the data you requested:

```sql
SELECT * FROM customers WHERE country = 'USA';
```

This query will fetch all customers from the USA. Please review and approve this query in the SQL panel."

OTHER TOOLS:
- Call `tavily_search` for questions about current events, weather, general facts, or anything requiring up-to-date information.
- Use `search_pdf` for questions about uploaded documents.
- Only answer from prior knowledge when tools are clearly unnecessary.
"""


# Create agents for different models using LangGraph v1.x
_AGENTS: Dict[str, Any] = {}
_MEMORIES: Dict[str, MemorySaver] = {}
_CURRENT_MODEL: ModelType = DEFAULT_MODEL


def get_available_models() -> List[Dict[str, Any]]:
    """Return list of available models with their status."""
    return [
        {
            "id": model_id,
            "name": info["name"],
            "provider": info["provider"],
            "available": info["available"],
            "isDefault": model_id == DEFAULT_MODEL,
        }
        for model_id, info in AVAILABLE_MODELS.items()
    ]


def get_current_model() -> str:
    """Return the currently selected model."""
    return _CURRENT_MODEL


def set_current_model(model: ModelType) -> bool:
    """Set the current model. Returns True if successful."""
    global _CURRENT_MODEL
    if model in AVAILABLE_MODELS and AVAILABLE_MODELS[model]["available"]:
        _CURRENT_MODEL = model
        return True
    return False


def reset_agent(model: Optional[ModelType] = None):
    """Reset the agent to pick up new configuration."""
    global _AGENTS, _MEMORIES
    if model:
        _AGENTS.pop(model, None)
        _MEMORIES.pop(model, None)
    else:
        _AGENTS = {}
        _MEMORIES = {}


def _create_llm(model: ModelType):
    """Create the appropriate LLM based on model type."""
    if model == "gemini":
        return ChatGoogleGenerativeAI(
            model=AVAILABLE_MODELS["gemini"]["model_id"],
            temperature=0,
            convert_system_message_to_human=True,
        )
    else:  # openai
        return ChatOpenAI(
            model=AVAILABLE_MODELS["openai"]["model_id"],
            temperature=0,
        )


def get_agent(model: Optional[ModelType] = None):
    """
    Create and cache a LangGraph ReAct agent with memory checkpointing.
    Uses the new LangGraph v1.x API with create_react_agent.
    """
    global _AGENTS, _MEMORIES
    
    # Use specified model or current default
    use_model = model or _CURRENT_MODEL
    
    # Validate model availability
    if not AVAILABLE_MODELS.get(use_model, {}).get("available"):
        # Fallback to any available model
        for m, info in AVAILABLE_MODELS.items():
            if info["available"]:
                use_model = m
                break
        else:
            raise ValueError("No LLM API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.")
    
    if use_model not in _AGENTS:
        # Initialize the LLM
        llm = _create_llm(use_model)  # type: ignore
        
        # Initialize memory for conversation persistence
        _MEMORIES[use_model] = MemorySaver()
        
        # Define tools - NO run_sql_query! AI must suggest queries for user approval
        tools = [search_pdf, get_database_schema, tavily_search]
        
        # Create the ReAct agent using LangGraph v1.x
        _AGENTS[use_model] = create_react_agent(
            model=llm,
            tools=tools,
            checkpointer=_MEMORIES[use_model],
            prompt=SYSTEM_PROMPT,
        )
        print(f"Agent created successfully using LangGraph v1.x with {AVAILABLE_MODELS[use_model]['name']}")
    return _AGENTS[use_model]


_FALLBACK_MESSAGE = "Sorry, I could not generate a response right now."


def generate_response(
    prompt: str,
    history: Optional[Sequence[Dict[str, Any]]] = None,
    *,
    document_context: Optional[str] = None,
    external_context: Optional[str] = None,
    model: Optional[ModelType] = None,
) -> str:
    """Return the assistant reply for the provided prompt and history using LangGraph v1.x."""
    if not prompt:
        return _FALLBACK_MESSAGE

    # Build conversation messages
    conversation: List[BaseMessage] = []
    
    # Add history
    if history:
        for item in history:
            role = item.get("role")
            content = item.get("content")
            if role == "user":
                conversation.append(HumanMessage(content=content))
            elif role == "assistant":
                conversation.append(AIMessage(content=content))

    # Add context via system messages (before the user's prompt)
    context_parts = []
    if document_context:
        context_parts.append(
            f"Use the following excerpts from the user's uploaded documents as trusted context:\n\n{document_context}"
        )
    if external_context:
        context_parts.append(
            f"The following information was retrieved from the web:\n\n{external_context}"
        )
    
    if context_parts:
        conversation.append(SystemMessage(content="\n\n---\n\n".join(context_parts)))

    # Add the user's prompt
    conversation.append(HumanMessage(content=prompt))

    try:
        agent = get_agent(model)
        # Use a unique thread_id per request to avoid memory conflicts between users
        # The conversation history is already passed in, so we don't need shared memory
        thread_id = str(uuid.uuid4())
        config: RunnableConfig = {"configurable": {"thread_id": thread_id}}
        result = agent.invoke({"messages": conversation}, config)
        
        # Extract response from LangGraph result
        messages = result.get("messages", [])
        if messages:
            # Get the last AI message
            last_message = messages[-1]
            
            # Handle BaseMessage objects
            if isinstance(last_message, BaseMessage):
                content = last_message.content
                if isinstance(content, str) and content.strip():
                    return content
                elif isinstance(content, list):
                    # Handle content blocks (v1.x feature)
                    text_parts = []
                    for block in content:
                        if isinstance(block, dict) and "text" in block:
                            text_parts.append(block["text"])
                        elif isinstance(block, str):
                            text_parts.append(block)
                    if text_parts:
                        return "\n".join(text_parts)
            
            # Handle dict-style messages
            elif isinstance(last_message, dict):
                content = last_message.get("content", "")
                if content:
                    return str(content)
        
    except Exception as exc:
        print(f"Assistant backend error: {exc}")
        import traceback
        traceback.print_exc()
        
        # Provide fallback context if available
        fallback_chunks = []
        if document_context:
            fallback_chunks.append(f"I couldn't process your request, but here are excerpts from your documents:\n\n{document_context}")
        if external_context:
            fallback_chunks.append(f"I couldn't process your request, but here are insights from web search:\n\n{external_context}")
        if fallback_chunks:
            return "\n\n---\n\n".join(fallback_chunks)

    return _FALLBACK_MESSAGE


def stream_response(messages: List[BaseMessage]):
    """Stream agent responses using LangGraph v1.x stream."""
    agent = get_agent()
    config: RunnableConfig = {"configurable": {"thread_id": "default"}}
    
    for event in agent.stream({"messages": messages}, config, stream_mode="values"):
        msgs = event.get("messages", [])
        if msgs:
            last_msg = msgs[-1]
            if isinstance(last_msg, BaseMessage):
                content = last_msg.content
                if isinstance(content, str) and content:
                    yield content
            elif isinstance(last_msg, dict):
                content = last_msg.get("content", "")
                if content:
                    yield str(content)


if __name__ == "__main__":
    agent = get_agent()
    conversation = []

    print("Axon Copilot ready! (type 'quit' to exit)")
    
    while True:
        try:
            user_input = input("\nYou: ")
            if user_input.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                break

            conversation.append(HumanMessage(content=user_input))
            
            # Properly typed config
            config: RunnableConfig = {"configurable": {"thread_id": "cli_session"}}
            result = agent.invoke({"messages": conversation}, config)
            
            # Get last message
            messages = result.get("messages", [])
            if messages:
                assistant_msg = messages[-1]
                response = getattr(assistant_msg, 'content', '') or assistant_msg.get("content", "")
                print(f"\nAssistant: {response}")
                conversation.append(AIMessage(content=response))

        except Exception as e:
            print(f"Error: {e}")
            break

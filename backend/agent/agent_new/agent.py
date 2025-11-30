import os
import uuid
from typing import List, Dict, Any, Optional, Sequence
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from .pdf_tool import search_pdf       
from .sql_tool import get_database_schema
from .tavily_search_tool import tavily_search  


load_dotenv()


api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    os.environ["OPENAI_API_KEY"] = api_key


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


# Create the agent using LangGraph v1.x create_react_agent
_AGENT = None
_MEMORY = None


def reset_agent():
    """Reset the agent to pick up new configuration."""
    global _AGENT, _MEMORY
    _AGENT = None
    _MEMORY = None


def get_agent():
    """
    Create and cache a LangGraph ReAct agent with memory checkpointing.
    Uses the new LangGraph v1.x API with create_react_agent.
    """
    global _AGENT, _MEMORY
    if _AGENT is None:
        # Initialize the LLM
        llm = ChatOpenAI(model="gpt-4o", temperature=0)
        
        # Initialize memory for conversation persistence
        _MEMORY = MemorySaver()
        
        # Define tools - NO run_sql_query! AI must suggest queries for user approval
        tools = [search_pdf, get_database_schema, tavily_search]
        
        # Create the ReAct agent using LangGraph v1.x
        _AGENT = create_react_agent(
            model=llm,
            tools=tools,
            checkpointer=_MEMORY,
            prompt=SYSTEM_PROMPT,
        )
        print("Agent created successfully using LangGraph v1.x")
    return _AGENT


_FALLBACK_MESSAGE = "Sorry, I could not generate a response right now."


def generate_response(
    prompt: str,
    history: Optional[Sequence[Dict[str, Any]]] = None,
    *,
    document_context: Optional[str] = None,
    external_context: Optional[str] = None,
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
        agent = get_agent()
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

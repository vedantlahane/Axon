from __future__ import annotations

import asyncio
import json
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence, TypedDict

import httpx
from langgraph.graph import END, START, StateGraph

from ..config import Settings


@dataclass(slots=True)
class AgentContext:
    user_id: int
    message: str
    conversation_title: str
    conversation_history: Sequence[tuple[str, str]]
    preferred_model: str
    document_paths: Sequence[str]
    sqlite_path: str | None = None


@dataclass(slots=True)
class AgentResult:
    content: str
    provider: str
    model: str
    tools_used: list[str]


class AgentState(TypedDict, total=False):
    context: AgentContext
    tools_used: list[str]
    document_context: str
    schema_context: str
    sql_context: str
    prompt: str
    content: str
    provider: str
    model: str


class AxonAgentPipeline:
    """Lightweight multi-provider agent pipeline with contextual tools.

    This implementation provides an actual reasoning chain by assembling
    conversation/document/SQL context and routing to a configured model.
    """

    def __init__(self, timeout_seconds: float = 20.0) -> None:
        self.timeout_seconds = timeout_seconds
        settings = Settings()
        self.gemini_api_key = self._normalize_api_key(settings.GEMINI_API_KEY) or self._normalize_api_key(
            settings.GOOGLE_API_KEY
        )
        self.openai_api_key = self._normalize_api_key(settings.OPENAI_API_KEY)
        self.graph = self._build_graph()

    @staticmethod
    def _normalize_api_key(value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None

    def _build_graph(self) -> Any:
        workflow = StateGraph(AgentState)
        workflow.add_node('collect_context', self._collect_context_node)
        workflow.add_node('build_prompt', self._build_prompt_node)
        workflow.add_node('generate_answer', self._generate_answer_node)

        workflow.add_edge(START, 'collect_context')
        workflow.add_edge('collect_context', 'build_prompt')
        workflow.add_edge('build_prompt', 'generate_answer')
        workflow.add_edge('generate_answer', END)
        return workflow.compile()

    async def generate_response(self, context: AgentContext) -> AgentResult:
        state = await self.graph.ainvoke({'context': context, 'tools_used': []})

        content = str(state.get('content', '')).strip()
        provider = str(state.get('provider', 'fallback'))
        model = str(state.get('model', 'rule-based'))
        tools_used = list(state.get('tools_used', []))

        if content:
            return AgentResult(content=content, provider=provider, model=model, tools_used=tools_used)

        fallback = self._fallback_response(
            context.message,
            str(state.get('document_context', '')),
            str(state.get('schema_context', '')),
            str(state.get('sql_context', '')),
        )
        return AgentResult(
            content=fallback,
            provider='fallback',
            model='rule-based',
            tools_used=tools_used,
        )

    async def _collect_context_node(self, state: AgentState) -> AgentState:
        context = state['context']
        tools_used = list(state.get('tools_used', []))

        document_context = await self._collect_document_context(context.document_paths)
        if document_context:
            tools_used.append('document_context_tool')

        schema_context = ''
        should_collect_schema = self._looks_like_schema_request(context.message) or self._looks_like_database_overview_request(
            context.message
        )
        if context.sqlite_path and should_collect_schema:
            schema_context = await asyncio.to_thread(self._read_schema_snapshot, context.sqlite_path)
            if schema_context:
                tools_used.append('schema_tool')

        sql_context = ''
        if context.sqlite_path:
            sql_context = await asyncio.to_thread(
                self._maybe_run_read_only_query,
                context.message,
                context.sqlite_path,
            )
            if sql_context:
                tools_used.append('sql_query_tool')

        return {
            'document_context': document_context,
            'schema_context': schema_context,
            'sql_context': sql_context,
            'tools_used': tools_used,
        }

    async def _build_prompt_node(self, state: AgentState) -> AgentState:
        context = state['context']
        prompt = self._build_prompt(
            message=context.message,
            title=context.conversation_title,
            history=context.conversation_history,
            document_context=str(state.get('document_context', '')),
            schema_context=str(state.get('schema_context', '')),
            sql_context=str(state.get('sql_context', '')),
        )
        return {'prompt': prompt}

    async def _generate_answer_node(self, state: AgentState) -> AgentState:
        context = state['context']
        prompt = str(state.get('prompt', ''))
        schema_context = str(state.get('schema_context', ''))

        if schema_context and self._looks_like_database_overview_request(context.message):
            local_response = self._database_overview_response(schema_context)
            if local_response:
                return {'content': local_response, 'provider': 'local', 'model': 'sqlite-schema'}

        content, provider, model = await self._call_llm(prompt, context.preferred_model)
        if content:
            return {'content': content, 'provider': provider, 'model': model}

        fallback = self._fallback_response(
            context.message,
            str(state.get('document_context', '')),
            str(state.get('schema_context', '')),
            str(state.get('sql_context', '')),
        )
        return {'content': fallback, 'provider': 'fallback', 'model': 'rule-based'}

    async def _call_llm(self, prompt: str, preferred_model: str) -> tuple[str | None, str, str]:
        preferred_model = preferred_model.strip().lower()
        provider_order = ['gemini', 'openai']
        if preferred_model in {'gpt-4o', 'openai'}:
            provider_order = ['openai', 'gemini']

        for provider in provider_order:
            if provider == 'gemini' and self.gemini_api_key:
                text = await self._call_gemini(prompt)
                if text:
                    return text, 'google', 'gemini-2.0-flash'

            if provider == 'openai' and self.openai_api_key:
                target_model = 'gpt-4o' if preferred_model in {'gpt-4o', 'openai'} else 'gpt-4o-mini'
                text = await self._call_openai(prompt, target_model)
                if text:
                    return text, 'openai', target_model

        return None, 'none', 'none'

    async def _call_gemini(self, prompt: str) -> str | None:
        assert self.gemini_api_key
        endpoint = (
            'https://generativelanguage.googleapis.com/v1beta/models/'
            'gemini-2.0-flash:generateContent'
        )
        params = {'key': self.gemini_api_key}
        payload = {
            'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
            'generationConfig': {'temperature': 0.2, 'topP': 0.9, 'maxOutputTokens': 700},
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(endpoint, params=params, json=payload)
            response.raise_for_status()
            data = response.json()
            candidates = data.get('candidates', [])
            if not candidates:
                return None
            parts = candidates[0].get('content', {}).get('parts', [])
            fragments = [part.get('text', '') for part in parts if isinstance(part, dict)]
            text = '\n'.join(fragment for fragment in fragments if fragment).strip()
            return text or None
        except Exception:
            return None

    async def _call_openai(self, prompt: str, model: str) -> str | None:
        assert self.openai_api_key
        endpoint = 'https://api.openai.com/v1/chat/completions'
        payload = {
            'model': model,
            'messages': [
                {
                    'role': 'system',
                    'content': (
                        'You are Axon, a senior software intelligence assistant. '
                        'Be precise, actionable, and avoid hallucinations.'
                    ),
                },
                {'role': 'user', 'content': prompt},
            ],
            'temperature': 0.2,
            'max_tokens': 700,
        }
        headers = {
            'Authorization': f'Bearer {self.openai_api_key}',
            'Content-Type': 'application/json',
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            choices = data.get('choices', [])
            if not choices:
                return None
            message = choices[0].get('message', {})
            text = message.get('content', '') if isinstance(message, dict) else ''
            return text.strip() or None
        except Exception:
            return None

    async def _collect_document_context(self, document_paths: Sequence[str]) -> str:
        snippets: list[str] = []
        for raw_path in document_paths[:4]:
            snippet = await asyncio.to_thread(self._read_document_snippet, raw_path)
            if snippet:
                snippets.append(snippet)

        return '\n\n'.join(snippets)

    def _read_document_snippet(self, raw_path: str) -> str:
        path = Path(raw_path)
        if not path.exists() or not path.is_file():
            return ''

        suffix = path.suffix.lower()
        text_like = {
            '.txt', '.md', '.json', '.csv', '.sql', '.log', '.py', '.ts', '.tsx', '.js', '.yaml', '.yml'
        }

        if suffix not in text_like:
            return f'Document {path.name}: non-text file attached.'

        try:
            data = path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            return ''

        compact = re.sub(r'\s+', ' ', data).strip()
        if not compact:
            return ''

        return f'Document {path.name} excerpt: {compact[:1000]}'

    def _looks_like_schema_request(self, message: str) -> bool:
        lowered = message.lower()
        tokens = (
            'schema',
            'table',
            'columns',
            'database structure',
            'database schema',
            'list tables',
            'what tables',
            'erd',
            'relationship',
        )
        return any(token in lowered for token in tokens)

    def _looks_like_database_overview_request(self, message: str) -> bool:
        lowered = ' '.join(re.sub(r'[^a-z0-9\s]', ' ', message.lower()).split())
        hints = (
            "what's in database",
            'whats in database',
            "what's in the database",
            'whats in the database',
            'what is in the database',
            'tell me what is in database',
            'tell me whats in database',
            'database contents',
            'database overview',
            'show tables',
            'which tables',
            "what's in db",
            'whats in db',
        )
        if any(hint in lowered for hint in hints):
            return True

        return 'database' in lowered and any(token in lowered for token in ('list', 'show', 'tables', 'contents'))

    def _read_schema_snapshot(self, sqlite_path: str) -> str:
        db_path = Path(sqlite_path)
        if not db_path.exists():
            return ''

        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
            table_names = [item[0] for item in cursor.fetchall()]
            if not table_names:
                return 'No user tables found in the current SQLite database.'

            chunks: list[str] = []
            for table_name in table_names[:12]:
                cursor.execute(f"PRAGMA table_info('{table_name}')")
                columns = cursor.fetchall()
                formatted_cols = ', '.join(f"{col[1]} {col[2]}" for col in columns[:12])
                chunks.append(f"{table_name}: {formatted_cols}")
            return '\n'.join(chunks)
        finally:
            cursor.close()
            conn.close()

    def _maybe_run_read_only_query(self, message: str, sqlite_path: str) -> str:
        sql_candidate = self._extract_sql(message)
        if not sql_candidate:
            return ''

        lowered = sql_candidate.lower().strip()
        if not (lowered.startswith('select') or lowered.startswith('pragma') or lowered.startswith('with')):
            return ''

        db_path = Path(sqlite_path)
        if not db_path.exists():
            return ''

        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        try:
            cursor.execute(sql_candidate)
            rows = cursor.fetchmany(20)
            columns = [item[0] for item in cursor.description] if cursor.description else []
            payload = [{column: row[column] for column in columns} for row in rows]
            return json.dumps(payload, default=str)
        except Exception:
            return ''
        finally:
            cursor.close()
            conn.close()

    def _extract_sql(self, message: str) -> str:
        fenced = re.search(r'```sql\s*(.*?)```', message, flags=re.IGNORECASE | re.DOTALL)
        if fenced:
            return fenced.group(1).strip()

        if message.lower().startswith('sql:'):
            return message.split(':', 1)[1].strip()

        compact = message.strip()
        if compact.lower().startswith(('select ', 'pragma ', 'with ')):
            return compact

        return ''

    def _database_overview_response(self, schema_context: str) -> str:
        lines = [line.strip() for line in schema_context.splitlines() if line.strip()]
        if not lines:
            return ''

        if lines[0].lower().startswith('no user tables found'):
            return (
                'I checked your connected SQLite database and there are currently no user tables in it.\n\n'
                'If you expected data, verify that the selected database path is correct and try again.'
            )

        table_summaries: list[str] = []
        sample_table = ''
        for line in lines[:12]:
            if ':' not in line:
                continue

            table_name, raw_columns = line.split(':', 1)
            table_name = table_name.strip()
            if not table_name:
                continue

            if not sample_table:
                sample_table = table_name

            column_tokens = [token.strip() for token in raw_columns.split(',') if token.strip()]
            column_names: list[str] = []
            for token in column_tokens[:6]:
                column_names.append(token.split(' ', 1)[0])

            if column_names:
                table_summaries.append(f"- {table_name}: columns -> {', '.join(column_names)}")
            else:
                table_summaries.append(f'- {table_name}')

        if not table_summaries:
            return ''

        query_hint = ''
        if sample_table:
            query_hint = (
                '\n\nTry this to preview data:\n'
                f'SELECT * FROM "{sample_table}" LIMIT 10;'
            )

        return (
            'Here is what I found in your connected SQLite database:\n\n'
            + '\n'.join(table_summaries)
            + query_hint
        )

    def _build_prompt(
        self,
        *,
        message: str,
        title: str,
        history: Sequence[tuple[str, str]],
        document_context: str,
        schema_context: str,
        sql_context: str,
    ) -> str:
        history_lines = [f"{sender}: {content}" for sender, content in history[-8:]]

        sections = [
            'You are Axon, an AI software intelligence assistant.',
            'Respond with practical, accurate guidance and clear next actions.',
            (
                'Database guidance: this app uses SQLite context tools. '
                'When discussing database structure, use SQLite syntax (sqlite_master, PRAGMA) '
                'and do not suggest MySQL-only commands like SHOW TABLES or DESCRIBE.'
            ),
            f"Conversation title: {title or 'Untitled conversation'}",
            'Recent conversation:',
            '\n'.join(history_lines) if history_lines else '(no previous messages)',
            'User request:',
            message,
        ]

        if document_context:
            sections.extend(['Document context:', document_context])

        if schema_context:
            sections.extend(['Database schema snapshot:', schema_context])
        elif self._looks_like_database_overview_request(message):
            sections.append(
                'Database context status: no SQLite schema snapshot was available for this request. '
                'Ask the user to configure Database Settings or upload/select a SQLite file before listing tables.'
            )

        if sql_context:
            sections.extend(['Read-only SQL result sample (if relevant):', sql_context])

        sections.append('Answer in markdown. If uncertain, state assumptions explicitly.')
        return '\n\n'.join(sections)

    def _fallback_response(
        self,
        message: str,
        document_context: str,
        schema_context: str,
        sql_context: str,
    ) -> str:
        fragments = [
            'I could not reach an external language model, but I can still help with local context.',
            f'Your request: {message}',
        ]

        if document_context:
            fragments.append('I found attached document context and can use it for follow-up questions.')

        if schema_context:
            fragments.append('I inspected the database schema and can help you craft queries against it.')

        if self._looks_like_database_overview_request(message) and not schema_context:
            fragments.append(
                'I could not inspect a SQLite schema for this chat. '
                'Save a SQLite connection in Database Settings, then ask again and I will list tables directly.'
            )

        if sql_context:
            fragments.append('I also executed a read-only SQL sample and can refine or explain the result.')

        if self.gemini_api_key or self.openai_api_key:
            fragments.append(
                'A provider key is configured, but the provider request failed. '
                'Verify key/project access, quota, and outbound network access.'
            )
        else:
            fragments.append('If you configure GEMINI_API_KEY or OPENAI_API_KEY, I can provide richer reasoning.')
        return '\n\n'.join(fragments)

import asyncio
import sqlite3
import tempfile
from pathlib import Path
import unittest

from backend.agent import AgentContext, AxonAgentPipeline
from backend.tests.test_support import ensure_database_schema


class AgentPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_database_schema()

    def test_generate_response_returns_content(self):
        pipeline = AxonAgentPipeline(timeout_seconds=8.0)
        context = AgentContext(
            user_id=1,
            message='Summarize what this assistant can do.',
            conversation_title='Pipeline test',
            conversation_history=[],
            preferred_model='gemini',
            document_paths=[],
            sqlite_path=None,
        )

        result = asyncio.run(pipeline.generate_response(context))

        self.assertTrue(result.content.strip())
        self.assertIn(result.provider, {'fallback', 'google', 'openai'})

    def test_schema_tool_is_used_when_schema_is_requested(self):
        pipeline = AxonAgentPipeline(timeout_seconds=8.0)

        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = Path(tmp_dir) / 'schema_test.db'
            conn = sqlite3.connect(str(db_path))
            conn.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT NOT NULL)')
            conn.commit()
            conn.close()

            context = AgentContext(
                user_id=1,
                message='Show me the database schema and table columns.',
                conversation_title='Schema test',
                conversation_history=[],
                preferred_model='gemini',
                document_paths=[],
                sqlite_path=str(db_path),
            )

            result = asyncio.run(pipeline.generate_response(context))

        self.assertIn('schema_tool', result.tools_used)
        self.assertTrue(result.content.strip())


if __name__ == '__main__':
    unittest.main()

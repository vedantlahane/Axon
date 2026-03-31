import asyncio
import sqlite3
import tempfile
from pathlib import Path
import unittest

import backend.tests.warnings_config  # noqa: F401
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

    def test_database_overview_prompt_returns_table_summary(self):
        pipeline = AxonAgentPipeline(timeout_seconds=8.0)

        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = Path(tmp_dir) / 'overview_test.db'
            conn = sqlite3.connect(str(db_path))
            conn.execute('CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, total REAL NOT NULL)')
            conn.execute('CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, email TEXT NOT NULL)')
            conn.commit()
            conn.close()

            context = AgentContext(
                user_id=1,
                message='whats in the database',
                conversation_title='Database overview test',
                conversation_history=[],
                preferred_model='gemini',
                document_paths=[],
                sqlite_path=str(db_path),
            )

            result = asyncio.run(pipeline.generate_response(context))

        self.assertIn('schema_tool', result.tools_used)
        self.assertEqual(result.provider, 'local')
        self.assertIn('orders', result.content.lower())
        self.assertIn('customers', result.content.lower())


if __name__ == '__main__':
    unittest.main()

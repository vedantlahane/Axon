import unittest
import uuid

from fastapi.testclient import TestClient

import backend.tests.warnings_config  # noqa: F401
from backend.main import app
from backend.tests.test_support import ensure_database_schema


class AgentChatApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_database_schema()

    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def _register_user(self) -> str:
        email = f"chat_{uuid.uuid4().hex[:8]}@testmail.com"
        response = self.client.post(
            '/api/auth/register/',
            json={'name': 'Chat Tester', 'email': email, 'password': 'StrongPass123!'},
        )
        self.assertEqual(response.status_code, 200, msg=response.text)
        return email

    def test_chat_creates_assistant_reply(self):
        self._register_user()

        response = self.client.post('/api/chat/', json={'message': 'Hello agent, give me a short reply.'})
        self.assertEqual(response.status_code, 200, msg=response.text)

        payload = response.json()
        self.assertIn('id', payload)
        self.assertIn('messages', payload)

        messages = payload['messages']
        self.assertGreaterEqual(len(messages), 2)

        assistant_messages = [msg for msg in messages if msg.get('sender') == 'assistant']
        self.assertTrue(assistant_messages)
        self.assertTrue(assistant_messages[-1].get('content', '').strip())

        conversation_id = payload['id']
        cleanup = self.client.delete(f'/api/conversations/{conversation_id}/?delete_files=true')
        self.assertEqual(cleanup.status_code, 200, msg=cleanup.text)


if __name__ == '__main__':
    unittest.main()

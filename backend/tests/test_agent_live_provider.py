import os
import unittest
import uuid

from fastapi.testclient import TestClient

from backend.main import app
from backend.tests.test_support import ensure_database_schema


FALLBACK_PREFIX = 'I could not reach an external language model'


class AgentLiveProviderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_database_schema()

    def setUp(self):
        run_live = os.getenv('AXON_RUN_LIVE_PROVIDER_TESTS') == '1'
        has_gemini = bool(os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY'))
        has_openai = bool(os.getenv('OPENAI_API_KEY'))

        if not run_live:
            self.skipTest('AXON_RUN_LIVE_PROVIDER_TESTS is not enabled')

        if not (has_gemini or has_openai):
            self.skipTest('No live provider API key configured')

        self.preferred_model = 'gemini' if has_gemini else 'gpt-4o'
        self.client = TestClient(app)

        email = f"live_{uuid.uuid4().hex[:8]}@testmail.com"
        register = self.client.post(
            '/api/auth/register/',
            json={'name': 'Live Provider Tester', 'email': email, 'password': 'StrongPass123!'},
        )
        self.assertEqual(register.status_code, 200, msg=register.text)

    def tearDown(self):
        if hasattr(self, 'client'):
            self.client.close()

    def test_live_provider_response_not_fallback(self):
        set_model = self.client.post('/api/models/set/', json={'model': self.preferred_model})
        self.assertEqual(set_model.status_code, 200, msg=set_model.text)

        response = self.client.post(
            '/api/chat/',
            json={'message': 'Reply with a short sentence proving the LLM provider call is working.'},
        )
        self.assertEqual(response.status_code, 200, msg=response.text)

        payload = response.json()
        assistant_messages = [msg for msg in payload.get('messages', []) if msg.get('sender') == 'assistant']
        self.assertTrue(assistant_messages)

        reply = assistant_messages[-1].get('content', '').strip()
        self.assertTrue(reply)
        self.assertFalse(reply.startswith(FALLBACK_PREFIX), msg=reply)

        conversation_id = payload['id']
        cleanup = self.client.delete(f'/api/conversations/{conversation_id}/?delete_files=true')
        self.assertEqual(cleanup.status_code, 200, msg=cleanup.text)


if __name__ == '__main__':
    unittest.main()

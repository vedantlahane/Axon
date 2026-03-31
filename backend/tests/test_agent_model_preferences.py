import unittest
import uuid

from fastapi.testclient import TestClient

import backend.tests.warnings_config  # noqa: F401
from backend.main import app
from backend.tests.test_support import ensure_database_schema


class AgentModelPreferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ensure_database_schema()

    def setUp(self):
        self.client = TestClient(app)
        email = f"model_{uuid.uuid4().hex[:8]}@testmail.com"
        response = self.client.post(
            '/api/auth/register/',
            json={'name': 'Model Tester', 'email': email, 'password': 'StrongPass123!'},
        )
        self.assertEqual(response.status_code, 200, msg=response.text)

    def tearDown(self):
        self.client.close()

    def test_model_preference_roundtrip(self):
        before = self.client.get('/api/models/')
        self.assertEqual(before.status_code, 200, msg=before.text)
        self.assertIn('current', before.json())

        set_model = self.client.post('/api/models/set/', json={'model': 'gpt-4o'})
        self.assertEqual(set_model.status_code, 200, msg=set_model.text)

        after = self.client.get('/api/models/')
        self.assertEqual(after.status_code, 200, msg=after.text)
        self.assertEqual(after.json().get('current'), 'gpt-4o')

        chat = self.client.post('/api/chat/', json={'message': 'Quick check that chat still works after model change.'})
        self.assertEqual(chat.status_code, 200, msg=chat.text)

        conversation_id = chat.json()['id']
        cleanup = self.client.delete(f'/api/conversations/{conversation_id}/?delete_files=true')
        self.assertEqual(cleanup.status_code, 200, msg=cleanup.text)

    def test_rejects_invalid_model(self):
        invalid = self.client.post('/api/models/set/', json={'model': 'not-a-real-model'})
        self.assertEqual(invalid.status_code, 400, msg=invalid.text)


if __name__ == '__main__':
    unittest.main()

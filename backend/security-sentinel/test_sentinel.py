import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import os

# Import the app from main
from main import app

class TestSecuritySentinel(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("psycopg2.connect")
    def test_health_operational(self, mock_connect):
        # Mock successful database connection
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        
        # Set DATABASE_URL for the test
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://user:pass@localhost/db"}):
            response = self.client.get("/health")
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "OPERATIONAL")
        self.assertEqual(data["dependencies"]["database"], "OPERATIONAL")

    @patch("psycopg2.connect")
    def test_health_degraded(self, mock_connect):
        # Mock database connection failure
        mock_connect.side_effect = Exception("Connection failed")
        
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://user:pass@localhost/db"}):
            response = self.client.get("/health")
            
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "DEGRADED")
        self.assertEqual(data["dependencies"]["database"], "OFFLINE")

    def test_health_disabled(self):
        # Test when DATABASE_URL is not set
        with patch.dict(os.environ, {}, clear=True):
            # We need to ensure DATABASE_URL in main is seen as None
            # In main.py: DATABASE_URL = os.getenv("DATABASE_URL")
            # This is evaluated at import time. 
            # To test this correctly, we might need to reload the module or 
            # mock the variable directly if possible.
            with patch("main.DATABASE_URL", None):
                response = self.client.get("/health")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["dependencies"]["database"], "DISABLED")

if __name__ == "__main__":
    unittest.main()

from fastapi.testclient import TestClient

from app.main import app

test_client = TestClient(app)


def test_health_check():
    response = test_client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

from fastapi.testclient import TestClient
import json
from main import app

client = TestClient(app)

def test_recommendation_modern():
    response = client.post(
        "/recommend",
        json={"title": "Modern sofa", "top_n": 3}
    )
    assert response.status_code == 200
    
    # The response is a string
    data_str = response.json()
    assert isinstance(data_str, str)
    
    # It should be a valid JSON list
    data = json.loads(data_str)
    assert isinstance(data, list)
    assert len(data) <= 3
    
    # First item should match "Modern" or "Sofa" because of high score
    assert any("Modern" in item["style"] or "Sofa" in item["category"] for item in data)
    print("Test passed successfully!")

if __name__ == "__main__":
    test_recommendation_modern()

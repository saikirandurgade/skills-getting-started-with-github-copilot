import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

# Test GET /activities

def test_get_activities():
    # Arrange: No setup needed, activities are in-memory
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data

# Test POST /activities/{activity_name}/signup (success)

def test_signup_for_activity_success():
    # Arrange
    activity = "Chess Club"
    email = "newstudent@mergington.edu"
    assert email not in client.get("/activities").json()[activity]["participants"]
    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity}"
    # Confirm participant added
    participants = client.get("/activities").json()[activity]["participants"]
    assert email in participants

# Test POST /activities/{activity_name}/signup (duplicate)

def test_signup_for_activity_duplicate():
    # Arrange
    activity = "Chess Club"
    email = "michael@mergington.edu"  # Already signed up
    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"

# Test POST /activities/{activity_name}/signup (invalid activity)

def test_signup_for_activity_invalid():
    # Arrange
    activity = "Nonexistent Club"
    email = "student@mergington.edu"
    # Act
    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

# Test DELETE /activities/{activity_name}/participant (success)

def test_remove_participant_success():
    # Arrange
    activity = "Chess Club"
    email = "daniel@mergington.edu"
    assert email in client.get("/activities").json()[activity]["participants"]
    # Act
    response = client.delete(f"/activities/{activity}/participant", params={"email": email})
    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {email} from {activity}"
    # Confirm participant removed
    participants = client.get("/activities").json()[activity]["participants"]
    assert email not in participants

# Test DELETE /activities/{activity_name}/participant (invalid activity)

def test_remove_participant_invalid_activity():
    # Arrange
    activity = "Nonexistent Club"
    email = "student@mergington.edu"
    # Act
    response = client.delete(f"/activities/{activity}/participant", params={"email": email})
    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

# Test DELETE /activities/{activity_name}/participant (participant not found)

def test_remove_participant_not_found():
    # Arrange
    activity = "Chess Club"
    email = "ghost@mergington.edu"  # Not a participant
    # Act
    response = client.delete(f"/activities/{activity}/participant", params={"email": email})
    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"

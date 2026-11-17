"""
Backend tests — run from the backend/ directory:
    pytest tests/ -v
"""

WATER_CYCLE = """
The water cycle is the continuous movement of water within the Earth and atmosphere.
It includes evaporation, condensation, precipitation, and collection.
The sun drives the water cycle by heating surface water, causing it to evaporate into
water vapor. This vapor rises, cools, and condenses into clouds. Eventually, water falls
back as rain or snow. It then flows into rivers, lakes, and oceans, or soaks into the ground.
This cycle has no beginning or end and is essential for all life on Earth.
"""


# --- create quiz -----------------------------------------------------------

def test_create_quiz_returns_201_with_five_questions(client):
    resp = client.post("/api/quizzes", json={
        "title": "Water Cycle",
        "lesson_text": WATER_CYCLE,
        "age": 10,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Water Cycle"
    assert len(data["questions"]) == 5


def test_each_question_has_four_options_and_valid_answer(client):
    resp = client.post("/api/quizzes", json={
        "title": "Water Cycle",
        "lesson_text": WATER_CYCLE,
        "age": 10,
    })
    assert resp.status_code == 201
    for q in resp.json()["questions"]:
        assert len(q["options"]) == 4
        option_texts = [o["text"] for o in q["options"]]
        assert q["correct_answer"] in option_texts
        # exactly one option should be marked correct
        assert sum(1 for o in q["options"] if o["is_correct"]) == 1


def test_lesson_text_too_short_returns_422(client):
    resp = client.post("/api/quizzes", json={
        "title": "Short",
        "lesson_text": "Too short.",
        "age": 10,
    })
    assert resp.status_code == 422


def test_lesson_text_over_5000_chars_returns_422(client):
    resp = client.post("/api/quizzes", json={
        "title": "Long",
        "lesson_text": "a" * 5001,
        "age": 10,
    })
    assert resp.status_code == 422


def test_age_outside_range_returns_422(client):
    for bad_age in (7, 15):
        resp = client.post("/api/quizzes", json={
            "title": "Age test",
            "lesson_text": WATER_CYCLE,
            "age": bad_age,
        })
        assert resp.status_code == 422, f"age={bad_age} should fail"


# --- list quizzes ----------------------------------------------------------

def test_list_quizzes_empty_database(client):
    resp = client.get("/api/quizzes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["pages"] == 0


def test_list_quizzes_returns_newest_first(client):
    for title in ("First", "Second", "Third"):
        client.post("/api/quizzes", json={
            "title": title,
            "lesson_text": WATER_CYCLE,
            "age": 10,
        })
    resp = client.get("/api/quizzes")
    titles = [q["title"] for q in resp.json()["items"]]
    assert titles[0] == "Third"


def test_pagination_splits_results_correctly(client):
    for i in range(5):
        client.post("/api/quizzes", json={
            "title": f"Quiz {i + 1}",
            "lesson_text": WATER_CYCLE,
            "age": 10,
        })
    resp = client.get("/api/quizzes?page=1&size=3")
    data = resp.json()
    assert len(data["items"]) == 3
    assert data["total"] == 5
    assert data["pages"] == 2


# --- get single quiz -------------------------------------------------------

def test_get_quiz_not_found_returns_404(client):
    resp = client.get("/api/quizzes/9999")
    assert resp.status_code == 404


def test_get_quiz_returns_full_detail(client):
    create_resp = client.post("/api/quizzes", json={
        "title": "Water Cycle",
        "lesson_text": WATER_CYCLE,
        "age": 10,
    })
    quiz_id = create_resp.json()["id"]

    resp = client.get(f"/api/quizzes/{quiz_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == quiz_id
    assert data["age"] == 10
    assert len(data["questions"]) == 5

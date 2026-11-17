import os
import json
import re
from typing import List, Dict, Any

# Sample data for MOCK_LLM mode — always about the water cycle so reviewers
# can see the structure without needing a real API key.
MOCK_QUIZ_DATA = [
    {
        "question": "What drives the water cycle by heating surface water?",
        "options": ["The moon's gravity", "The sun's heat", "Wind currents", "Earth's rotation"],
        "correct_answer": "The sun's heat",
    },
    {
        "question": "What do we call the process where liquid water turns into water vapor?",
        "options": ["Condensation", "Precipitation", "Evaporation", "Collection"],
        "correct_answer": "Evaporation",
    },
    {
        "question": "What forms when water vapor rises, cools, and condenses in the atmosphere?",
        "options": ["Rain", "Clouds", "Ice", "Fog"],
        "correct_answer": "Clouds",
    },
    {
        "question": "Which of these is NOT a step in the water cycle?",
        "options": ["Evaporation", "Photosynthesis", "Condensation", "Precipitation"],
        "correct_answer": "Photosynthesis",
    },
    {
        "question": "After rain falls on land, where can the water go next?",
        "options": [
            "It stays on the surface forever",
            "It immediately turns back to vapor",
            "Into rivers, lakes, oceans, or underground",
            "It is destroyed",
        ],
        "correct_answer": "Into rivers, lakes, oceans, or underground",
    },
]


def _build_prompt(title: str, lesson_text: str, age: int) -> str:
    return f"""You are creating a multiple-choice quiz for students aged {age}.

Lesson Title: {title}
Lesson Content:
{lesson_text}

Create exactly 5 multiple-choice questions based ONLY on the lesson above.
Each question must have exactly 4 answer options.
The language should be appropriate for a {age}-year-old student.

Return ONLY a JSON array — no explanation, no markdown, no code fences:
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A"
  }}
]

Rules:
- correct_answer MUST exactly match one of the 4 options (copy-paste, no paraphrase)
- Questions should test understanding, not just memorization
- Return ONLY the raw JSON array"""


def _parse_and_validate(raw: str) -> List[Dict[str, Any]]:
    """Parse LLM output into validated quiz data."""
    # strip markdown code fences if the model added them anyway
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # last-resort: try to find the JSON array inside the text
        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if not match:
            raise ValueError("LLM returned output that could not be parsed as JSON")
        data = json.loads(match.group())

    if not isinstance(data, list):
        raise ValueError("Expected a JSON array from the LLM")
    if len(data) != 5:
        raise ValueError(f"Expected exactly 5 questions, got {len(data)}")

    validated = []
    for i, q in enumerate(data, start=1):
        missing = [k for k in ("question", "options", "correct_answer") if k not in q]
        if missing:
            raise ValueError(f"Question {i} is missing fields: {missing}")
        if not isinstance(q["options"], list) or len(q["options"]) != 4:
            raise ValueError(f"Question {i} must have exactly 4 options")
        if q["correct_answer"] not in q["options"]:
            raise ValueError(
                f"Question {i}: correct_answer '{q['correct_answer']}' "
                f"does not match any of the options"
            )
        validated.append(q)

    return validated


async def generate_quiz(title: str, lesson_text: str, age: int) -> List[Dict[str, Any]]:
    # check at call time so tests can toggle it without reloading the module
    if os.getenv("MOCK_LLM", "false").lower() == "true":
        return MOCK_QUIZ_DATA

    try:
        from openai import OpenAI
    except ImportError:
        raise ValueError("openai package not installed — run: pip install openai")

    groq_key = os.getenv("GROQ_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if groq_key:
        client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
        model = "qwen/qwen3.8-27b"
    elif openai_key:
        client = OpenAI(api_key=openai_key)
        model = "gpt-4o-mini"
    else:
        raise ValueError(
            "No LLM API key found. Set GROQ_API_KEY (free at console.groq.com) "
            "or OPENAI_API_KEY in your .env, or use MOCK_LLM=true for sample data."
        )

    prompt = _build_prompt(title, lesson_text, age)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are an educational quiz generator. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content
    return _parse_and_validate(raw)

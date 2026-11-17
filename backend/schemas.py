import math
from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, field_validator


class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    lesson_text: str
    age: int = Field(..., ge=8, le=14)

    @field_validator("lesson_text")
    @classmethod
    def validate_lesson_text(cls, v):
        stripped = v.strip()
        if len(stripped) < 50:
            raise ValueError("Lesson text must be at least 50 characters long")
        if len(v) > 5000:
            raise ValueError("Lesson text cannot exceed 5,000 characters")
        return v


class OptionOut(BaseModel):
    id: int
    text: str
    is_correct: bool

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id: int
    question_text: str
    correct_answer: str
    options: List[OptionOut]

    model_config = {"from_attributes": True}


class QuizListItem(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizDetail(BaseModel):
    id: int
    title: str
    age: int
    created_at: datetime
    questions: List[QuestionOut]

    model_config = {"from_attributes": True}


class PaginatedQuizzes(BaseModel):
    items: List[QuizListItem]
    total: int
    page: int
    size: int
    pages: int

import math
from dotenv import load_dotenv
load_dotenv()  # reads backend/.env

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, get_db, Base
import models
import schemas
from llm_service import generate_quiz

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lesson Quiz Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Lesson Quiz Generator API — visit /docs for the interactive docs"}


@app.post("/api/quizzes", response_model=schemas.QuizDetail, status_code=201)
async def create_quiz(quiz_data: schemas.QuizCreate, db: Session = Depends(get_db)):
    try:
        questions = await generate_quiz(
            title=quiz_data.title,
            lesson_text=quiz_data.lesson_text,
            age=quiz_data.age,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        msg = str(exc)
        # trim verbose OpenAI JSON error down to just the message field
        import re as _re
        m = _re.search(r"'message':\s*'([^']+)'", msg)
        raise HTTPException(status_code=500, detail=f"LLM error: {m.group(1) if m else msg}")

    db_quiz = models.Quiz(
        title=quiz_data.title,
        lesson_text=quiz_data.lesson_text,
        age=quiz_data.age,
    )
    db.add(db_quiz)
    db.flush()  # get the id before adding children

    for q in questions:
        db_question = models.Question(
            quiz_id=db_quiz.id,
            question_text=q["question"],
            correct_answer=q["correct_answer"],
        )
        db.add(db_question)
        db.flush()

        for opt_text in q["options"]:
            db.add(
                models.Option(
                    question_id=db_question.id,
                    text=opt_text,
                    is_correct=(opt_text == q["correct_answer"]),
                )
            )

    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@app.get("/api/quizzes", response_model=schemas.PaginatedQuizzes)
def list_quizzes(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * size
    total = db.query(models.Quiz).count()
    quizzes = (
        db.query(models.Quiz)
        .order_by(desc(models.Quiz.created_at))
        .offset(offset)
        .limit(size)
        .all()
    )
    return {
        "items": quizzes,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0,
    }


@app.get("/api/quizzes/{quiz_id}", response_model=schemas.QuizDetail)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

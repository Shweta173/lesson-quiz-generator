import { useState, useEffect } from "react";
import { listQuizzes } from "../api.js";

const TOPIC_ICONS = ["🧬","🪐","🌊","🦁","🔬","🌱","⚡","🎨","🔭","🏔️","🧪","🦋","🌍","🤖","🎯"];

export default function QuizList({ onSelect, onCreateNew }) {
  const [data, setData]       = useState(null);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listQuizzes(page, 10)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
        <p>Loading quizzes…</p>
      </div>
    );
  }
  if (error) {
    return <div className="alert alert-error"><span>⚠️</span><span>Could not load quizzes: {error}</span></div>;
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-header-left">
          <h2>
            ✨ Saved Quizzes
            {data && <span className="page-title-count">{data.total}</span>}
          </h2>
          <p>Your previously generated quizzes</p>
        </div>
        <button className="btn-new-quiz" onClick={onCreateNew}>
          <span className="btn-new-quiz-plus">+</span>
          New Quiz
        </button>
      </div>

      {data?.items?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No quizzes yet</h3>
          <p>Generate your first quiz from a lesson and it'll appear here.</p>
          <button className="btn-new-quiz" onClick={onCreateNew}>
            <span className="btn-new-quiz-plus">+</span> New Quiz
          </button>
        </div>
      ) : (
        <>
          {data.items.map((quiz, idx) => {
            const globalNum = (page - 1) * 10 + idx + 1;
            const icon = TOPIC_ICONS[(globalNum - 1) % TOPIC_ICONS.length];
            return (
              <div key={quiz.id} className="quiz-item" onClick={() => onSelect(quiz.id)}>
                <div className="quiz-item-num">#{globalNum}</div>
                <div className="quiz-item-icon">{icon}</div>
                <div className="quiz-item-body">
                  <div className="quiz-item-title">{quiz.title}</div>
                  <div className="quiz-item-meta">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {new Date(quiz.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    <span className="quiz-item-badge">
                      ❓ 5 questions
                    </span>
                  </div>
                </div>
                <div className="quiz-item-arrow">›</div>
              </div>
            );
          })}

          {data.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span>Page {page} of {data.pages}</span>
              <button className="btn btn-secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

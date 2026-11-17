import { useState, useEffect } from "react";
import { getQuiz } from "../api.js";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizView({ quizId, onBack }) {
  const [quiz, setQuiz]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [answers, setAnswers] = useState({});   // { [questionId]: selectedText }
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    getQuiz(quizId)
      .then(setQuiz)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
        <p>Loading quiz…</p>
      </div>
    );
  }
  if (error) return <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>;
  if (!quiz)  return null;

  const total       = quiz.questions.length;
  const answered    = Object.keys(answers).length;
  const allAnswered = answered === total;
  const progressPct = submitted ? 100 : (answered / total) * 100;

  const score = submitted
    ? quiz.questions.filter((q) => answers[q.id] === q.correct_answer).length
    : 0;

  function scoreBannerClass() {
    const pct = (score / total) * 100;
    if (pct >= 80) return "great";
    if (pct >= 60) return "good";
    return "ok";
  }

  function scoreMessage() {
    const pct = (score / total) * 100;
    if (pct === 100) return "🎉 Perfect score! Absolutely brilliant!";
    if (pct >= 80)   return "🌟 Great job! Almost perfect!";
    if (pct >= 60)   return "👍 Good effort! Keep studying!";
    return "📖 Keep going — you'll get there!";
  }

  function optionClass(question, optText) {
    if (!submitted) return answers[question.id] === optText ? "selected" : "";
    if (optText === question.correct_answer) return "correct";
    if (optText === answers[question.id])    return "wrong";
    return "";
  }

  return (
    <div className="fade-up">
      <button className="back-link" onClick={onBack}>← Back to list</button>

      {/* quiz header card */}
      <div className="quiz-view-header">
        <h2>{quiz.title}</h2>
        <div className="quiz-view-meta">
          <span>🎯 {total} questions</span>
          <span>👦 Age {quiz.age}</span>
        </div>
        <div className="quiz-progress">
          <div className="quiz-progress-label">
            <span>{submitted ? "✅ Completed" : `${answered} of ${total} answered`}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* questions */}
      {quiz.questions.map((question, idx) => (
        <div key={question.id} className="question-card">
          <div className="q-header">
            <span className="q-badge">Q{idx + 1}</span>
            <span className="q-text">{question.question_text}</span>
          </div>

          <div className="options-list">
            {question.options.map((opt, oIdx) => (
              <label
                key={opt.id}
                className={`option-label ${optionClass(question, opt.text)}`}
                data-disabled={submitted || undefined}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={opt.text}
                  disabled={submitted}
                  checked={answers[question.id] === opt.text}
                  onChange={() =>
                    !submitted &&
                    setAnswers((prev) => ({ ...prev, [question.id]: opt.text }))
                  }
                />
                <span className="option-letter">{LETTERS[oIdx]}</span>
                <span className="option-text">{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* score banner */}
      {submitted && (
        <div className={`score-banner ${scoreBannerClass()}`}>
          <div className="score-row">
            <span className="score-num">{score}</span>
            <span className="score-denom">/{total}</span>
          </div>
          <div className="score-msg">{scoreMessage()}</div>
        </div>
      )}

      {/* actions */}
      {!submitted ? (
        <div className="quiz-submit">
          <button
            className="btn btn-teal"
            disabled={!allAnswered}
            onClick={() => setSubmitted(true)}
          >
            Submit Answers
          </button>
          {!allAnswered && (
            <small>{total - answered} question{total - answered !== 1 ? "s" : ""} remaining</small>
          )}
        </div>
      ) : (
        <div className="quiz-actions">
          <button
            className="btn btn-secondary"
            onClick={() => { setAnswers({}); setSubmitted(false); }}
          >
            🔄 Try Again
          </button>
          <button className="btn btn-primary" onClick={onBack}>
            Back to List
          </button>
        </div>
      )}
    </div>
  );
}

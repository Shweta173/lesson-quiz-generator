import { useState } from "react";
import { createQuiz } from "../api.js";

const MIN_CHARS = 50;
const MAX_CHARS = 5000;

export default function QuizForm({ onCreated, onCancel }) {
  const [title, setTitle]       = useState("");
  const [age, setAge]           = useState(10);
  const [lessonText, setLessonText] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const charCount = lessonText.length;
  const isOver    = charCount > MAX_CHARS;
  const isUnder   = charCount > 0 && charCount < MIN_CHARS;
  const fillPct   = Math.min((charCount / MAX_CHARS) * 100, 100);
  const barClass  = isOver ? "over" : isUnder ? "warn" : "";
  const canSubmit = !loading && !isOver && charCount >= MIN_CHARS && title.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const quiz = await createQuiz({
        title: title.trim(),
        lesson_text: lessonText,
        age: Number(age),
      });
      onCreated(quiz);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card fade-up">
      <div className="form-section-title">
        ✏️ Create a New Quiz
      </div>

      <form className="quiz-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="title">Quiz Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The Solar System"
            required
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Student Age</label>
          <select id="age" value={age} onChange={(e) => setAge(e.target.value)}>
            {[8, 9, 10, 11, 12, 13, 14].map((a) => (
              <option key={a} value={a}>{a} years old</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="lesson">Lesson Text</label>
          <textarea
            id="lesson"
            value={lessonText}
            onChange={(e) => setLessonText(e.target.value)}
            placeholder="Paste the lesson content here (50 – 5,000 characters)…"
            rows={9}
            required
          />
          <div className="char-wrap">
            <div className="char-bar-track">
              <div className={`char-bar-fill ${barClass}`} style={{ width: `${fillPct}%` }} />
            </div>
            <span className={`char-counter ${barClass}`}>
              {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            </span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="alert alert-info">
            <span>🤖</span><span>Generating quiz… this usually takes 5–15 seconds.</span>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
            disabled={!canSubmit}
          >
            {loading ? "⏳ Generating…" : "✨ Generate Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
}

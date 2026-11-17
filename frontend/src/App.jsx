import { useState } from "react";
import QuizForm from "./components/QuizForm.jsx";
import QuizList from "./components/QuizList.jsx";
import QuizView from "./components/QuizView.jsx";

export default function App() {
  const [view, setView]                     = useState("list");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [listKey, setListKey]               = useState(0);

  function openQuiz(id) { setSelectedQuizId(id); setView("quiz"); }
  function handleQuizCreated(quiz) { setListKey((k) => k + 1); openQuiz(quiz.id); }

  return (
    <div className="layout">
      {/* ---- sidebar ---- */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">🤖</div>
          <h1>Robokidz</h1>
          <p>Eduventure</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${view === "list" || view === "quiz" ? "active" : ""}`}
            onClick={() => setView("list")}
          >
            <span className="sidebar-link-icon">📚</span> All Quizzes
          </button>
          <button
            className={`sidebar-link ${view === "create" ? "active" : ""}`}
            onClick={() => setView("create")}
          >
            <span className="sidebar-link-icon">⭐</span> New Quiz
          </button>
        </nav>

      </aside>

      {/* ---- main ---- */}
      <div className="main-content">
        <div className="page-body">
          {view === "list" && (
            <QuizList key={listKey} onSelect={openQuiz} onCreateNew={() => setView("create")} />
          )}
          {view === "create" && (
            <QuizForm onCreated={handleQuizCreated} onCancel={() => setView("list")} />
          )}
          {view === "quiz" && selectedQuizId != null && (
            <QuizView quizId={selectedQuizId} onBack={() => setView("list")} />
          )}
        </div>
      </div>
    </div>
  );
}

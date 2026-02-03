// src/App.js
import { useEffect, useReducer } from "react";
import {
  dsaQuestions,
  dbmsQuestions,
  osQuestions,
  cloudQuestions
} from "./data/questions.js";
import "./App.css";

const TOTAL_TIME = 60; // seconds for each subject quiz

// Helper: get questions for selected subject
function getQuestionsBySubject(subject) {
  switch (subject) {
    case "DSA":
      return dsaQuestions;
    case "DBMS":
      return dbmsQuestions;
    case "OS":
      return osQuestions;
    case "Cloud":
      return cloudQuestions;
    default:
      return [];
  }
}

// Initial state
const initialState = {
  subject: null,      // "DSA", "DBMS", "OS", "Cloud", or null
  questions: [],      // current subject's questions
  status: "idle",     // "idle" | "ready" | "active" | "finished"
  index: 0,
  answers: [],
  timeLeft: TOTAL_TIME
};

// Reducer
function reducer(state, action) {
  switch (action.type) {
    case "chooseSubject": {
      const subject = action.payload;
      const qs = getQuestionsBySubject(subject);
      return {
        subject,
        questions: qs,
        status: "ready",
        index: 0,
        answers: [],
        timeLeft: TOTAL_TIME
      };
    }

    case "start":
      return {
        ...state,
        status: "active",
        answers: Array(state.questions.length).fill(null),
        index: 0,
        timeLeft: TOTAL_TIME
      };

    case "select": {
      const newAnswers = [...state.answers];
      newAnswers[state.index] = action.payload;
      return { ...state, answers: newAnswers };
    }

    case "next":
      return {
        ...state,
        index: Math.min(state.index + 1, state.questions.length - 1)
      };

    case "prev":
      return { ...state, index: Math.max(state.index - 1, 0) };

    case "tick":
      if (state.timeLeft <= 1) {
        return { ...state, timeLeft: 0, status: "finished" };
      }
      return { ...state, timeLeft: state.timeLeft - 1 };

    case "finish":
      return { ...state, status: "finished" };

    case "restart": {
      const qs = getQuestionsBySubject(state.subject);
      return {
        subject: state.subject,
        questions: qs,
        status: "ready",
        index: 0,
        answers: [],
        timeLeft: TOTAL_TIME
      };
    }

    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { subject, questions, status, index, answers, timeLeft } = state;

  const question = questions[index];

  // score
  const score =
    answers.length === 0
      ? 0
      : answers.reduce((acc, ans, i) => {
          if (ans === questions[i].correctIndex) return acc + 1;
          return acc;
        }, 0);

  // timer
  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  return (
    <div className="app">
      {/* HEADER + SUBJECT BUTTONS */}
      <header className="app-header">
        <h1>Tech Interview Prep Quiz</h1>
        <p>Select a subject to practice: DSA · DBMS · OS · Cloud</p>

        <div className="subject-buttons">
          <button
            className={`btn small ${subject === "DSA" ? "primary" : ""}`}
            onClick={() =>
              dispatch({ type: "chooseSubject", payload: "DSA" })
            }
          >
            DSA
          </button>
          <button
            className={`btn small ${subject === "DBMS" ? "primary" : ""}`}
            onClick={() =>
              dispatch({ type: "chooseSubject", payload: "DBMS" })
            }
          >
            DBMS
          </button>
          <button
            className={`btn small ${subject === "OS" ? "primary" : ""}`}
            onClick={() =>
              dispatch({ type: "chooseSubject", payload: "OS" })
            }
          >
            OS
          </button>
          <button
            className={`btn small ${subject === "Cloud" ? "primary" : ""}`}
            onClick={() =>
              dispatch({ type: "chooseSubject", payload: "Cloud" })
            }
          >
            Cloud
          </button>
        </div>
      </header>

      {/* NO SUBJECT SELECTED */}
      {status === "idle" && (
        <div className="card center">
          <p>Click on DSA / DBMS / OS / Cloud to start a quiz.</p>
        </div>
      )}

      {/* READY SCREEN (subject chosen, quiz not started) */}
      {status === "ready" && subject && (
        <div className="card center">
          <h2>{subject} Quiz</h2>
          <p>
            Questions: <strong>{questions.length}</strong> · Time:{" "}
            <strong>{TOTAL_TIME} seconds</strong>
          </p>
          <button
            className="btn primary"
            onClick={() => dispatch({ type: "start" })}
          >
            Start {subject} Quiz
          </button>
        </div>
      )}

      {/* ACTIVE QUIZ */}
      {status === "active" && question && (
        <>
          <div className="top-bar">
            <div>
              {subject} · Question {index + 1} / {questions.length}
            </div>
            <div className={`timer ${timeLeft <= 10 ? "danger" : ""}`}>
              Time left: {timeLeft}s
            </div>
          </div>

          <div className="card">
            <h2 className="question-text">{question.question}</h2>
            <ul className="options">
              {question.options.map((opt, i) => (
                <li
                  key={i}
                  className={
                    answers[index] === i ? "option selected" : "option"
                  }
                  onClick={() =>
                    dispatch({ type: "select", payload: i })
                  }
                >
                  <span className="option-index">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{opt}</span>
                </li>
              ))}
            </ul>

            <div className="navigation">
              <button
                className="btn"
                onClick={() => dispatch({ type: "prev" })}
                disabled={index === 0}
              >
                Previous
              </button>

              {index < questions.length - 1 ? (
                <button
                  className="btn primary"
                  onClick={() => dispatch({ type: "next" })}
                >
                  Next
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => dispatch({ type: "finish" })}
                >
                  Finish Quiz
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* RESULT SCREEN */}
      {status === "finished" && (
        <ResultScreen
          subject={subject}
          questions={questions}
          answers={answers}
          score={score}
          onRestart={() => dispatch({ type: "restart" })}
        />
      )}
    </div>
  );
}

// Result component
function ResultScreen({ subject, questions, answers, score, onRestart }) {
  const total = questions.length;

  return (
    <div className="card">
      <h2>{subject} Quiz Completed 🎉</h2>
      <p>
        Your score: <strong>{score}</strong> / {total}
      </p>

      <h3 style={{ marginTop: "1.5rem" }}>Review Answers:</h3>
      <ul className="review-list">
        {questions.map((q, idx) => {
          const userAns = answers[idx];
          const isCorrect = userAns === q.correctIndex;
          return (
            <li key={q.id} className="review-item">
              <p className="review-question">
                {idx + 1}. {q.question}
              </p>
              <p>
                Your answer:{" "}
                <span className={isCorrect ? "correct" : "wrong"}>
                  {userAns !== null ? q.options[userAns] : "Not answered"}
                </span>
              </p>
              <p>
                Correct answer:{" "}
                <span className="correct">
                  {q.options[q.correctIndex]}
                </span>
              </p>
              <p className="explanation">{q.explanation}</p>
            </li>
          );
        })}
      </ul>

      <button className="btn primary" onClick={onRestart}>
        Try {subject} Again
      </button>
    </div>
  );
}

export default App;

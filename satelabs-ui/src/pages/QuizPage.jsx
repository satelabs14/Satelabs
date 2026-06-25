import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../context/AuthContext';
import './Quiz.css';

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  useEffect(() => {

  const loadData = async () => {

    const token = localStorage.getItem("satelabs_token");

    try {

      const [quizRes, progressRes] = await Promise.all([

        axios.get(`${API_BASE}/quiz`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        axios.get(`${API_BASE}/quiz/progress/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

      ]);

      setQuizzes(quizRes.data || []);

      setCompletedQuizzes(
        progressRes.data.map(item => item.quiz_id)
      );

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  loadData();

}, []);

  const startQuiz = async (quiz) => {
    setQuizLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/quiz/${quiz.id}/questions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('satelabs_token')}` }
      });
      setQuestions(res.data || []);
      setActiveQuiz(quiz);
      setCurrent(0);
      setSelected(null);
      setAnswers([]);
      setResult(null);
    } catch {
      setQuestions([]);
      setActiveQuiz(quiz);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (option) => {

  setSelected(option);

  const filtered = answers.filter(
    a => a.question_id !== questions[current].id
  );

  setAnswers([
    ...filtered,
    {
      question_id: questions[current].id,
      answer: option
    }
  ]);
};

  const handleNext = async () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      // Submit quiz
      try {
        const res = await axios.post(`${API_BASE}/quiz/${activeQuiz.id}/submit`, { answers }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('satelabs_token')}` }
        });
        setResult(res.data);
      } catch {
        setResult({ score: 0, total: questions.length, passed: false });
      }
    }
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
    setResult(null);
    setQuestions([]);
  };

  const q = questions[current];
  const pct = result ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="page quiz-page">
      {!activeQuiz ? (
        <>
          <div className="page-header">
            <p className="page-eyebrow">// KNOWLEDGE CHECKS</p>
            <h1 className="page-title">Quizzes</h1>
            <p className="page-subtitle">Test your knowledge and earn points</p>
          </div>

          {loading ? (
            <div className="quiz-list">
              {[1,2,3].map(i => <div key={i} className="quiz-skeleton" />)}
            </div>
          ) : (
            <div className="quiz-list">
              {quizzes.map(quiz => {

                const completed =
                  completedQuizzes.includes(quiz.id);

                return (
                <div key={quiz.id} className="quiz-card">
                  <div className="quiz-card-left">
                    <h3 className="quiz-card-title">{quiz.title}</h3>
                    <p className="quiz-card-desc">{quiz.description || 'Test your knowledge on this topic.'}</p>
                    <div className="quiz-meta">
                      <span className="quiz-meta-item mono">◇ {quiz.questions_count || '?'} questions</span>
                      <span className="quiz-meta-item mono">◈ {quiz.points || 100} pts</span>
                      {quiz.time_limit && (
                        <span className="quiz-meta-item mono">⏱ {quiz.time_limit}m</span>
                      )}
                    </div>
                  </div>
                  <button
                    className={
                      completed
                        ? "btn-completed"
                        : "btn-quiz-start"
                    }
                    onClick={() => startQuiz(quiz)}
                    disabled={quizLoading}
                  >
                    {completed
                      ? "✓ Completed (Retake Available)"
                      : "Start Quiz"}
                  </button>
                </div>
              );
              })}

              {quizzes.length === 0 && (
                <div className="courses-empty">
                  <p className="empty-icon">◇</p>
                  <p>No quizzes available yet</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : result ? (
        /* Result screen */
        <div className="quiz-result fade-in-up">
          <div className="result-card">
            <div className={`result-icon ${result.passed ? 'passed' : 'failed'}`}>
              {result.passed ? '✓' : '✕'}
            </div>
            <h2 className="result-title">
              {result.passed ? 'Quiz Passed!' : 'Keep Practising'}
            </h2>
            <p className="result-subtitle">{activeQuiz.title}</p>

            <div className="result-score">
              <span className="score-number mono">{result.score}</span>
              <span className="score-sep">/</span>
              <span className="score-total mono">{result.total}</span>
            </div>

            <div className="result-bar">
              <div className="progress-track" style={{ height: 10 }}>
                <div
                  className={`progress-fill ${result.passed ? '' : 'progress-fill-amber'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pct}%</span>
            </div>

            {result.points_earned > 0 && (
            <p className="result-points">
              +{result.points_earned} pts earned
            </p>
            )}

            <div className="review-section">

  {result.review?.map((item,index) => (

    <div
      key={index}
      className="review-card"
    >

      <h4>
        {item.question}
      </h4>

      <p>
        Your Answer:
        <strong>
          {item.your_answer}
        </strong>
      </p>

      <p>
        Correct Answer:
        <strong>
          {item.correct_answer}
        </strong>
      </p>

      <p
        style={{
          color: item.is_correct
            ? "#22c55e"
            : "#ef4444"
        }}
      >
        {item.is_correct
          ? "✓ Correct"
          : "✗ Wrong"}
      </p>

    </div>

  ))}

</div>

            <div className="result-actions">

  <button
    className="btn-primary result-btn"
    onClick={() => startQuiz(activeQuiz)}
  >
    Retake Quiz
  </button>

  <button
    className="btn-outline-sm"
    onClick={exitQuiz}
  >
    Back to Quizzes
  </button>

</div>
          </div>
        </div>
      ) : (
        /* Active quiz */
        <div className="quiz-active fade-in-up">
          <div className="quiz-progress-header">
            <button className="btn-exit" onClick={exitQuiz}>← Exit</button>
            <div className="quiz-progress-info">
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {current + 1} / {questions.length}
              </span>
            </div>
            <div className="quiz-progress-track">
              <div
                className="progress-fill"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {q ? (
            <div className="question-card">
              <p className="question-number mono">Question {current + 1}</p>
              <h2 className="question-text">{q.question || q.text}</h2>

              <div className="options-list">
                {[
                  q.option_a,
                  q.option_b,
                  q.option_c,
                  q.option_d
                ].map((opt, i) =>  {
                  let cls = 'option-btn';

                  if (selected === opt) {
                  cls += ' selected';
              }
                  return (
                    <button
                      key={i}
                      className={cls}
                      onClick={() => handleAnswer(opt)}
                    >
                      <span className="option-letter mono">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <button className="btn-next" onClick={handleNext}>
                  {current < questions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
                </button>
              )}
            </div>
          ) : (
            <div className="courses-empty">
              <p>No questions found for this quiz.</p>
              <button className="btn-outline-sm" onClick={exitQuiz}>Go back</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

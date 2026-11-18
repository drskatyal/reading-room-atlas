import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import type { ResidentQuizQuestion } from '../types/atlas';

interface EditorialGuidePanelProps {
  quizQuestions: ResidentQuizQuestion[];
  quizQuestion: ResidentQuizQuestion;
  quizIndex: number;
  quizAnswers: Record<string, string>;
  onSelectQuizQuestion: (index: number) => void;
  onAnswerQuiz: (optionId: string) => void;
  onResetQuiz: () => void;
}

export function EditorialGuidePanel({
  quizQuestions,
  quizQuestion,
  quizIndex,
  quizAnswers,
  onSelectQuizQuestion,
  onAnswerQuiz,
  onResetQuiz,
}: EditorialGuidePanelProps) {
  const [hintShown, setHintShown] = useState(false);

  const total = quizQuestions.length;
  const selectedId = quizAnswers[quizQuestion.id];
  const answered = selectedId !== undefined;
  const isCorrect = answered && selectedId === quizQuestion.correctOptionId;
  const correctCount = quizQuestions.filter(
    (q) => quizAnswers[q.id] === q.correctOptionId
  ).length;
  const answeredCount = Object.keys(quizAnswers).length;

  return (
    <aside className="mode-sidebar quiz-sidebar" aria-label="Case quiz guide">
      <div className="sidebar-sticky-head">
        <div className="rail-head">
          <span className="quiz-strip-score">
            Score <strong>{correctCount}/{total}</strong>
          </span>
          <div className="step-arrows">
            {answeredCount > 0 && (
              <button
                type="button"
                className="mini-chip"
                onClick={onResetQuiz}
                title="Reset quiz answers"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              className="arrow-btn"
              onClick={() => {
                setHintShown(false);
                onSelectQuizQuestion(quizIndex - 1);
              }}
              disabled={quizIndex === 0}
              aria-label="Previous question"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="arrow-btn"
              onClick={() => {
                setHintShown(false);
                onSelectQuizQuestion(quizIndex + 1);
              }}
              disabled={quizIndex === total - 1}
              aria-label="Next question"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="quiz-q-pills">
          {quizQuestions.map((q, idx) => {
            const c = quizAnswers[q.id];
            const ok = c !== undefined && c === q.correctOptionId;
            const bad = c !== undefined && c !== q.correctOptionId;
            return (
              <button
                key={q.id}
                type="button"
                className={`quiz-num-pill ${idx === quizIndex ? 'active' : ''} ${ok ? 'ok' : bad ? 'bad' : ''}`}
                onClick={() => {
                  setHintShown(false);
                  onSelectQuizQuestion(idx);
                }}
              >
                Q{idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rail-scroll">
        <span className="deck-tag">
          {quizQuestion.kind === 'locate' ? 'Pinpoint on 3D / MRI' : 'Board Vignette'}
        </span>
        <h2 className="rail-title">
          Case {quizIndex + 1} of {total}
        </h2>
        <p className="rail-lead">{quizQuestion.prompt}</p>

        <div className="rail-hint-row">
          <button
            type="button"
            className={`mini-chip ${hintShown ? 'active' : ''}`}
            onClick={() => setHintShown((h) => !h)}
          >
            <HelpCircle size={12} />
            <span>{hintShown ? 'Hide Hint' : 'Show Clinical Hint'}</span>
          </button>
          {hintShown && <div className="quiz-hint-banner">{quizQuestion.hint}</div>}
        </div>

        <div className="quiz-vertical-options">
          {quizQuestion.options.map((opt) => {
            const selected = selectedId === opt.id;
            const optCorrect = opt.id === quizQuestion.correctOptionId;
            let stateClass = '';
            if (answered) {
              if (optCorrect) stateClass = 'correct';
              else if (selected) stateClass = 'wrong';
            } else if (selected) {
              stateClass = 'selected';
            }
            return (
              <button
                key={opt.id}
                type="button"
                className={`quiz-option-btn ${stateClass}`}
                onClick={() => onAnswerQuiz(opt.id)}
              >
                <span>{opt.label}</span>
                {answered && optCorrect && <CheckCircle2 size={14} className="quiz-ok-icon" />}
                {answered && selected && !optCorrect && (
                  <XCircle size={14} className="quiz-bad-icon" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`quiz-feedback-card ${isCorrect ? 'ok' : 'review'}`}>
            <div className="quiz-feedback-head">
              {isCorrect ? 'Correct Identification' : 'Review Highlighted Target'}
            </div>
            <p className="quiz-feedback-text">{quizQuestion.explanation}</p>
          </div>
        )}

        {answered && quizIndex < total - 1 && (
          <button
            type="button"
            className="chip-btn primary-chip rail-full-btn"
            onClick={() => {
              setHintShown(false);
              onSelectQuizQuestion(quizIndex + 1);
            }}
          >
            <span>Next Case ({quizIndex + 2} of {total})</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}

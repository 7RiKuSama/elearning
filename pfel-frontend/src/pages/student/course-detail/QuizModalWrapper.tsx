// File: src/pages/student/course-detail/QuizModalWrapper.tsx
import React from 'react';
import type { Evaluation } from '../../../types';
import QuizPlayerModal, { type QuizQuestionItem } from '../../components/QuizPlayerModal';

interface QuizModalWrapperProps {
  activeQuizEval: Evaluation | null;
  questions: QuizQuestionItem[];
  onClose: () => void;
  onCompleted: () => void;
}

export const QuizModalWrapper: React.FC<QuizModalWrapperProps> = ({
  activeQuizEval,
  questions,
  onClose,
  onCompleted,
}) => {
  if (!activeQuizEval) return null;

  return (
    <QuizPlayerModal
      evaluationId={activeQuizEval.id_evaluation}
      title={activeQuizEval.titre}
      questions={questions}
      onClose={onClose}
      onSubmitted={onCompleted}
    />
  );
};

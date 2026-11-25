// File: src/pages/student/course-detail/QuizModalWrapper.tsx
import React from 'react';
import type { Evaluation } from '../../../types';
import { submitEvaluationQuiz } from '../../../api/services';
import QuizPlayerModal, {
  type QuizQuestionItem,
  type QuizSubmissionResult,
} from '../../components/QuizPlayerModal';

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

  const handleSubmitAnswers = async (
    answers: Record<number, number>
  ): Promise<QuizSubmissionResult> => {
    const res = await submitEvaluationQuiz(activeQuizEval.id_evaluation, answers);
    onCompleted();
    return res as QuizSubmissionResult;
  };

  return (
    <QuizPlayerModal
      evaluation={activeQuizEval}
      questions={questions}
      onSubmitAnswers={handleSubmitAnswers}
      onClose={onClose}
    />
  );
};

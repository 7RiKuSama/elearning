// File: internal/models/quiz.go
package models

import "time"

type QuizQuestion struct {
	IDQuestion     int      `json:"id_question"`
	IDEvaluation   int      `json:"id_evaluation"`
	QuestionType   string   `json:"question_type"` // "mcq" | "true_false"
	Prompt         string   `json:"prompt"`
	Options        []string `json:"options"`
	CorrectIndex   *int     `json:"correct_index,omitempty"`
	Points         float64  `json:"points"`
	Explanation    string   `json:"explanation,omitempty"`
	OrdreAffichage int      `json:"ordre_affichage"`
}

type SaveQuizRequest struct {
	Questions []QuizQuestion `json:"questions"`
}

type SubmitQuizRequest struct {
	Answers map[int]int `json:"answers"` // map[id_question]selected_index
}

type QuizQuestionResult struct {
	IDQuestion    int     `json:"id_question"`
	IsCorrect     bool    `json:"is_correct"`
	SelectedIndex int     `json:"selected_index"`
	CorrectIndex  int     `json:"correct_index"`
	PointsEarned  float64 `json:"points_earned"`
	Explanation   string  `json:"explanation"`
}

type QuizSubmissionResponse struct {
	Score    float64              `json:"score"`
	MaxScore float64              `json:"max_score"`
	Results  []QuizQuestionResult `json:"results"`
}

type QuizAttempt struct {
	IDAttempt    int       `json:"id_attempt"`
	IDEvaluation int       `json:"id_evaluation"`
	IDStudent    string    `json:"id_etudiant"`
	Score        float64   `json:"score"`
	MaxScore     float64   `json:"max_score"`
	SubmittedAt  time.Time `json:"submitted_at"`
}

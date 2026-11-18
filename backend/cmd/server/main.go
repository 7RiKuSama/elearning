// File: cmd/server/main.go
package main

import (
	"database/sql"
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib"
	"pfel-elearning/internal/config"
	"pfel-elearning/internal/handlers"
	"pfel-elearning/internal/middleware"
	"pfel-elearning/internal/repository"
)

func main() {
	cfg := config.LoadConfig()

	db, err := sql.Open("pgx", cfg.DBUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("Database not reachable: %v\n", err)
	}
	log.Println("Successfully connected to the database!")

	// Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	courseRepo := repository.NewCourseRepository(db)
	evalRepo := repository.NewEvaluationRepository(db)
	resourceRepo := repository.NewResourceRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	forumRepo := repository.NewForumRepository(db)
	enrollmentRepo := repository.NewEnrollmentRepository(db)
	statsRepo := repository.NewStatsRepository(db)

	// Initialize Handlers
	authHandler := &handlers.AuthHandler{UserRepo: userRepo, JWTSecret: cfg.JWTSecret}
	courseHandler := &handlers.CourseHandler{CourseRepo: courseRepo}
	userHandler := &handlers.UserHandler{UserRepo: userRepo}
	evalHandler := &handlers.EvalHandler{EvalRepo: evalRepo}
	resourceHandler := &handlers.ResourceHandler{ResourceRepo: resourceRepo}
	categoryHandler := &handlers.CategoryHandler{CategoryRepo: categoryRepo}
	forumHandler := &handlers.ForumHandler{ForumRepo: forumRepo}
	enrollmentHandler := &handlers.EnrollmentHandler{EnrollRepo: enrollmentRepo}
	statsHandler := &handlers.StatsHandler{StatsRepo: statsRepo}

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	// Servir les fichiers uploadés statiquement
	r.Static("/uploads", "./uploads")

	// Public routes
	r.POST("/api/login", authHandler.Login)
	r.POST("/api/register", authHandler.Register)
	r.GET("/api/cours", courseHandler.ListCatalog)
	r.GET("/api/categories", categoryHandler.ListCategories)

	// Protected routes
	protected := r.Group("/api", middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Common (Profil & Upload de fichier)
		protected.GET("/profil", userHandler.GetProfile)
		protected.POST("/upload", handlers.UploadFile)

		// Student (Strictement réservé aux étudiants)
		protected.POST("/cours/:id/inscription", middleware.RequireRole("etudiant"), enrollmentHandler.Enroll)
		protected.GET("/mes-cours", middleware.RequireRole("etudiant"), enrollmentHandler.MyEnrollments)
		protected.POST("/evaluations/:id/soumissions", middleware.RequireRole("etudiant"), evalHandler.SubmitWork)
		protected.GET("/mes-notes", middleware.RequireRole("etudiant"), evalHandler.GetStudentGrades)

		// Course Content / Resources & Evaluations (Accessible aux étudiants et enseignants)
		protected.GET("/cours/:id/ressources", resourceHandler.ListResources)
		protected.GET("/cours/:id/evaluations", evalHandler.ListEvaluations)

		// Forum
		protected.GET("/cours/:id/forum", forumHandler.GetCourseForum)
		protected.POST("/cours/:id/forum", forumHandler.PostMessage)
		protected.DELETE("/forum/messages/:id", middleware.RequireRole("enseignant", "admin"), forumHandler.DeleteMessage)

		// Teacher & Admin
		protected.POST("/categories", middleware.RequireRole("admin", "enseignant"), categoryHandler.CreateCategory)
		protected.POST("/cours", middleware.RequireRole("enseignant", "admin"), courseHandler.CreateCourse)
		protected.POST("/cours/:id/ressources", middleware.RequireRole("enseignant"), resourceHandler.UploadResource)
		protected.POST("/cours/:id/evaluations", middleware.RequireRole("enseignant"), evalHandler.CreateEvaluation)
		protected.PUT("/cours/:id", middleware.RequireRole("enseignant", "admin"), courseHandler.UpdateCourse)
		protected.GET("/evaluations/:id/soumissions", middleware.RequireRole("enseignant", "admin"), evalHandler.ListSubmissions)
		protected.PUT("/soumissions/:id/note", middleware.RequireRole("enseignant", "admin"), evalHandler.GradeSubmission)
		protected.GET("/cours/:id/etudiants", middleware.RequireRole("enseignant", "admin"), enrollmentHandler.GetCourseStudents)

		// Admin
		protected.GET("/statistiques", middleware.RequireRole("admin"), statsHandler.GetPlatformStats)
		protected.GET("/utilisateurs", middleware.RequireRole("admin"), userHandler.ListUsers)
		protected.PUT("/utilisateurs/:id/statut", middleware.RequireRole("admin"), userHandler.UpdateUserStatus)
		protected.PUT("/utilisateurs/:id/role", middleware.RequireRole("admin"), userHandler.UpdateUserRole)
		protected.DELETE("/utilisateurs/:id", middleware.RequireRole("admin"), userHandler.DeleteUser)
		protected.PUT("/cours/:id/enseignant", middleware.RequireRole("admin"), courseHandler.AssignTeacher)
	}

	log.Printf("Server starting on port %s\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}

// File: cmd/server/main.go
package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strings"

	"pfel-elearning/internal/handlers"
	"pfel-elearning/internal/middleware"
	"pfel-elearning/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	_ = godotenv.Load()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://admin:secret@localhost:5432/pfel_db?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-me-in-production"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Database ping failed: %v", err)
	}
	log.Println("Connected to PostgreSQL database successfully!")

	// Repositories
	userRepo := repository.NewUserRepository(db)
	courseRepo := repository.NewCourseRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	enrollmentRepo := repository.NewEnrollmentRepository(db)
	resourceRepo := repository.NewResourceRepository(db)
	evaluationRepo := repository.NewEvaluationRepository(db)
	quizRepo := repository.NewQuizRepository(db)
	forumRepo := repository.NewForumRepository(db)
	moduleRepo := repository.NewModuleRepository(db)
	statsRepo := repository.NewStatsRepository(db)
	notifRepo := repository.NewNotificationRepository(db)

	// Handlers
	authHandler := &handlers.AuthHandler{
		UserRepo:  userRepo,
		JWTSecret: jwtSecret,
	}
	userHandler := &handlers.UserHandler{
		UserRepo: userRepo,
	}
	courseHandler := &handlers.CourseHandler{
		CourseRepo: courseRepo,
	}
	categoryHandler := &handlers.CategoryHandler{
		CategoryRepo: categoryRepo,
	}
	enrollmentHandler := &handlers.EnrollmentHandler{
		EnrollRepo: enrollmentRepo,
	}
	resourceHandler := &handlers.ResourceHandler{
		ResourceRepo: resourceRepo,
	}
	evalHandler := &handlers.EvalHandler{
		EvalRepo:  evaluationRepo,
		NotifRepo: notifRepo,
		DB:        db,
	}
	quizHandler := handlers.NewQuizHandler(quizRepo)
	forumHandler := &handlers.ForumHandler{
		ForumRepo: forumRepo,
	}
	moduleHandler := &handlers.ModuleHandler{
		ModuleRepo: moduleRepo,
	}
	statsHandler := &handlers.StatsHandler{
		StatsRepo: statsRepo,
	}
	notifHandler := handlers.NewNotificationHandler(notifRepo)

	router := gin.Default()
	router.MaxMultipartMemory = 200 << 20 // 200 MB

	// CORS
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	if envOrigins := os.Getenv("CORS_ORIGINS"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Static uploads directory
	uploadsDir := "./uploads"
	if err := os.MkdirAll(uploadsDir, os.ModePerm); err != nil {
		log.Printf("Warning: could not create uploads directory: %v", err)
	}
	router.Static("/uploads", uploadsDir)

	// Healthcheck
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	teacherOrAdmin := middleware.RequireRole("ENSEIGNANT", "ADMIN", "enseignant", "admin")
	adminOnly := middleware.RequireRole("ADMIN", "admin")

	api := router.Group("/api")
	{
		// Auth routes (both /api/* and /api/auth/*)
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Public catalog & module routes
		api.GET("/courses", courseHandler.ListCatalog)
		api.GET("/cours", courseHandler.ListCatalog)
		api.GET("/categories", categoryHandler.ListCategories)
		api.GET("/courses/:id/modules", moduleHandler.ListModules)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(jwtSecret))
		{
			// Upload
			protected.POST("/upload", handlers.UploadFile)

			// Profile
			protected.GET("/profil", authHandler.GetProfile)
			protected.PUT("/profil", authHandler.UpdateProfile)
			protected.PUT("/profil/password", authHandler.ChangePassword)

			// Categories
			protected.POST("/categories", categoryHandler.CreateCategory)

			// Enrollments (Student & Teacher)
			protected.POST("/cours/:id/inscription", enrollmentHandler.Enroll)
			protected.GET("/mes-cours", enrollmentHandler.MyEnrollments)
			protected.GET("/cours/:id/etudiants", enrollmentHandler.GetCourseStudents)

			// Courses (Teacher / Admin)
			protected.POST("/courses", teacherOrAdmin, courseHandler.CreateCourse)
			protected.POST("/cours", teacherOrAdmin, courseHandler.CreateCourse)
			protected.PUT("/courses/:id", teacherOrAdmin, courseHandler.UpdateCourse)
			protected.PUT("/cours/:id/enseignant", adminOnly, courseHandler.AssignTeacher)
			protected.PATCH("/courses/:id/assign-teacher", adminOnly, courseHandler.AssignTeacher)

			// Modules (Teacher / Admin)
			protected.POST("/courses/:id/modules", teacherOrAdmin, moduleHandler.CreateModule)
			protected.PUT("/courses/:id/modules/reorder", teacherOrAdmin, moduleHandler.ReorderModules)
			protected.PUT("/modules/:id", teacherOrAdmin, moduleHandler.UpdateModule)
			protected.DELETE("/modules/:id", teacherOrAdmin, moduleHandler.DeleteModule)

			// Resource module assignment & resources
			protected.PATCH("/resources/:id/module", teacherOrAdmin, moduleHandler.AssignResource)
			protected.GET("/cours/:id/ressources", resourceHandler.ListResources)
			protected.POST("/cours/:id/ressources", teacherOrAdmin, resourceHandler.UploadResource)

			// Evaluations, Submissions & Quizzes
			protected.GET("/courses/:id/evaluations", evalHandler.ListEvaluations)
			protected.POST("/courses/:id/evaluations", teacherOrAdmin, evalHandler.CreateEvaluation)
			protected.POST("/evaluations/:id/submit", evalHandler.SubmitWork)
			protected.POST("/evaluations/:id/soumissions", evalHandler.SubmitWork)
			protected.GET("/evaluations/:id/submissions", teacherOrAdmin, evalHandler.ListSubmissions)
			protected.GET("/evaluations/:id/soumissions", teacherOrAdmin, evalHandler.ListSubmissions)
			protected.PUT("/submissions/:id/grade", teacherOrAdmin, evalHandler.GradeSubmission)
			protected.PUT("/soumissions/:id/note", teacherOrAdmin, evalHandler.GradeSubmission)
			protected.GET("/my-grades", evalHandler.GetStudentGrades)
			protected.GET("/mes-notes", evalHandler.GetStudentGrades)

			protected.GET("/evaluations/:id/quiz", quizHandler.GetQuiz)
			protected.POST("/evaluations/:id/quiz", teacherOrAdmin, quizHandler.SaveQuiz)
			protected.POST("/evaluations/:id/quiz/submit", quizHandler.SubmitQuiz)

			// Forum
			protected.GET("/cours/:id/forum", forumHandler.ListThreads)
			protected.POST("/cours/:id/forum", forumHandler.CreateThread)
			protected.GET("/forum/threads/:threadId", forumHandler.GetThread)
			protected.POST("/forum/threads/:threadId/replies", forumHandler.CreateReply)
			protected.PUT("/forum/threads/:threadId/replies/:replyId/best-answer", teacherOrAdmin, forumHandler.MarkBestAnswer)
			protected.PATCH("/forum/threads/:threadId/resolve", teacherOrAdmin, forumHandler.SetResolved)
			protected.DELETE("/forum/threads/:threadId", forumHandler.DeleteThread)

			// Notifications
			protected.GET("/notifications", notifHandler.List)
			protected.PATCH("/notifications/:id/read", notifHandler.MarkRead)
			protected.POST("/notifications/read-all", notifHandler.MarkAllRead)

			// Admin users & stats
			protected.GET("/utilisateurs", adminOnly, userHandler.ListUsers)
			protected.PUT("/utilisateurs/:id/statut", adminOnly, userHandler.UpdateUserStatus)
			protected.PUT("/utilisateurs/:id/role", adminOnly, userHandler.UpdateUserRole)
			protected.DELETE("/utilisateurs/:id", adminOnly, userHandler.DeleteUser)
			protected.GET("/statistiques", adminOnly, statsHandler.GetPlatformStats)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

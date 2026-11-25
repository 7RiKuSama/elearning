// DATABASE_URL=postgres://admin:password123@localhost:5432/pfel_db?sslmode=disable
// File: cmd/server/main.go
package main

import (
	"context"
	"database/sql"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"pfel-elearning/internal/handlers"
	"pfel-elearning/internal/middleware"
	"pfel-elearning/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func adaptCompletionGet(h *handlers.CompletionHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		if uid, exists := c.Get("user_id"); exists && ctx.Value("user_id") == nil {
			ctx = context.WithValue(ctx, "user_id", uid)
		}
		req := c.Request.Clone(ctx)
		req.SetPathValue("id", c.Param("id"))
		h.GetCourseCompletions(c.Writer, req)
	}
}

func adaptCompletionToggle(h *handlers.CompletionHandler) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		if uid, exists := c.Get("user_id"); exists && ctx.Value("user_id") == nil {
			ctx = context.WithValue(ctx, "user_id", uid)
		}
		req := c.Request.Clone(ctx)
		req.SetPathValue("id", c.Param("id"))
		h.ToggleResourceCompletion(c.Writer, req)
	}
}

func registerSPA(router *gin.Engine, distDir string) {
	absDist, err := filepath.Abs(distDir)
	if err != nil {
		log.Printf("Warning: invalid frontend dist path %q: %v", distDir, err)
		return
	}
	if info, err := os.Stat(absDist); err != nil || !info.IsDir() {
		log.Printf("Warning: frontend dist directory not found at %s (API-only mode)", absDist)
		return
	}

	distFS := os.DirFS(absDist)

	serveIndex := func(c *gin.Context) {
		indexBytes, err := fs.ReadFile(distFS, "index.html")
		if err != nil {
			c.String(http.StatusInternalServerError, "Failed to load index.html")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexBytes)
	}

	router.NoRoute(func(c *gin.Context) {
		reqPath := c.Request.URL.Path

		if reqPath == "/api" || strings.HasPrefix(reqPath, "/api/") || strings.HasPrefix(reqPath, "/uploads/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint not found"})
			return
		}

		cleanPath := strings.TrimPrefix(filepath.Clean(reqPath), "/")
		if cleanPath == "" || cleanPath == "." {
			serveIndex(c)
			return
		}

		if info, err := fs.Stat(distFS, cleanPath); err == nil && !info.IsDir() {
			c.FileFromFS(cleanPath, http.FS(distFS))
			return
		}

		serveIndex(c)
	})

	log.Printf("Serving React SPA from %s", absDist)
}

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
	completionRepo := repository.NewCompletionRepository(db)
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
	completionHandler := handlers.NewCompletionHandler(completionRepo)
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
	rawOrigins := os.Getenv("CORS_ORIGINS")
	if rawOrigins == "" {
		rawOrigins = os.Getenv("CORS_ORIGIN")
	}
	if rawOrigins != "" {
		parsed := []string{}
		for _, origin := range strings.Split(rawOrigins, ",") {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				parsed = append(parsed, trimmed)
			}
		}
		if len(parsed) > 0 {
			allowedOrigins = parsed
		}
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Static uploads directory
	uploadsDir := os.Getenv("UPLOAD_DIR")
	if uploadsDir == "" {
		uploadsDir = "./uploads"
	}
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

			// Resource module assignment, resources & lesson completion tracking
			protected.PATCH("/resources/:id/module", teacherOrAdmin, moduleHandler.AssignResource)
			protected.GET("/cours/:id/ressources", resourceHandler.ListResources)
			protected.POST("/cours/:id/ressources", teacherOrAdmin, resourceHandler.UploadResource)
			protected.GET("/cours/:id/completions", adaptCompletionGet(completionHandler))
			protected.POST("/ressources/:id/toggle-completion", adaptCompletionToggle(completionHandler))

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

	distDir := os.Getenv("FRONTEND_DIST_DIR")
	if distDir == "" {
		distDir = "../../pfel-frontend/dist"
	}
	registerSPA(router, distDir)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

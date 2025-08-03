const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Import database and swagger
const mariadb = require("./config/mariadb");
const swaggerSpecs = require("./config/swagger");

// Import routes
const gameRoutes = require("./routes/gameRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Guess the Number Game API Documentation",
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint with API information
app.get("/", (req, res) => {
  res.json({
    message: "Guess the Number Game API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      games: "/api/game",
      documentation: "/api-docs",
      health: "/health",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection and initialize tables
    const connected = await mariadb.connect();
    if (!connected) {
      console.error("❌ Failed to connect to MariaDB");
      process.exit(1);
    }

    await mariadb.initDatabase();
    console.log("✅ Database initialized successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔐 Auth API available at http://localhost:${PORT}/api/auth`);
      console.log(`🎮 Game API available at http://localhost:${PORT}/api/game`);
      console.log(`� API Documentation at http://localhost:${PORT}/api-docs`);
      console.log(`�📊 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/admin", require("./routes/adminroutes"));
app.use("/api/medicines", require("./routes/medicineroutes"));
app.use("/api/vendor", require("./routes/vendorroutes"));
app.use("/api/prescriptions", require("./routes/prescriptionroutes"));

app.use("/api/orders", require("./routes/orderroutes"));
// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AMIAP Backend is running 🚀",
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: "/api/auth (register, login, logout, me, change-password, update-profile)",
      admin: "/api/admin (users, vendors/pending, vendors/:id/verify, users/:id/toggle-status, users/:id)",
      medicines: "/api/medicines (search, :id, :id/alternatives, :id/prices, :id/pharmacies, info)",
      vendor: "/api/vendor (inventory CRUD)",
      prescriptions: "/api/prescriptions (scan, analyze-text, history, :id)",
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/medicines/search?q=paracetamol`);
  console.log(`   GET  /api/medicines/:id`);
  console.log(`   GET  /api/medicines/:id/alternatives`);
  console.log(`   GET  /api/medicines/:id/prices`);
  console.log(`   GET  /api/medicines/:id/pharmacies?lat=x&lng=y`);
  console.log(`   POST /api/prescriptions/scan`);
  console.log(`   POST /api/prescriptions/analyze-text`);
  console.log(`   GET  /api/vendor/inventory`);
});

module.exports = app;
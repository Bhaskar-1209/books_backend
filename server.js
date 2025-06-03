require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const bookRoutes = require("./routes/bookRoutes"); // If exists
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 4040;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (for uploaded book files/images)
app.use("/uploads/books", express.static(path.join(__dirname, "uploads/books")));
app.use("/uploads/covers", express.static(path.join(__dirname, "uploads/covers")));

// Routes
app.use("/api/books", bookRoutes);     // Optional if you have book routes
app.use("/api/auth", authRoutes);      // Authentication routes

// MongoDB connection and server start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => console.error("DB connection error:", err));

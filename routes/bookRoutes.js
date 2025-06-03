const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Book = require("../models/Book");

const router = express.Router();

// Ensure upload directories exist
["uploads", "uploads/books", "uploads/covers"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Configure multer for different folders
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "bookFile") {
      cb(null, "uploads/books/");
    } else if (file.fieldname === "bookCover") {
      cb(null, "uploads/covers/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

const multipleUpload = upload.fields([
  { name: "bookFile", maxCount: 1 },
  { name: "bookCover", maxCount: 1 },
]);

// Upload route
router.post("/upload", multipleUpload, async (req, res) => {
  try {
    const { title, category } = req.body;
    const newBook = new Book({
      title,
      category,
      bookFile: `books/${req.files["bookFile"][0].filename}`,
      bookCover: `covers/${req.files["bookCover"][0].filename}`,
    });

    await newBook.save();
    res.status(201).json({ message: "Book uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed", error });
  }
});

// Get all books
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    const books = await Book.find().sort({ createdAt: -1 });
    const formattedBooks = books.map((book) => ({
      _id: book._id,
      title: book.title,
      category: book.category,
      bookFile: `${req.protocol}://${req.get("host")}/uploads/${book.bookFile}`,
      bookCover: `${req.protocol}://${req.get("host")}/uploads/${book.bookCover}`,
      likedByCount: book.likedBy.length,
      likedByUser: userId ? book.likedBy.some(id => id.toString() === userId) : false,
    }));
    res.json(formattedBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching books", error });
  }
});

// Like a book
router.post("/:id/like", async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.likedBy.includes(userId)) {
      return res.status(400).json({ message: "Book already liked" });
    }

    book.likedBy.push(userId);
    await book.save();
    res.json({ message: "Book liked", likedBy: book.likedBy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unlike a book
router.post("/:id/unlike", async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.likedBy = book.likedBy.filter((id) => id.toString() !== userId);
    await book.save();
    res.json({ message: "Book unliked", likedBy: book.likedBy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/download", async (req, res) => {
  const bookId = req.params.id;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    await Book.findByIdAndUpdate(bookId, {
      $addToSet: { downloadedBy: userId }, // avoid duplicates
      $inc: { downloadCount: 1 }, // increment total downloads
    });

    res.status(200).json({ message: "Download recorded" });
  } catch (error) {
    console.error("Download recording error:", error);
    res.status(500).json({ error: "Failed to record download" });
  }
});

router.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    console.log("Requested category:", category);
    const books = await Book.find({ category }).sort({ createdAt: -1 });
    console.log("Books found:", books.length);
    // rest of your code
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching books by category", error });
  }
});


module.exports = router;

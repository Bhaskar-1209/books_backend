const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  category: String,
  bookFile: String,
  bookCover: String,
  likedBy: [String],
  createdAt: { type: Date, default: Date.now },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downloadedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downloadCount: { type: Number, default: 0 },
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;


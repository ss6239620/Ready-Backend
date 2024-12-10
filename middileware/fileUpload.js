const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename based on timestamp
  }
});

// Initialize multer with file filter and storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size (10MB)
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|mp4/; // Allow specific file types
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and pdfs are allowed.'));
    }
  }
});

// Middleware to handle errors thrown by multer
function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Handle specific multer errors (e.g., file too large)
    res.status(400).json({ error: err.message });
  } else if (err) {
    // Handle other errors
    res.status(400).json({ error: err.message });
  } else {
    next();
  }
}

module.exports = { upload, multerErrorHandler }
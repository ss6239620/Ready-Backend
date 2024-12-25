const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

let upload;

// Development environment: store files locally
if (process.env.NODE_ENV === 'development') {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Store uploaded files in the 'uploads' folder
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename based on timestamp
    },
  });

  upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max file size (10MB)
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|gif|pdf|mp4/; // Allow specific file types
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only images, PDFs, and MP4 videos are allowed.'));
      }
    },
  });
} else if (process.env.NODE_ENV === 'production') {
  // Production environment: use Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4']; // Allowed file formats
      const fileExt = file.mimetype.split('/')[1]; // Extract file extension from MIME type

      if (!allowedFormats.includes(fileExt)) {
        throw new Error('Only images, PDFs, and MP4 videos are allowed.');
      }

      return {
        resource_type: 'auto', // Automatically detect the file type (image, video, raw)
        format: fileExt, // File format
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // Unique public ID
      };
    },
  });

  upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max file size (10MB)
  });
}

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

module.exports = { upload, multerErrorHandler };

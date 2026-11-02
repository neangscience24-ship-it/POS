const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists in src/assets
const uploadDir = path.resolve(__dirname, "../assets");
const userProfileDir = path.resolve(__dirname, "../assets/user_profile");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(userProfileDir)) {
  fs.mkdirSync(userProfileDir, { recursive: true });
}

// Storage configuration for general assets (brand, product, etc.)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// Storage configuration for user profile pictures
const userProfileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, userProfileDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file format. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed."
      ),
      false
    );
  }
};

// General upload instance with 10MB limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max size
  },
});

// User profile upload instance with 10MB limit
const uploadUserProfile = multer({
  storage: userProfileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max size
  },
});

/**
 * Utility to safely delete a file from src/assets
 * @param {string} fileName
 */
const removeFile = (fileName) => {
  if (!fileName) return;
  try {
    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting file ${fileName}:`, err.message);
  }
};

/**
 * Utility to safely delete a user profile picture from src/assets/user_profile
 * @param {string} fileName
 */
const removeUserProfileFile = (fileName) => {
  if (!fileName) return;
  try {
    // Handle either "filename.jpg" or "user_profile/filename.jpg"
    const cleanFileName = path.basename(fileName);
    const filePath = path.join(userProfileDir, cleanFileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting user profile picture ${fileName}:`, err.message);
  }
};

module.exports = {
  upload,
  uploadUserProfile,
  uploadDir,
  userProfileDir,
  removeFile,
  removeUserProfileFile,
};

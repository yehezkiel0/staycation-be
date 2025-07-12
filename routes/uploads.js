const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const auth = require("../middleware/auth");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// @route   POST /api/uploads/image
// @desc    Upload a single image
// @access  Private
router.post("/image", [auth, upload.single("image")], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "staycation",
            transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    res.json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// @route   POST /api/uploads/images
// @desc    Upload multiple images
// @access  Private
router.post("/images", [auth, upload.array("images", 10)], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "staycation",
              transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) reject(error);
              else
                resolve({
                  url: result.secure_url,
                  public_id: result.public_id,
                });
            }
          )
          .end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      message: "Images uploaded successfully",
      images: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// @route   POST /api/uploads/property-images
// @desc    Upload property images with specific transformations
// @access  Private
router.post(
  "/property-images",
  [auth, upload.array("images", 10)],
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "staycation/properties",
                transformation: [
                  { width: 1200, height: 800, crop: "fill" },
                  { quality: "auto" },
                  { fetch_format: "auto" },
                ],
              },
              (error, result) => {
                if (error) reject(error);
                else
                  resolve({
                    _id: result.public_id,
                    url: result.secure_url,
                    public_id: result.public_id,
                  });
              }
            )
            .end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);

      res.json({
        message: "Property images uploaded successfully",
        imageUrls: results,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Upload failed", error: error.message });
    }
  }
);

// @route   POST /api/uploads/avatar
// @desc    Upload user avatar
// @access  Private
router.post("/avatar", [auth, upload.single("avatar")], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary with avatar-specific transformations
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "staycation/avatars",
            transformation: [
              { width: 300, height: 300, crop: "fill", gravity: "face" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    res.json({
      message: "Avatar uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// @route   POST /api/uploads/payment-proof
// @desc    Upload payment proof document
// @access  Private
router.post(
  "/payment-proof",
  [auth, upload.single("proof")],
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "staycation/payments",
              transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(req.file.buffer);
      });

      res.json({
        message: "Payment proof uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Upload failed", error: error.message });
    }
  }
);

// @route   DELETE /api/uploads/:public_id
// @desc    Delete an image from Cloudinary
// @access  Private
router.delete("/:public_id", auth, async (req, res) => {
  try {
    const { public_id } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      res.json({ message: "Image deleted successfully" });
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 10MB." });
    }
    return res.status(400).json({ message: error.message });
  }

  if (error.message === "Only image files are allowed") {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

module.exports = router;

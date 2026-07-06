const multer = require('multer');

const storage = multer.memoryStorage();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES, ...DOC_TYPES];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max (video ceiling)
});

const IMAGE_MAX_BYTES = 25 * 1024 * 1024; // 25MB max for images

const checkMediaSize = (req, res, next) => {
  const files = req.files
    ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
    : (req.file ? [req.file] : []);

  for (const file of files) {
    if (IMAGE_TYPES.includes(file.mimetype) && file.size > IMAGE_MAX_BYTES) {
      return res.status(400).json({ message: 'Image files must be under 25MB' });
    }
  }
  next();
};

module.exports = upload;
module.exports.checkMediaSize = checkMediaSize;

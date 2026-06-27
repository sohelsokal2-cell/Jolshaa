const Note = require('../models/Note');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.createNote = async (req, res) => {
  try {
    const { title, content, tags, visibility } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    let coverImage = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/notes');
      coverImage = result.secure_url;
    }

    const wordCount = content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const parsedTags = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const note = await Note.create({
      author: req.user._id,
      title,
      content,
      coverImage,
      tags: parsedTags,
      visibility: visibility || 'public',
      readTime,
    });

    await note.populate('author', 'name profilePhoto');
    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find({ author: req.user._id, isPublished: true })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments({ author: req.user._id, isPublished: true });

    res.json({ notes, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'name profilePhoto');

    if (!note) return res.status(404).json({ message: 'Note not found' });

    const isOwner = note.author._id.toString() === req.user._id.toString();
    if (!isOwner && !note.isPublished) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (!isOwner && note.visibility === 'onlyme') {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, content, tags, visibility } = req.body;
    if (title) note.title = title;
    if (content) {
      note.content = content;
      const wordCount = content.split(/\s+/).length;
      note.readTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    if (tags) note.tags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (visibility) note.visibility = visibility;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/notes');
      note.coverImage = result.secure_url;
    }

    await note.save();
    await note.populate('author', 'name profilePhoto');

    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleLikeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const index = note.likes.findIndex(id => id.toString() === req.user._id.toString());
    if (index === -1) {
      note.likes.push(req.user._id);
    } else {
      note.likes.splice(index, 1);
    }
    await note.save();

    res.json({ isLiked: index === -1, likeCount: note.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleBookmarkNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const index = note.bookmarks.findIndex(id => id.toString() === req.user._id.toString());
    if (index === -1) {
      note.bookmarks.push(req.user._id);
    } else {
      note.bookmarks.splice(index, 1);
    }
    await note.save();

    res.json({ isBookmarked: index === -1, bookmarkCount: note.bookmarks.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublicNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find({ visibility: 'public', isPublished: true })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments({ visibility: 'public', isPublished: true });

    res.json({ notes, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const StoryArchive = require('../models/StoryArchive');
const Highlight = require('../models/Highlight');
const Story = require('../models/Story');
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

exports.archiveStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const archived = await StoryArchive.create({
      author: req.user._id,
      originalStoryId: story._id,
      media: story.media,
      mediaType: story.mediaType,
      originalCreatedAt: story.createdAt,
    });

    await archived.populate('author', 'name profilePhoto');
    res.status(201).json({ archive: archived });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getArchivedStories = async (req, res) => {
  try {
    const archived = await StoryArchive.find({ author: req.user._id })
      .populate('author', 'name profilePhoto')
      .populate('highlight', 'title coverImage')
      .sort({ originalCreatedAt: -1 });

    res.json({ archives: archived });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteArchivedStory = async (req, res) => {
  try {
    const archived = await StoryArchive.findById(req.params.id);
    if (!archived) return res.status(404).json({ message: 'Archived story not found' });
    if (archived.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Highlight.updateMany(
      { stories: archived._id },
      { $pull: { stories: archived._id } }
    );

    await archived.deleteOne();
    res.json({ message: 'Archived story deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createHighlight = async (req, res) => {
  try {
    const { title, storyArchiveId } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    let coverImage = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/highlights');
      coverImage = result.secure_url;
    }

    const highlight = await Highlight.create({
      author: req.user._id,
      title,
      coverImage,
    });

    if (storyArchiveId) {
      const archive = await StoryArchive.findById(storyArchiveId);
      if (archive) {
        archive.highlight = highlight._id;
        await archive.save();
        highlight.stories.push(archive._id);
        if (!highlight.coverImage) highlight.coverImage = archive.media;
        await highlight.save();
      }
    }

    await highlight.populate('author', 'name profilePhoto');
    res.status(201).json({ highlight });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ author: req.params.userId })
      .populate('author', 'name profilePhoto')
      .populate('stories')
      .sort({ createdAt: -1 });

    res.json({ highlights });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addToHighlight = async (req, res) => {
  try {
    const { highlightId, storyArchiveId } = req.params;
    const highlight = await Highlight.findById(highlightId);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    if (highlight.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const archive = await StoryArchive.findById(storyArchiveId);
    if (!archive) return res.status(404).json({ message: 'Archived story not found' });

    archive.highlight = highlightId;
    await archive.save();

    highlight.stories.push(storyArchiveId);
    if (!highlight.coverImage) highlight.coverImage = archive.media;
    await highlight.save();

    res.json({ highlight });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    if (highlight.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await StoryArchive.updateMany(
      { highlight: highlight._id },
      { $set: { highlight: null } }
    );

    await highlight.deleteOne();
    res.json({ message: 'Highlight deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

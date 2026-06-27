const SavedFolder = require('../models/SavedFolder');
const User = require('../models/User');

exports.createFolder = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Folder name is required' });

    const folder = await SavedFolder.create({
      user: req.user._id,
      name,
      icon: icon || '📁',
    });

    res.status(201).json({ folder });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFolders = async (req, res) => {
  try {
    const folders = await SavedFolder.find({ user: req.user._id })
      .populate('posts', 'text media author createdAt')
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user._id).select('savedPosts');
    const unorganizedCount = user.savedPosts.length;

    res.json({ folders, unorganizedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const folder = await SavedFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (name) folder.name = name;
    if (icon) folder.icon = icon;
    await folder.save();

    res.json({ folder });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const folder = await SavedFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await folder.deleteOne();
    res.json({ message: 'Folder deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addToFolder = async (req, res) => {
  try {
    const { postId } = req.body;
    const folder = await SavedFolder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!folder.posts.includes(postId)) {
      folder.posts.push(postId);
      await folder.save();
    }

    const user = await User.findById(req.user._id);
    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
    }

    res.json({ folder });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeFromFolder = async (req, res) => {
  try {
    const folder = await SavedFolder.findById(req.params.folderId);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    folder.posts.pull(req.params.postId);
    await folder.save();

    res.json({ folder });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

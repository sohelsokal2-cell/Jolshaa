const Album = require('../models/Album');
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

exports.createAlbum = async (req, res) => {
  try {
    const { title, description, visibility, isHighlight } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Album title is required' });
    }

    const album = await Album.create({
      owner: req.user._id,
      title,
      description: description || '',
      visibility: visibility || 'friends',
      isHighlight: isHighlight === 'true',
      photos: [],
    });

    await album.populate('owner', 'name profilePhoto');

    res.status(201).json({ album });
  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserAlbums = async (req, res) => {
  try {
    const isOwn = req.params.userId === req.user._id.toString();

    const query = { owner: req.params.userId };
    if (!isOwn) {
      query.$or = [{ visibility: 'public' }, { visibility: 'friends' }];
    }

    const albums = await Album.find(query)
      .populate('owner', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ albums });
  } catch (error) {
    console.error('Get user albums error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate(
      'owner',
      'name profilePhoto'
    );
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    const isOwner = album.owner._id.toString() === req.user._id.toString();
    if (!isOwner && album.visibility === 'onlyme') {
      return res.status(403).json({ message: 'Album not available' });
    }

    res.json({ album });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addPhotos = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, 'jolshaa/albums')
    );
    const results = await Promise.all(uploadPromises);
    const newPhotos = results.map((r) => r.secure_url);

    album.photos.push(...newPhotos);
    await album.save();

    await album.populate('owner', 'name profilePhoto');

    res.json({ album });
  } catch (error) {
    console.error('Add photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await album.deleteOne();
    res.json({ message: 'Album deleted' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removePhoto = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { photoUrl } = req.body;
    album.photos = album.photos.filter((p) => p !== photoUrl);
    await album.save();

    await album.populate('owner', 'name profilePhoto');

    res.json({ album });
  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, visibility } = req.body;
    if (title !== undefined) album.title = title;
    if (description !== undefined) album.description = description;
    if (visibility !== undefined) album.visibility = visibility;

    await album.save();
    await album.populate('owner', 'name profilePhoto');

    res.json({ album });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.shareAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (album.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    album.sharedWith = [...new Set([...album.sharedWith.map(id => id.toString()), ...userIds])];
    await album.save();

    res.json({ message: 'Album shared', sharedWith: album.sharedWith });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getHighlights = async (req, res) => {
  try {
    const albums = await Album.find({
      owner: req.params.userId,
      isHighlight: true,
      photos: { $exists: true, $ne: [] }
    })
      .populate('owner', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ albums });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

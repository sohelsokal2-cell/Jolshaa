const crypto = require('crypto');
const Post = require('../models/Post');
const VideoView = require('../models/VideoView');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { getIO } = require('../socket');

const CLOUDINARY_FOLDER = 'jolshaa/videos';

// Upload video to Cloudinary with eager transformations for multiple qualities
const uploadVideoToCloudinary = (fileBuffer, isShortForm) => {
  return new Promise((resolve, reject) => {
    const eagerTransforms = [
      { width: 360, height: 640, crop: 'limit', quality: 'auto', format: 'mp4', resource_type: 'video' },
      { width: 480, height: 854, crop: 'limit', quality: 'auto', format: 'mp4', resource_type: 'video' },
      { width: 720, height: 1280, crop: 'limit', quality: 'auto', format: 'mp4', resource_type: 'video' },
      { width: 1080, height: 1920, crop: 'limit', quality: 'auto', format: 'mp4', resource_type: 'video' },
    ];

    const uploadOptions = {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'video',
      eager_async: true,
      eager: eagerTransforms,
      notification_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/videos/webhook`,
      format: 'mp4',
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Generate thumbnail from video at specific timestamp
const generateThumbnail = (videoUrl, timestamp = 1) => {
  return cloudinary.url(videoUrl, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { start_offset: `${timestamp}s`, width: 640, height: 360, crop: 'limit', fetch_format: 'auto', quality: 'auto' },
    ],
  });
};

// Optimize a Cloudinary video URL with f_auto + q_auto
const optimizeVideoUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};

// Optimize video URLs in posts array before sending to client
const optimizePostVideoUrls = (posts) => {
  return posts.map((post) => {
    const p = post.toObject ? post.toObject() : { ...post };
    if (p.video?.url) {
      p.video.url = optimizeVideoUrl(p.video.url);
    }
    if (p.media?.length) {
      p.media = p.media.map((m) =>
        m.type === 'video' ? { ...m, url: optimizeVideoUrl(m.url) } : m
      );
    }
    return p;
  });
};

// POST /api/posts/video-upload
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const { text, visibility, isShortForm, caption } = req.body;
    const trimmedText = typeof text === 'string' ? text.trim() : '';
    const isShort = isShortForm === 'true' || isShortForm === true;

    // Validate file size
    const maxSize = isShort ? 100 * 1024 * 1024 : 500 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        message: isShort
          ? 'Short videos must be under 100MB. Would you like to post this as a regular video instead?'
          : 'Video is too large. Maximum size is 500MB.',
      });
    }

    // Validate MIME type
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedVideoTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'This video format is not supported. Please use MP4, MOV, or WebM.',
      });
    }

    // Create post with processing status
    const post = await Post.create({
      author: req.user._id,
      text: trimmedText,
      visibility: visibility || 'public',
      status: 'published',
      isPublished: true,
      video: {
        url: '',
        processingStatus: 'uploading',
        isShortForm: isShort,
        sizeInBytes: req.file.size,
        format: req.file.mimetype.split('/')[1],
      },
    });

    // Upload to Cloudinary (non-blocking — respond immediately with post ID)
    res.status(201).json({
      _id: post._id,
      processingStatus: 'uploading',
      message: 'Video upload started',
    });

    // Perform upload in background
    try {
      const result = await uploadVideoToCloudinary(req.file.buffer, isShort);

      // Generate thumbnail at 1 second
      const thumbnailUrl = generateThumbnail(result.secure_url, 1);

      // Parse eager transformation results for quality URLs
      const qualities = [];
      if (result.eager) {
        const resolutionMap = { 360: '360p', 480: '480p', 720: '720p', 1080: '1080p' };
        result.eager.forEach((t) => {
          const width = t.width;
          const label = resolutionMap[width] || `${width}p`;
          qualities.push({ resolution: label, url: t.secure_url });
        });
      }

      // Update post with video data
      await Post.findByIdAndUpdate(post._id, {
        'video.url': result.secure_url,
        'video.thumbnailUrl': thumbnailUrl,
        'video.duration': result.duration || 0,
        'video.width': result.width || 0,
        'video.height': result.height || 0,
        'video.format': result.format || 'mp4',
        'video.processingStatus': 'processing',
        'video.qualities': qualities,
        'media': [{
          url: result.secure_url,
          type: 'video',
          thumbnailUrl,
          caption: caption || '',
        }],
      });

      // Notify uploader via socket
      getIO().to(`user:${req.user._id}`).emit('videoProcessingStatus', {
        postId: post._id,
        status: 'processing',
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError.message);
      await Post.findByIdAndUpdate(post._id, {
        'video.processingStatus': 'failed',
      });
      getIO().to(`user:${req.user._id}`).emit('videoProcessingStatus', {
        postId: post._id,
        status: 'failed',
        error: 'Video processing failed. Please try uploading again.',
      });
    }
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/posts/:id/video-status
exports.getVideoStatus = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('video author');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.video) {
      return res.status(404).json({ message: 'No video found for this post' });
    }

    res.json({
      status: post.video.processingStatus,
      thumbnailUrl: post.video.thumbnailUrl,
      qualities: post.video.qualities || [],
      duration: post.video.duration,
      url: post.video.url || '',
    });
  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/posts/:id/video
exports.deleteVideo = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!post.video || !post.video.url) {
      return res.status(404).json({ message: 'No video found for this post' });
    }

    // Extract public_id from Cloudinary URL for deletion
    const urlParts = post.video.url.split('/');
    const folderAndFile = urlParts.slice(urlParts.indexOf('upload') + 1).join('/');
    const publicId = folderAndFile.replace(/\.[^/.]+$/, '');

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (e) {
      console.warn('Cloudinary deletion failed (non-fatal):', e.message);
    }

    // Clear video data from post
    await Post.findByIdAndUpdate(post._id, {
      $unset: {
        'video.url': 1,
        'video.thumbnailUrl': 1,
        'video.duration': 1,
        'video.width': 1,
        'video.height': 1,
        'video.format': 1,
        'video.sizeInBytes': 1,
        'video.qualities': 1,
      },
      $set: {
        'video.processingStatus': 'failed',
        'video.views': 0,
        'video.uniqueViewers': [],
        'video.watchTime': 0,
        'media': [],
      },
    });

    // Delete associated VideoView records
    await VideoView.deleteMany({ video: post._id });

    res.json({ message: 'Video deleted' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/videos/webhook — Cloudinary notification callback
exports.handleCloudinaryWebhook = async (req, res) => {
  try {
    // Verify Cloudinary webhook signature
    const signature = req.headers['x-cld-signature'];
    const timestamp = req.headers['x-cld-timestamp'];
    const webhookSecret = process.env.CLOUDINARY_WEBHOOK_SECRET || process.env.CLOUDINARY_API_SECRET;

    if (webhookSecret && signature && timestamp) {
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(timestamp + body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }
    }

    const { public_id, secure_url, status, derived_attributes, width, height, duration, format } = req.body;

    if (!public_id) return res.status(400).json({ message: 'Missing public_id' });

    // Find the post by matching the video URL pattern
    const escapedId = public_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const post = await Post.findOne({
      'video.processingStatus': 'processing',
      'video.url': { $regex: escapedId },
    });

    if (!post) {
      // Try matching by the folder prefix + public_id segment
      const idParts = public_id.split('/');
      const fileId = idParts[idParts.length - 1];
      const postByFolder = await Post.findOne({
        'video.processingStatus': 'processing',
        'video.url': { $regex: `${CLOUDINARY_FOLDER}/${fileId}` },
      });
      if (!postByFolder) return res.status(200).json({ message: 'Post not found, skipping' });
      return processWebhookForPost(postByFolder, req.body, res);
    }

    return processWebhookForPost(post, req.body, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ message: 'OK' }); // Always return 200 to Cloudinary
  }
};

const processWebhookForPost = async (post, webhookData, res) => {
  try {
    const { status, secure_url, derived_attributes, width, height, duration, format } = webhookData;

    if (status === 'processing' || status === 'pending') {
      return res.status(200).json({ message: 'Processing' });
    }

    if (status === 'error' || status === 'failed') {
      await Post.findByIdAndUpdate(post._id, {
        'video.processingStatus': 'failed',
      });
      getIO().to(`user:${post.author}`).emit('videoProcessingStatus', {
        postId: post._id,
        status: 'failed',
        error: 'Video processing failed. Please try uploading again.',
      });
      return res.status(200).json({ message: 'Failed' });
    }

    if (status === 'complete' || status === 'uploaded') {
      const thumbnailUrl = generateThumbnail(secure_url || post.video.url, 1);

      // Parse derived qualities
      const qualities = [];
      if (derived_attributes && derived_attributes.qualities) {
        derived_attributes.qualities.forEach((q) => {
          qualities.push({ resolution: q.resolution, url: q.url });
        });
      }

      await Post.findByIdAndUpdate(post._id, {
        'video.processingStatus': 'ready',
        'video.thumbnailUrl': thumbnailUrl,
        'video.duration': duration || post.video.duration,
        'video.width': width || post.video.width,
        'video.height': height || post.video.height,
        'video.format': format || post.video.format,
        'video.qualities': qualities.length > 0 ? qualities : post.video.qualities,
      });

      getIO().to(`user:${post.author}`).emit('videoProcessingComplete', {
        postId: post._id,
        thumbnailUrl,
        duration: duration || post.video.duration,
      });
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('processWebhookForPost error:', error);
    res.status(200).json({ message: 'OK' });
  }
};

// GET /api/videos/feed — Regular video feed
exports.getVideoFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).select('blockedUsers friends');
    const blockedIds = currentUser?.blockedUsers || [];
    const friendIds = currentUser?.friends || [];

    const posts = await Post.find({
      'video.url': { $exists: true, $ne: '' },
      'video.processingStatus': 'ready',
      'video.isShortForm': false,
      author: { $nin: blockedIds },
      visibility: 'public',
    })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      'video.url': { $exists: true, $ne: '' },
      'video.processingStatus': 'ready',
      'video.isShortForm': false,
      author: { $nin: blockedIds },
      visibility: 'public',
    });

    res.json({
      posts: optimizePostVideoUrls(posts),
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Get video feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/videos/shorts-feed — Short-form vertical video feed
exports.getShortsFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Exclude video IDs passed in query (already seen this session)
    const seenIds = req.query.seen ? req.query.seen.split(',') : [];

    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    const blockedIds = currentUser?.blockedUsers || [];

    const matchQuery = {
      'video.url': { $exists: true, $ne: '' },
      'video.processingStatus': 'ready',
      'video.isShortForm': true,
      author: { $nin: blockedIds },
      visibility: 'public',
    };

    if (seenIds.length > 0) {
      const mongoose = require('mongoose');
      const objectIds = seenIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (objectIds.length > 0) {
        matchQuery._id = { $nin: objectIds };
      }
    }

    // Prioritize engagement rate over recency
    const posts = await Post.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $size: '$video.uniqueViewers' },
              { $divide: ['$video.watchTime', { $max: ['$video.duration', 1] }] },
            ],
          },
        },
      },
      { $sort: { engagementScore: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    await Post.populate(posts, { path: 'author', select: 'name profilePhoto' });

    res.json({
      posts: optimizePostVideoUrls(posts),
      page,
      hasMore: posts.length === limit,
    });
  } catch (error) {
    console.error('Get shorts feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/videos/:id/track-view
exports.trackView = async (req, res) => {
  try {
    const { watchedSeconds, watchedPercentage, device } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId).select('video author');
    if (!post || !post.video || !post.video.url) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Upsert VideoView record first — this is idempotent
    const existingView = await VideoView.findOne({ video: postId, viewer: req.user._id });
    const prevWatched = existingView?.watchedSeconds || 0;
    const delta = Math.max(0, (watchedSeconds || 0) - prevWatched);

    const update = {
      watchedSeconds: Math.max(watchedSeconds || 0, prevWatched),
      watchedPercentage: Math.max(watchedPercentage || 0, existingView?.watchedPercentage || 0),
      completedView: (watchedPercentage || 0) >= 95,
      device: device || 'desktop',
    };

    await VideoView.findOneAndUpdate(
      { video: postId, viewer: req.user._id },
      update,
      { upsert: true, new: true }
    );

    // Use $addToSet (atomic) to add viewer, then check if viewer was actually added
    const prevViewerCount = post.video.uniqueViewers?.length || 0;
    await Post.findByIdAndUpdate(postId, {
      $addToSet: { 'video.uniqueViewers': req.user._id },
    });
    const updatedPost = await Post.findById(postId).select('video.uniqueViewers');
    const newViewerCount = updatedPost?.video.uniqueViewers?.length || 0;
    const viewerWasAdded = newViewerCount > prevViewerCount;

    const incFields = { 'video.watchTime': delta };
    if (viewerWasAdded) {
      incFields['video.views'] = 1;
    }

    await Post.findByIdAndUpdate(postId, { $inc: incFields });

    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/videos/:id/analytics — Video owner only
exports.getVideoAnalytics = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('video author');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const views = await VideoView.find({ video: req.params.id });

    const totalViews = views.length;
    const uniqueViewers = post.video?.uniqueViewers?.length || 0;
    const totalWatchTime = views.reduce((sum, v) => sum + (v.watchedSeconds || 0), 0);
    const avgWatchPercentage = totalViews > 0
      ? views.reduce((sum, v) => sum + (v.watchedPercentage || 0), 0) / totalViews
      : 0;
    const completionRate = totalViews > 0
      ? (views.filter((v) => v.completedView).length / totalViews) * 100
      : 0;

    // Device breakdown
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
    views.forEach((v) => {
      if (deviceCounts[v.device] !== undefined) deviceCounts[v.device]++;
    });

    // Views over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const viewsOverTime = await VideoView.aggregate([
      { $match: { video: post._id, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: 1 },
          watchTime: { $sum: '$watchedSeconds' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalViews,
      uniqueViewers,
      avgWatchTime: totalViews > 0 ? totalWatchTime / totalViews : 0,
      avgWatchPercentage,
      completionRate,
      totalWatchTime,
      deviceBreakdown: {
        mobile: totalViews > 0 ? (deviceCounts.mobile / totalViews) * 100 : 0,
        desktop: totalViews > 0 ? (deviceCounts.desktop / totalViews) * 100 : 0,
        tablet: totalViews > 0 ? (deviceCounts.tablet / totalViews) * 100 : 0,
      },
      viewsOverTime,
    });
  } catch (error) {
    console.error('Get video analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const Group = require('../models/Group');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

const isGroupAdmin = (group, userId) => group.admins.some(a => a.toString() === userId.toString());
const isGroupModerator = (group, userId) => group.moderators.some(m => m.toString() === userId.toString());
const isGroupModOrAdmin = (group, userId) => isGroupAdmin(group, userId) || isGroupModerator(group, userId);

exports.createGroup = async (req, res) => {
  try {
    const { name, description, privacy, rules } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    let coverPhoto = null;
    if (req.file) {
      coverPhoto = await uploadToCloudinary(req.file.buffer, 'jolshaa/groups');
    }

    const parsedRules = rules ? JSON.parse(rules) : [];

    const group = await Group.create({
      name,
      description: description || '',
      privacy: privacy || 'public',
      coverPhoto,
      creator: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      rules: parsedRules
    });

    await group.populate('creator', 'name profilePhoto');
    await group.populate('admins', 'name profilePhoto');

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const query = {};
    if (search) query.$text = { $search: search };

    const groups = await Group.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profilePhoto');

    const total = await Group.countDocuments(query);

    const groupsWithStatus = groups.map(group => ({
      ...group.toObject(),
      memberCount: group.members.length,
      isMember: group.members.some(m => m.toString() === req.user._id.toString()),
      isAdmin: group.admins.some(a => a.toString() === req.user._id.toString()),
      isModerator: group.moderators.some(m => m.toString() === req.user._id.toString()),
      hasPendingRequest: group.pendingRequests.some(p => p.toString() === req.user._id.toString())
    }));

    res.json({ groups: groupsWithStatus, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name profilePhoto')
      .populate('admins', 'name profilePhoto')
      .populate('moderators', 'name profilePhoto')
      .populate('members', 'name profilePhoto')
      .populate('pinnedPost');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const userId = req.user._id.toString();

    let pinnedPostData = null;
    if (group.pinnedPost) {
      pinnedPostData = group.pinnedPost.toObject();
      const [pReactions, pMyReaction, pComments] = await Promise.all([
        Reaction.aggregate([
          { $match: { targetType: 'Post', targetId: group.pinnedPost._id } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]),
        Reaction.findOne({ targetType: 'Post', targetId: group.pinnedPost._id, user: req.user._id }),
        Comment.countDocuments({ post: group.pinnedPost._id })
      ]);
      pinnedPostData.reactions = {
        count: pReactions[0]?.count || 0,
        myReaction: pMyReaction?.type || null
      };
      pinnedPostData.commentCount = pComments;
      const author = await require('../models/User').findById(group.pinnedPost.author).select('name profilePhoto');
      pinnedPostData.author = author;
    }

    res.json({
      ...group.toObject(),
      memberCount: group.members.length,
      isMember: group.members.some(m => m._id.toString() === userId),
      isAdmin: group.admins.some(a => a._id.toString() === userId),
      isModerator: group.moderators.some(m => m._id.toString() === userId),
      isCreator: group.creator._id.toString() === userId,
      hasPendingRequest: group.pendingRequests.some(p => p.toString() === userId),
      pinnedPost: pinnedPostData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can update the group' });
    }

    const { name, description, privacy, rules } = req.body;
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (privacy !== undefined) group.privacy = privacy;
    if (rules !== undefined) group.rules = JSON.parse(rules);

    if (req.file) {
      group.coverPhoto = await uploadToCloudinary(req.file.buffer, 'jolshaa/groups');
    }

    await group.save();
    await group.populate('creator', 'name profilePhoto');
    await group.populate('admins', 'name profilePhoto');
    await group.populate('moderators', 'name profilePhoto');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete the group' });
    }

    await Post.deleteMany({ 'postedIn.type': 'group', 'postedIn.refId': group._id });
    await Group.findByIdAndDelete(group._id);
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const User = require('../models/User');
    const currentUser = await User.findById(req.user._id).select('restrictions');
    const groupRestricted = currentUser.restrictions?.find(r => r.type === 'group_join' && (!r.expiresAt || r.expiresAt > new Date()));
    if (groupRestricted) {
      return res.status(403).json({ message: 'You are restricted from joining groups', restricted: true });
    }

    const userId = req.user._id.toString();
    if (group.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    if (group.privacy === 'public') {
      group.members.push(req.user._id);
      await group.save();
      return res.json({ message: 'Joined group', status: 'member' });
    }

    if (group.pendingRequests.some(p => p.toString() === userId)) {
      return res.status(400).json({ message: 'Request already pending' });
    }

    group.pendingRequests.push(req.user._id);
    await group.save();
    res.json({ message: 'Request sent', status: 'pending' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupModOrAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins/moderators can approve requests' });
    }

    const targetUserId = req.params.userId;
    if (!group.pendingRequests.some(p => p.toString() === targetUserId)) {
      return res.status(400).json({ message: 'No pending request from this user' });
    }

    group.pendingRequests = group.pendingRequests.filter(p => p.toString() !== targetUserId);
    group.members.push(targetUserId);
    await group.save();
    res.json({ message: 'Request approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const userId = req.user._id.toString();
    if (group.creator.toString() === userId) {
      return res.status(400).json({ message: 'Creator cannot leave the group' });
    }
    if (!group.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'Not a member' });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    group.admins = group.admins.filter(a => a.toString() !== userId);
    group.moderators = group.moderators.filter(m => m.toString() !== userId);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    const targetUserId = req.params.userId;
    if (targetUserId === group.creator.toString()) {
      return res.status(400).json({ message: 'Cannot remove the creator' });
    }
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    group.members = group.members.filter(m => m.toString() !== targetUserId);
    group.admins = group.admins.filter(a => a.toString() !== targetUserId);
    group.moderators = group.moderators.filter(m => m.toString() !== targetUserId);
    await group.save();
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name profilePhoto');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json({
      members: group.members,
      admins: group.admins,
      moderators: group.moderators
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addModerator = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can add moderators' });
    }

    const targetUserId = req.params.userId;
    if (!group.members.some(m => m.toString() === targetUserId)) {
      return res.status(400).json({ message: 'User must be a member first' });
    }
    if (isGroupModerator(group, targetUserId)) {
      return res.status(400).json({ message: 'Already a moderator' });
    }

    group.moderators.push(targetUserId);
    await group.save();
    res.json({ message: 'Moderator added' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.removeModerator = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can remove moderators' });
    }

    const targetUserId = req.params.userId;
    if (!isGroupModerator(group, targetUserId)) {
      return res.status(400).json({ message: 'Not a moderator' });
    }

    group.moderators = group.moderators.filter(m => m.toString() !== targetUserId);
    await group.save();
    res.json({ message: 'Moderator removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.pinPost = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupModOrAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins/moderators can pin posts' });
    }

    const { postId } = req.params;
    if (group.pinnedPost && group.pinnedPost.toString() === postId) {
      group.pinnedPost = null;
      await Post.findByIdAndUpdate(postId, { isPinned: false });
      await group.save();
      return res.json({ message: 'Post unpinned', pinnedPost: null });
    }

    if (group.pinnedPost) {
      await Post.findByIdAndUpdate(group.pinnedPost, { isPinned: false });
    }

    group.pinnedPost = postId;
    await Post.findByIdAndUpdate(postId, { isPinned: true });
    await group.save();
    res.json({ message: 'Post pinned', pinnedPost: postId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateRules = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can update rules' });
    }

    const { rules } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ message: 'Rules must be an array' });
    }

    group.rules = rules.slice(0, 10);
    await group.save();
    res.json({ rules: group.rules });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getGroupFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      'postedIn.type': 'group',
      'postedIn.refId': req.params.id
    })
      .sort({ isAnnouncement: -1, isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePhoto')
      .populate('taggedUsers', 'name profilePhoto');

    const total = await Post.countDocuments({
      'postedIn.type': 'group',
      'postedIn.refId': req.params.id
    });

    const postIds = posts.map(p => p._id);

    const reactions = await Reaction.aggregate([
      { $match: { targetType: 'Post', targetId: { $in: postIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 }, types: { $push: '$type' } } }
    ]);

    const reactionMap = {};
    reactions.forEach(r => {
      reactionMap[r._id.toString()] = { count: r.count, myReaction: null };
    });

    const myReactions = await Reaction.find({
      targetType: 'Post',
      targetId: { $in: postIds },
      user: req.user._id
    });

    myReactions.forEach(r => {
      const key = r.targetId.toString();
      if (reactionMap[key]) reactionMap[key].myReaction = r.type;
    });

    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const commentMap = {};
    commentCounts.forEach(c => {
      commentMap[c._id.toString()] = c.count;
    });

    const postsWithMeta = posts.map(post => ({
      ...post.toObject(),
      reactions: reactionMap[post._id.toString()] || { count: 0, myReaction: null },
      commentCount: commentMap[post._id.toString()] || 0
    }));

    res.json({ posts: postsWithMeta, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createGroupPost = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Only members can post in this group' });
    }

    const { text, feeling, taggedUsers, isAnnouncement } = req.body;

    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Post must have text or media' });
    }

    let media = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'jolshaa/posts')
      );
      media = await Promise.all(uploadPromises);
    }

    const tagged = taggedUsers ? JSON.parse(taggedUsers) : [];
    const canAnnounce = isGroupModOrAdmin(group, req.user._id);

    const post = await Post.create({
      author: req.user._id,
      text: text || '',
      media,
      feeling: feeling || null,
      taggedUsers: tagged,
      visibility: 'public',
      postedIn: { type: 'group', refId: group._id },
      isAnnouncement: isAnnouncement && canAnnounce ? true : false
    });

    await post.populate('author', 'name profilePhoto');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

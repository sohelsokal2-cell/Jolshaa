const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { isUserOnline } = require('../socket');
const { hasId } = require('../utils/id');

exports.getUserOnlineStatus = async (req, res) => {
  try {
    const online = isUserOnline(req.params.id);
    res.json({ online });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -loginHistory -sessions -blockedUsers -trustedDevices');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check block status — bidirectional
    const currentUser = await User.findById(req.user._id).select('blockedUsers friends');
    if (hasId(currentUser.blockedUsers, user._id)) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }
    if (hasId(user.blockedUsers, req.user._id)) {
      return res.status(403).json({ message: 'User not found' });
    }

    const isOwnProfile = req.user._id.toString() === user._id.toString();

    // Get friend status
    let friendStatus = 'none';
    let friendRequestId = null;
    if (!isOwnProfile) {
      if (hasId(currentUser.friends, user._id)) {
        friendStatus = 'friends';
      } else {
        const outgoing = await FriendRequest.findOne({ from: req.user._id, to: user._id, status: 'pending' });
        if (outgoing) {
          friendStatus = 'pending_sent';
          friendRequestId = outgoing._id;
        } else {
          const incoming = await FriendRequest.findOne({ from: user._id, to: req.user._id, status: 'pending' });
          if (incoming) {
            friendStatus = 'pending_received';
            friendRequestId = incoming._id;
          }
        }
      }
    }

    // Get mutual friends count (reuse currentUser, fetch target user's friends once)
    let mutualFriends = [];
    let mutualFriendsCount = 0;
    let targetFriends = [];
    if (!isOwnProfile) {
      const targetUserFull = await User.findById(user._id).select('friends');
      targetFriends = targetUserFull?.friends || [];
      const mutualIds = currentUser.friends.filter(f => hasId(targetFriends, f));
      mutualFriendsCount = mutualIds.length;
      if (mutualIds.length > 0) {
        mutualFriends = await User.find({ _id: { $in: mutualIds.slice(0, 5) } })
          .select('name profilePhoto');
      }
    } else {
      const targetUserFull = await User.findById(user._id).select('friends');
      targetFriends = targetUserFull?.friends || [];
    }

    // Get friend count
    const friendCount = targetFriends.length;

    // Get friend list (if allowed by privacy)
    let friends = [];
    const canShowFriends = isOwnProfile ||
      user.privacy?.showFriendsList === 'everyone' ||
      (user.privacy?.showFriendsList === 'friends' && friendStatus === 'friends');
    if (canShowFriends && friendCount > 0) {
      const fullUser = await User.findById(user._id)
        .select('friends')
        .populate('friends', 'name profilePhoto');
      friends = fullUser.friends;
    }

    // Privacy: hide sensitive fields from non-owners
    const profile = {
      id: user._id,
      name: user.name,
      profilePhoto: user.profilePhoto,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      education: user.education,
      work: user.work,
      location: user.location,
      createdAt: user.createdAt,
      friendStatus,
      friendRequestId,
      friendCount,
      mutualFriendsCount,
      mutualFriends,
      friends
    };

    // Show email only to self
    if (isOwnProfile) profile.email = user.email;

    // Show phone based on privacy
    if (isOwnProfile || (friendStatus === 'friends' && user.privacy?.messagePrivacy !== 'none')) {
      profile.phone = user.phone;
    }

    // Show DOB and gender only to self
    if (isOwnProfile) {
      profile.dateOfBirth = user.dateOfBirth;
      profile.gender = user.gender;
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Reaction = require('../models/Reaction');
    const Comment = require('../models/Comment');

    // Check block status
    const targetUser = await User.findById(req.params.id).select('blockedUsers');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (hasId(targetUser.blockedUsers, req.user._id)) {
      return res.status(403).json({ message: 'User not found' });
    }
    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    if (hasId(currentUser.blockedUsers, req.params.id)) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }

    const isOwnProfile = req.user._id.toString() === req.params.id;

    // Determine visibility filter
    let visibilityFilter;
    if (isOwnProfile) {
      // Own profile: see all own posts
      visibilityFilter = {};
    } else {
      // Check if viewer is a friend
      const viewer = await User.findById(req.user._id).select('friends');
      const isFriend = hasId(viewer.friends, req.params.id);

      if (isFriend) {
        // Friends can see public + friends-only posts
        visibilityFilter = { visibility: { $in: ['public', 'friends'] } };
      } else {
        // Non-friends can only see public posts
        visibilityFilter = { visibility: 'public' };
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { author: req.params.id, ...visibilityFilter };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePhoto')
      .populate('taggedUsers', 'name profilePhoto')
      .populate({ path: 'sharedPost', populate: { path: 'author', select: 'name profilePhoto' } });

    const total = await Post.countDocuments(query);

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

    res.json({
      posts: postsWithMeta,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const allowedFields = ['name', 'phone', 'bio', 'dateOfBirth', 'gender', 'education', 'work', 'location'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Only allow cloudinary URLs for photos
    const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\//;
    if (req.body.profilePhoto && cloudinaryPattern.test(req.body.profilePhoto)) {
      updates.profilePhoto = req.body.profilePhoto;
    }
    if (req.body.coverPhoto && cloudinaryPattern.test(req.body.coverPhoto)) {
      updates.coverPhoto = req.body.coverPhoto;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      education: user.education,
      work: user.work,
      location: user.location,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { postVisibility, friendRequests, showFriendsList, commentPrivacy, storyVisibility, messagePrivacy } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (postVisibility) user.privacy.postVisibility = postVisibility;
    if (friendRequests) user.privacy.friendRequests = friendRequests;
    if (showFriendsList) user.privacy.showFriendsList = showFriendsList;
    if (commentPrivacy) user.privacy.commentPrivacy = commentPrivacy;
    if (storyVisibility) user.privacy.storyVisibility = storyVisibility;
    if (messagePrivacy) user.privacy.messagePrivacy = messagePrivacy;

    await user.save();

    res.json({ privacy: user.privacy });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacy storyHiddenFrom');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ privacy: user.privacy, storyHiddenFrom: user.storyHiddenFrom || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStoryHiddenFrom = async (req, res) => {
  try {
    const { hiddenFrom } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { storyHiddenFrom: hiddenFrom || [] },
      { new: true }
    );
    res.json({ storyHiddenFrom: user.storyHiddenFrom });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isBlocked = hasId(user.blockedUsers, userId);
    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      user.blockedUsers.push(userId);
    }

    await user.save();

    res.json({
      message: isBlocked ? 'User unblocked' : 'User blocked',
      blockedUsers: user.blockedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('blockedUsers')
      .populate('blockedUsers', 'name profilePhoto');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

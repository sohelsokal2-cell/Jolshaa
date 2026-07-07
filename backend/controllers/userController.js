const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const mongoose = require('mongoose');
const { isUserOnline } = require('../socket');
const { hasId } = require('../utils/id');

const stripHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

const sanitizeTextField = (str, maxLength = 200) => {
  if (typeof str !== 'string') return '';
  return stripHtml(str).substring(0, maxLength);
};

exports.getUserOnlineStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select('activeStatus lastSeen privacy');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isOwner = req.user._id.toString() === targetUser._id.toString();
    const online = isUserOnline(req.params.id);

    // Privacy: if user disabled showing online status, hide from non-owners
    const showStatus = isOwner || targetUser.privacy?.showOnlineStatus !== false;

    res.json({
      online: showStatus ? online : null,
      lastSeen: showStatus ? targetUser.lastSeen : null,
      showStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = await User.findById(req.params.id)
      .select('-password -loginHistory -sessions -blockedUsers -trustedDevices')
      .populate('friends', 'name profilePhoto bio');
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

    // Get mutual friends (reuse currentUser, use already-fetched friends from user doc)
    let mutualFriends = [];
    let mutualFriendsCount = 0;
    if (!isOwnProfile) {
      const targetFriendIds = (user.friends || []).map(f => f._id || f);
      const mutualIds = currentUser.friends.filter(f => hasId(targetFriendIds, f));
      mutualFriendsCount = mutualIds.length;
      if (mutualIds.length > 0) {
        mutualFriends = await User.find({ _id: { $in: mutualIds.slice(0, 5) } })
          .select('name profilePhoto');
      }
    }

    // Friend count from the already-fetched array
    const friendCount = (user.friends || []).length;

    // Get friend list (if allowed by privacy)
    let friends = [];
    const canShowFriends = isOwnProfile ||
      user.privacy?.showFriendsList === 'everyone' ||
      (user.privacy?.showFriendsList === 'friends' && friendStatus === 'friends');
    if (canShowFriends && friendCount > 0) {
      friends = user.friends;
    }

    // Follower / following counts
    const followerCount = (user.followers || []).length;
    const followingCount = (user.following || []).length;

    // Privacy: hide sensitive fields from non-owners
    const profile = {
      id: user._id,
      name: user.name,
      profilePhoto: user.profilePhoto,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      education: user.education,
      work: user.work,
      workHistory: user.workHistory || [],
      educationHistory: user.educationHistory || [],
      location: user.location,
      website: user.website || '',
      hometown: user.hometown || '',
      currentCity: user.currentCity || '',
      languagesSpoken: user.languagesSpoken || [],
      relationshipStatus: user.relationshipStatus || 'prefer not to say',
      createdAt: user.createdAt,
      friendStatus,
      friendRequestId,
      friendCount,
      mutualFriendsCount,
      mutualFriends,
      friends,
      followerCount,
      followingCount,
      pinnedPost: user.pinnedPost || null,
      profileSectionSettings: user.profileSectionSettings && user.profileSectionSettings.length > 0
        ? user.profileSectionSettings
        : [
            { key: 'posts', enabled: true, order: 0 },
            { key: 'about', enabled: true, order: 1 },
            { key: 'albums', enabled: true, order: 2 },
            { key: 'friends', enabled: true, order: 3 },
            { key: 'reels', enabled: true, order: 4 },
          ],
      profileLocked: !!user.profileLocked
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

    // Profile Lock: non-friend visitors get a stripped-down view
    const isLockedFromViewer = user.profileLocked && !isOwnProfile && friendStatus !== 'friends';
    if (isLockedFromViewer) {
      profile.isLimitedView = true;
      profile.bio = '';
      profile.education = '';
      profile.work = '';
      profile.workHistory = [];
      profile.educationHistory = [];
      profile.location = '';
      profile.website = '';
      profile.hometown = '';
      profile.currentCity = '';
      profile.languagesSpoken = [];
      profile.relationshipStatus = 'prefer not to say';
      profile.friends = [];
      profile.mutualFriends = [];
      profile.pinnedPost = null;
      profile.profileSectionSettings = profile.profileSectionSettings.map(s => ({ ...s, enabled: false }));
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
    const targetUser = await User.findById(req.params.id).select('blockedUsers friends profileLocked');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (hasId(targetUser.blockedUsers, req.user._id)) {
      return res.status(403).json({ message: 'User not found' });
    }
    const currentUser = await User.findById(req.user._id).select('blockedUsers friends');
    if (hasId(currentUser.blockedUsers, req.params.id)) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }

    const isOwnProfile = req.user._id.toString() === req.params.id;
    const isFriend = hasId(targetUser.friends, req.user._id);

    // Profile Lock: non-friend visitors see no posts
    if (targetUser.profileLocked && !isOwnProfile && !isFriend) {
      return res.json({ posts: [], page: 1, totalPages: 0, total: 0, isLimitedView: true });
    }

    // Determine visibility filter
    let visibilityFilter;
    if (isOwnProfile) {
      // Own profile: see all own posts
      visibilityFilter = {};
    } else {
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
    const manage = isOwnProfile && req.query.manage === 'true';

    const query = { author: req.params.id, ...visibilityFilter };

    // Manage Posts mode (owner only): show only archived/hidden posts.
    // Default mode: exclude archived and hidden-from-profile posts for everyone, including the owner's normal view.
    if (manage) {
      query.$or = [{ status: 'archived' }, { hiddenFromProfile: true }];
    } else {
      query.status = { $ne: 'archived' };
      query.hiddenFromProfile = { $ne: true };
    }

    if (req.query.type === 'photos') {
      query['media.type'] = 'image';
    } else if (req.query.type === 'videos') {
      query['media.type'] = 'video';
    } else if (req.query.type === 'text') {
      query.$and = [{ $or: [{ media: { $exists: false } }, { media: { $size: 0 } }] }];
    }

    const sortOrder = req.query.sort === 'oldest' ? 1 : -1;

    const posts = await Post.find(query)
      .sort({ createdAt: sortOrder })
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

// ── Get User Reels (Short-form videos) ──────────────────────────────

exports.getUserReels = async (req, res) => {
  try {
    const Post = require('../models/Post');

    const isOwnProfile = req.user._id.toString() === req.params.id;
    const targetUser = await User.findById(req.params.id).select('friends profileLocked');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    const isFriend = hasId(targetUser.friends, req.user._id);

    if (targetUser.profileLocked && !isOwnProfile && !isFriend) {
      return res.json({ reels: [], isLimitedView: true });
    }

    let visibilityFilter;
    if (isOwnProfile) {
      visibilityFilter = {};
    } else {
      visibilityFilter = isFriend
        ? { visibility: { $in: ['public', 'friends'] } }
        : { visibility: 'public' };
    }

    const reels = await Post.find({
      author: req.params.id,
      isShortForm: true,
      ...visibilityFilter
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('mediaUrl mediaType viewCount createdAt caption');

    res.json({ reels });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const allowedFields = ['name', 'phone', 'bio', 'dateOfBirth', 'gender', 'education', 'work', 'location', 'website', 'relationshipStatus', 'hometown', 'currentCity', 'languagesSpoken'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Sanitize text fields to prevent XSS
    if (updates.bio !== undefined) updates.bio = sanitizeTextField(updates.bio, 200);
    if (updates.location !== undefined) updates.location = sanitizeTextField(updates.location, 200);
    if (updates.website !== undefined) updates.website = sanitizeTextField(updates.website, 200);
    if (updates.education !== undefined) updates.education = sanitizeTextField(updates.education, 200);
    if (updates.work !== undefined) updates.work = sanitizeTextField(updates.work, 200);
    if (updates.hometown !== undefined) updates.hometown = sanitizeTextField(updates.hometown, 200);
    if (updates.currentCity !== undefined) updates.currentCity = sanitizeTextField(updates.currentCity, 200);
    if (updates.name !== undefined) updates.name = sanitizeTextField(updates.name, 50);

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
      website: user.website,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleProfileLock = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profileLocked = !user.profileLocked;
    await user.save();

    res.json({ profileLocked: user.profileLocked });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const VALID_SECTION_KEYS = ['posts', 'about', 'albums', 'friends', 'reels'];

exports.updateProfileSections = async (req, res) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ message: 'sections must be a non-empty array' });
    }

    const seen = new Set();
    for (const s of sections) {
      if (!VALID_SECTION_KEYS.includes(s.key) || seen.has(s.key)) {
        return res.status(400).json({ message: `Invalid or duplicate section key: ${s.key}` });
      }
      seen.add(s.key);
    }
    if (seen.size !== VALID_SECTION_KEYS.length) {
      return res.status(400).json({ message: 'All profile sections must be included' });
    }

    const normalized = sections.map((s, i) => ({
      key: s.key,
      enabled: s.enabled !== false,
      order: i,
    }));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileSectionSettings: normalized },
      { new: true, runValidators: true }
    ).select('profileSectionSettings');

    res.json({ profileSectionSettings: user.profileSectionSettings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { postVisibility, friendRequests, showFriendsList, commentPrivacy, storyVisibility, messagePrivacy, showOnlineStatus } = req.body;

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
    if (showOnlineStatus !== undefined) user.privacy.showOnlineStatus = showOnlineStatus;

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

// ── Work History CRUD ────────────────────────────────────────────────

exports.addWork = async (req, res) => {
  try {
    const { company, position, location, startDate, endDate, isCurrent, description } = req.body;
    if (!company) return res.status(400).json({ message: 'Company is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.workHistory.push({
      company,
      position: position || '',
      location: location || '',
      startDate: startDate || null,
      endDate: isCurrent ? null : (endDate || null),
      isCurrent: !!isCurrent,
      description: description || ''
    });

    await user.save();
    res.status(201).json({ workHistory: user.workHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateWork = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { company, position, location, startDate, endDate, isCurrent, description } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = user.workHistory.id(entryId);
    if (!entry) return res.status(404).json({ message: 'Work entry not found' });

    if (company !== undefined) entry.company = company;
    if (position !== undefined) entry.position = position;
    if (location !== undefined) entry.location = location;
    if (startDate !== undefined) entry.startDate = startDate || null;
    if (isCurrent !== undefined) entry.isCurrent = isCurrent;
    if (isCurrent) {
      entry.endDate = null;
    } else if (endDate !== undefined) {
      entry.endDate = endDate || null;
    }
    if (description !== undefined) entry.description = description;

    await user.save();
    res.json({ workHistory: user.workHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteWork = async (req, res) => {
  try {
    const { entryId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = user.workHistory.id(entryId);
    if (!entry) return res.status(404).json({ message: 'Work entry not found' });

    user.workHistory.pull(entryId);
    await user.save();
    res.json({ workHistory: user.workHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Education History CRUD ───────────────────────────────────────────

exports.addEducation = async (req, res) => {
  try {
    const { institution, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = req.body;
    if (!institution) return res.status(400).json({ message: 'Institution is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.educationHistory.push({
      institution,
      degree: degree || '',
      fieldOfStudy: fieldOfStudy || '',
      startDate: startDate || null,
      endDate: isCurrent ? null : (endDate || null),
      isCurrent: !!isCurrent,
      description: description || ''
    });

    await user.save();
    res.status(201).json({ educationHistory: user.educationHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { institution, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = user.educationHistory.id(entryId);
    if (!entry) return res.status(404).json({ message: 'Education entry not found' });

    if (institution !== undefined) entry.institution = institution;
    if (degree !== undefined) entry.degree = degree;
    if (fieldOfStudy !== undefined) entry.fieldOfStudy = fieldOfStudy;
    if (startDate !== undefined) entry.startDate = startDate || null;
    if (isCurrent !== undefined) entry.isCurrent = isCurrent;
    if (isCurrent) {
      entry.endDate = null;
    } else if (endDate !== undefined) {
      entry.endDate = endDate || null;
    }
    if (description !== undefined) entry.description = description;

    await user.save();
    res.json({ educationHistory: user.educationHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEducation = async (req, res) => {
  try {
    const { entryId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = user.educationHistory.id(entryId);
    if (!entry) return res.status(404).json({ message: 'Education entry not found' });

    user.educationHistory.pull(entryId);
    await user.save();
    res.json({ educationHistory: user.educationHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Followers / Following ────────────────────────────────────────────

exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const user = await User.findById(req.params.id).select('followers');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const total = user.followers.length;

    let followerIds = user.followers;
    if (search) {
      const matchingUsers = await User.find({
        _id: { $in: followerIds },
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      followerIds = matchingUsers.map(u => u._id);
    }

    const paginatedIds = followerIds.slice(skip, skip + limit);

    const followers = await User.find({ _id: { $in: paginatedIds } })
      .select('name profilePhoto bio monetization.isCreator')
      .populate('friends', '_id');

    // Add mutual friends count and isFollowing for each follower
    const currentUser = await User.findById(req.user._id).select('friends following');
    const followersWithMutual = followers.map(f => {
      const mutualCount = (currentUser.friends || []).filter(
        cf => (f.friends || []).some(ff => ff.toString() === cf.toString())
      ).length;
      const isFollowing = (currentUser.following || []).some(
        fid => fid.toString() === f._id.toString()
      );
      return { ...f.toObject(), mutualFriendsCount: mutualCount, isFollowing, friends: undefined };
    });

    res.json({
      followers: followersWithMutual,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const user = await User.findById(req.params.id).select('following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const total = user.following.length;

    let followingIds = user.following;
    if (search) {
      const matchingUsers = await User.find({
        _id: { $in: followingIds },
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      followingIds = matchingUsers.map(u => u._id);
    }

    const paginatedIds = followingIds.slice(skip, skip + limit);

    const following = await User.find({ _id: { $in: paginatedIds } })
      .select('name profilePhoto bio monetization.isCreator')
      .populate('friends', '_id');

    const currentUser = await User.findById(req.user._id).select('friends following');
    const followingWithMutual = following.map(f => {
      const mutualCount = (currentUser.friends || []).filter(
        cf => (f.friends || []).some(ff => ff.toString() === cf.toString())
      ).length;
      const isFollowing = (currentUser.following || []).some(
        fid => fid.toString() === f._id.toString()
      );
      return { ...f.toObject(), mutualFriendsCount: mutualCount, isFollowing, friends: undefined };
    });

    res.json({
      following: followingWithMutual,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowerCount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('followers');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ count: user.followers.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.some(id => id.toString() === userId);

    if (isFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(req.user._id, { $pull: { following: userId } }),
        User.findByIdAndUpdate(userId, { $pull: { followers: req.user._id } }),
      ]);
    } else {
      await Promise.all([
        User.findByIdAndUpdate(req.user._id, { $addToSet: { following: userId } }),
        User.findByIdAndUpdate(userId, { $addToSet: { followers: req.user._id } }),
      ]);

      // Notify
      const Notification = require('../models/Notification');
      const notification = await Notification.create({
        recipient: userId,
        sender: req.user._id,
        type: 'follow',
        message: `${currentUser.name} started following you`,
      });

      const { getIO } = require('../socket');
      getIO().to(`user:${userId}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: currentUser._id, name: currentUser.name, profilePhoto: currentUser.profilePhoto },
      });
    }

    if (targetUser.monetization?.isCreator) {
      await User.findByIdAndUpdate(userId, { 'monetization.followerCount': isFollowing ? targetUser.followers.length - 1 : targetUser.followers.length + 1 });
    }

    const updatedTarget = await User.findById(userId).select('followers');
    res.json({
      isFollowing: !isFollowing,
      followerCount: updatedTarget.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Pinned Post ──────────────────────────────────────────────────────

exports.pinPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const Post = require('../models/Post');

    // Verify the post exists and belongs to the user
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pin your own posts' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isReplacing = user.pinnedPost && user.pinnedPost.toString() !== postId;

    user.pinnedPost = postId;
    await user.save();

    res.json({
      pinnedPost: postId,
      replaced: isReplacing,
      message: isReplacing ? 'Pinned post replaced' : 'Post pinned to profile'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unpinPost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.pinnedPost = null;
    await user.save();

    res.json({ message: 'Post unpinned from profile' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPinnedPost = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('pinnedPost');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.pinnedPost) {
      return res.json({ pinnedPost: null });
    }

    const Post = require('../models/Post');
    const post = await Post.findById(user.pinnedPost)
      .populate('author', 'name profilePhoto isVerified')
      .populate('taggedUsers', 'name profilePhoto')
      .populate({ path: 'sharedPost', populate: { path: 'author', select: 'name profilePhoto' } });

    if (!post) {
      // Post was deleted, clean up the reference
      user.pinnedPost = null;
      await user.save();
      return res.json({ pinnedPost: null });
    }

    // Add reaction/comment counts
    const Reaction = require('../models/Reaction');
    const Comment = require('../models/Comment');

    const reactions = await Reaction.aggregate([
      { $match: { targetType: 'Post', targetId: post._id } },
      { $group: { _id: '$targetId', count: { $sum: 1 }, types: { $push: '$type' } } }
    ]);
    const myReaction = await Reaction.findOne({ targetType: 'Post', targetId: post._id, user: req.user._id });
    const commentCount = await Comment.countDocuments({ post: post._id });

    const postObj = post.toObject();
    postObj.reactions = reactions[0] ? { count: reactions[0].count, myReaction: myReaction?.type || null } : { count: 0, myReaction: null };
    postObj.commentCount = commentCount;
    postObj.isPinned = true;

    res.json({ pinnedPost: postObj });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Profile Completion ───────────────────────────────────────────────

exports.getProfileCompletion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('profilePhoto coverPhoto bio workHistory educationHistory dateOfBirth gender');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const Post = require('../models/Post');
    const postCount = await Post.countDocuments({ author: req.user._id });

    const defaultPhoto = 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128';

    const checks = [
      { key: 'profilePhoto', label: 'Add a profile photo', done: user.profilePhoto && user.profilePhoto !== defaultPhoto },
      { key: 'coverPhoto', label: 'Add a cover photo', done: !!user.coverPhoto },
      { key: 'bio', label: 'Add a bio', done: !!user.bio && user.bio.trim().length > 0 },
      { key: 'workHistory', label: 'Add work experience', done: user.workHistory && user.workHistory.length > 0 },
      { key: 'educationHistory', label: 'Add education', done: user.educationHistory && user.educationHistory.length > 0 },
      { key: 'dateOfBirth', label: 'Add your date of birth', done: !!user.dateOfBirth },
      { key: 'gender', label: 'Add your gender', done: user.gender && user.gender !== 'prefer not to say' },
      { key: 'post', label: 'Create your first post', done: postCount > 0 },
    ];

    const doneCount = checks.filter(c => c.done).length;
    const percentage = Math.round((doneCount / checks.length) * 100);
    const missingFields = checks.filter(c => !c.done).map(c => c.key);
    const missingLabels = checks.filter(c => !c.done).map(c => ({ key: c.key, label: c.label }));

    res.json({ percentage, missingFields, missingLabels, total: checks.length, done: doneCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Shared Groups & Pages in Common ─────────────────────────────────

exports.getSharedGroupsAndPages = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    if (id === String(myId)) {
      return res.json({ sharedGroups: [], sharedPages: [] });
    }

    const Group = require('../models/Group');
    const Page = require('../models/Page');

    const [sharedGroups, sharedPages] = await Promise.all([
      Group.find({ members: { $all: [myId, id] } })
        .select('name avatar members')
        .limit(5)
        .lean(),
      Page.find({ followers: { $all: [myId, id] } })
        .select('name avatar followers')
        .limit(5)
        .lean(),
    ]);

    res.json({ sharedGroups, sharedPages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

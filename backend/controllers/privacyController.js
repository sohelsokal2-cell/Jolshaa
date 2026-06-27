const User = require('../models/User');

// ========== CLOSE FRIENDS ==========

exports.getCloseFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('closeFriends', 'name profilePhoto');
    res.json({ closeFriends: user.closeFriends || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addCloseFriend = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot add yourself' });

    const user = await User.findById(req.user._id);
    if (user.closeFriends.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'Already in close friends' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    user.closeFriends.push(userId);
    await user.save();

    res.json({ message: 'Added to close friends', closeFriends: user.closeFriends });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeCloseFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.closeFriends = user.closeFriends.filter(id => id.toString() !== req.params.userId);
    await user.save();
    res.json({ message: 'Removed from close friends', closeFriends: user.closeFriends });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.isCloseFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isClose = user.closeFriends.some(id => id.toString() === req.params.userId);
    res.json({ isCloseFriend: isClose });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== MUTE / UNMUTE ==========

exports.getMutedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('mutedUsers', 'name profilePhoto');
    res.json({ mutedUsers: user.mutedUsers || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.muteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const user = await User.findById(req.user._id);
    if (!user.mutedUsers.some(id => id.toString() === userId)) {
      user.mutedUsers.push(userId);
      await user.save();
    }
    res.json({ message: 'User muted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unmuteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.mutedUsers = user.mutedUsers.filter(id => id.toString() !== req.params.userId);
    await user.save();
    res.json({ message: 'User unmuted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.isMuted = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const muted = user.mutedUsers.some(id => id.toString() === req.params.userId);
    res.json({ isMuted: muted });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== RESTRICT ==========

exports.getRestrictedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('restrictedUsers', 'name profilePhoto');
    res.json({ restrictedUsers: user.restrictedUsers || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.restrictUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const user = await User.findById(req.user._id);
    if (!user.restrictedUsers.some(id => id.toString() === userId)) {
      user.restrictedUsers.push(userId);
      await user.save();
    }
    res.json({ message: 'User restricted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unrestrictUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.restrictedUsers = user.restrictedUsers.filter(id => id.toString() !== req.params.userId);
    await user.save();
    res.json({ message: 'User unrestricted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.isRestricted = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const restricted = user.restrictedUsers.some(id => id.toString() === req.params.userId);
    res.json({ isRestricted: restricted });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== PRIVACY SETTINGS ==========

exports.updatePrivacy = async (req, res) => {
  try {
    const { postVisibility, friendRequests, showFriendsList, commentPrivacy, storyVisibility, messagePrivacy, storyHiddenFrom } = req.body;
    const user = await User.findById(req.user._id);
    
    if (postVisibility !== undefined) user.privacy.postVisibility = postVisibility;
    if (friendRequests !== undefined) user.privacy.friendRequests = friendRequests;
    if (showFriendsList !== undefined) user.privacy.showFriendsList = showFriendsList;
    if (commentPrivacy !== undefined) user.privacy.commentPrivacy = commentPrivacy;
    if (storyVisibility !== undefined) user.privacy.storyVisibility = storyVisibility;
    if (messagePrivacy !== undefined) user.privacy.messagePrivacy = messagePrivacy;
    if (storyHiddenFrom !== undefined) user.storyHiddenFrom = storyHiddenFrom;
    
    await user.save();
    res.json({ privacy: user.privacy, storyHiddenFrom: user.storyHiddenFrom });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacy storyHiddenFrom closeFriends mutedUsers restrictedUsers');
    res.json({
      privacy: user.privacy,
      storyHiddenFrom: user.storyHiddenFrom,
      closeFriends: user.closeFriends,
      mutedUsers: user.mutedUsers,
      restrictedUsers: user.restrictedUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

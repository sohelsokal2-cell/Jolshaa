const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const allowedFields = ['name', 'phone', 'profilePhoto', 'coverPhoto', 'bio', 'dateOfBirth', 'gender'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

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
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { postVisibility, friendRequests, showFriendsList } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (postVisibility) user.privacy.postVisibility = postVisibility;
    if (friendRequests) user.privacy.friendRequests = friendRequests;
    if (showFriendsList) user.privacy.showFriendsList = showFriendsList;

    await user.save();

    res.json({ privacy: user.privacy });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacy');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ privacy: user.privacy });
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

    const isBlocked = user.blockedUsers.includes(userId);
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

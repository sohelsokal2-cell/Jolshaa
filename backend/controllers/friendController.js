const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { hasId } = require('../utils/id');

exports.sendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot add yourself' });

    const targetUser = await User.findById(userId).select('blockedUsers privacy friends');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (hasId(targetUser.blockedUsers, req.user._id)) {
      return res.status(403).json({ message: 'Cannot send friend request' });
    }

    const currentUser = await User.findById(req.user._id).select('blockedUsers friends');
    if (hasId(currentUser.blockedUsers, userId)) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }
    if (hasId(currentUser.friends, userId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    if (targetUser.privacy.friendRequests === 'friends_of_friends') {
      const targetFriends = targetUser.friends || [];
      const mutualFriends = currentUser.friends.filter(f => hasId(targetFriends, f));
      if (mutualFriends.length === 0) {
        return res.status(403).json({ message: 'This user only accepts friend requests from friends of friends' });
      }
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: userId },
        { from: userId, to: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'pending') return res.status(400).json({ message: 'Friend request already pending' });
      if (existing.status === 'accepted') return res.status(400).json({ message: 'Already friends' });
      existing.from = req.user._id;
      existing.to = userId;
      existing.status = 'pending';
      await existing.save();

      await Notification.create({
        recipient: userId,
        sender: req.user._id,
        type: 'friend_request'
      });

      return res.json({ message: 'Friend request sent', request: existing });
    }

    const request = await FriendRequest.create({
      from: req.user._id,
      to: userId
    });

    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'friend_request'
    });

    res.status(201).json({ message: 'Friend request sent', request });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Friend request already pending' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already handled' });

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: request.from } });
    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: req.user._id } });

    await Notification.create({
      recipient: request.from,
      sender: req.user._id,
      type: 'friend_accept'
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already handled' });

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unfriend = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { friends: req.user._id } });

    await FriendRequest.deleteOne({
      $or: [
        { from: req.user._id, to: userId, status: 'accepted' },
        { from: userId, to: req.user._id, status: 'accepted' }
      ]
    });

    res.json({ message: 'Unfriended' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('friends')
      .populate('friends', 'name profilePhoto bio');
    res.json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const incoming = await FriendRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name profilePhoto bio');
    const outgoing = await FriendRequest.find({ from: req.user._id, status: 'pending' })
      .populate('to', 'name profilePhoto bio');

    res.json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMutualFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id).select('friends');
    const targetUser = await User.findById(userId).select('friends');

    if (!currentUser || !targetUser) return res.status(404).json({ message: 'User not found' });

    const mutualIds = currentUser.friends.filter(f => hasId(targetUser.friends, f));
    const mutualFriends = await User.find({ _id: { $in: mutualIds } })
      .select('name profilePhoto');

    res.json({ mutualFriends, count: mutualFriends.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSuggested = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('friends blockedUsers');

    const excludeIds = [...currentUser.friends, ...currentUser.blockedUsers, req.user._id];

    const friendsOfFriends = await User.find({ _id: { $in: currentUser.friends } }).select('friends');
    const fofIds = [...new Set(friendsOfFriends.flatMap(u => u.friends.map(f => f.toString())))];
    const suggestedIds = fofIds.filter(id => !excludeIds.some(e => e.toString() === id));

    let suggested;
    if (suggestedIds.length > 0) {
      suggested = await User.find({ _id: { $in: suggestedIds } })
        .select('name profilePhoto bio')
        .limit(20);
    } else {
      suggested = await User.find({ _id: { $nin: excludeIds } })
        .select('name profilePhoto bio')
        .limit(20);
    }

    const friendCounts = await Promise.all(
      suggested.map(async (u) => {
        const user = await User.findById(u._id).select('friends');
        const mutual = currentUser.friends.filter(f => hasId(user.friends, f));
        return { userId: u._id, mutualCount: mutual.length };
      })
    );

    const suggestedWithMutual = suggested.map(u => ({
      ...u.toObject(),
      mutualCount: friendCounts.find(f => f.userId.toString() === u._id.toString())?.mutualCount || 0
    }));

    suggestedWithMutual.sort((a, b) => b.mutualCount - a.mutualCount);

    res.json({ suggested: suggestedWithMutual });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id).select('friends');
    if (hasId(currentUser.friends, userId)) {
      return res.json({ status: 'friends' });
    }

    const outgoing = await FriendRequest.findOne({ from: req.user._id, to: userId, status: 'pending' });
    if (outgoing) return res.json({ status: 'pending_sent', requestId: outgoing._id });

    const incoming = await FriendRequest.findOne({ from: userId, to: req.user._id, status: 'pending' });
    if (incoming) return res.json({ status: 'pending_received', requestId: incoming._id });

    res.json({ status: 'none' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const User = require('../models/User');
const Notification = require('../models/Notification');
const { hasId } = require('../utils/id');

exports.subscribe = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }

    const creator = await User.findById(req.params.userId);
    if (!creator || !creator.isCreator) {
      return res.status(400).json({ message: 'User is not a creator' });
    }

    const currentUser = await User.findById(req.user._id);
    const isSubscribed = hasId(creator.subscribers, req.user._id);

    if (isSubscribed) {
      creator.subscribers.pull(req.user._id);
    } else {
      creator.subscribers.push(req.user._id);

      const notification = await Notification.create({
        recipient: creator._id,
        sender: req.user._id,
        type: 'subscription',
      });

      const { getIO } = require('../socket');
      getIO().to(`user:${creator._id}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: currentUser.name, profilePhoto: currentUser.profilePhoto },
      });
    }

    await creator.save();

    res.json({
      isSubscribed: !isSubscribed,
      subscriberCount: creator.subscribers.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('subscribers', 'name profilePhoto');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ subscribers: user.subscribers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setSubscriptionPrice = async (req, res) => {
  try {
    const { price } = req.body;

    const user = await User.findById(req.user._id);
    user.subscriptionPrice = parseFloat(price) || 0;
    await user.save();

    res.json({ subscriptionPrice: user.subscriptionPrice });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkSubscription = async (req, res) => {
  try {
    const creator = await User.findById(req.params.userId)
      .select('isCreator subscriptionPrice subscribers name profilePhoto');

    if (!creator) return res.status(404).json({ message: 'User not found' });

    const isSubscribed = creator.subscribers.some(
      (id) => id.toString() === req.user._id.toString()
    );

    res.json({
      isCreator: creator.isCreator,
      isSubscribed,
      subscriptionPrice: creator.subscriptionPrice,
      subscriberCount: creator.subscribers.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

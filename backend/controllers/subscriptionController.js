const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { hasId } = require('../utils/id');
const { sendEmail } = require('../services/emailService');

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

      sendEmail({
        to: creator.email,
        userId: creator._id,
        template: 'subscription_new',
        data: {
          creatorName: creator.name,
          subscriberName: currentUser.name,
          planName: 'Creator',
          price: creator.subscriptionPrice || 0,
          interval: 'month',
        },
      }).catch(() => {});
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

    const plans = await SubscriptionPlan.find({ creator: req.params.userId, isActive: true })
      .sort({ price: 1 });

    res.json({
      isCreator: creator.isCreator,
      isSubscribed,
      subscriptionPrice: creator.subscriptionPrice,
      subscriberCount: creator.subscribers.length,
      plans,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, price, currency, interval, features } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const plan = await SubscriptionPlan.create({
      creator: req.user._id,
      name: name || 'Premium',
      price,
      currency: currency || 'USD',
      interval: interval || 'monthly',
      features: features || [],
    });

    res.status(201).json({ plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ creator: req.params.userId })
      .sort({ price: 1 });

    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findOne({ _id: req.params.planId, creator: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const { name, price, currency, interval, features, isActive } = req.body;
    if (name !== undefined) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (currency !== undefined) plan.currency = currency;
    if (interval !== undefined) plan.interval = interval;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();
    res.json({ plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findOneAndDelete({ _id: req.params.planId, creator: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

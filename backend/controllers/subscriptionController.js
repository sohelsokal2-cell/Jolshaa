const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SubscriptionTier = require('../models/SubscriptionTier');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// ========== SUBSCRIPTION TIERS ==========

// Create a tier (creator only)
exports.createTier = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.monetization?.isCreator) {
      return res.status(403).json({ message: 'Only approved creators can create subscription tiers' });
    }

    const { name, price, perks, badge } = req.body;

    if (!name || !price || price <= 0) {
      return res.status(400).json({ message: 'Name and valid price are required' });
    }

    // Limit to 3 tiers per creator
    const existingTierCount = await SubscriptionTier.countDocuments({ creator: req.user._id, isActive: true });
    if (existingTierCount >= 3) {
      return res.status(400).json({ message: 'Maximum 3 subscription tiers allowed' });
    }

    const tier = await SubscriptionTier.create({
      creator: req.user._id,
      name: name.trim(),
      price: parseFloat(price),
      perks: perks || [],
      badge: badge || '',
    });

    res.status(201).json({ tier });
  } catch (error) {
    console.error('Create tier error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tiers for a creator (public)
exports.getTiers = async (req, res) => {
  try {
    const tiers = await SubscriptionTier.find({
      creator: req.params.creatorId,
      isActive: true,
    }).sort({ price: 1 });

    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a tier (creator only, own tiers)
exports.updateTier = async (req, res) => {
  try {
    const tier = await SubscriptionTier.findOne({
      _id: req.params.tierId,
      creator: req.user._id,
    });

    if (!tier) return res.status(404).json({ message: 'Tier not found' });

    const { name, price, perks, badge, isActive } = req.body;
    if (name !== undefined) tier.name = name;
    if (price !== undefined) tier.price = parseFloat(price);
    if (perks !== undefined) tier.perks = perks;
    if (badge !== undefined) tier.badge = badge;
    if (isActive !== undefined) tier.isActive = isActive;

    await tier.save();
    res.json({ tier });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a tier (creator only, own tiers)
exports.deleteTier = async (req, res) => {
  try {
    const tier = await SubscriptionTier.findOneAndDelete({
      _id: req.params.tierId,
      creator: req.user._id,
    });

    if (!tier) return res.status(404).json({ message: 'Tier not found' });

    // Cancel all active subscriptions for this tier
    await Subscription.updateMany(
      { tier: tier._id, status: 'active' },
      { status: 'expired', cancelledAt: new Date() }
    );

    res.json({ message: 'Tier deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== SUBSCRIBE / UNSUBSCRIBE ==========

// Subscribe to a creator's tier
exports.subscribe = async (req, res) => {
  try {
    const { creatorId, tierId } = req.body;

    if (!creatorId || !tierId) {
      return res.status(400).json({ message: 'creatorId and tierId are required' });
    }

    if (creatorId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }

    const creator = await User.findById(creatorId);
    if (!creator || !creator.monetization?.isCreator) {
      return res.status(404).json({ message: 'Creator not found or not monetized' });
    }

    const tier = await SubscriptionTier.findOne({ _id: tierId, creator: creatorId, isActive: true });
    if (!tier) return res.status(404).json({ message: 'Subscription tier not found' });

    // Check if already subscribed to this creator
    const existingSub = await Subscription.findOne({
      creator: creatorId,
      subscriber: req.user._id,
      status: 'active',
    });

    if (existingSub) {
      return res.status(400).json({ message: 'Already subscribed to this creator' });
    }

    // Create subscription
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subscription = await Subscription.create({
      creator: creatorId,
      subscriber: req.user._id,
      tier: tierId,
      price: tier.price,
      status: 'active',
      startDate: new Date(),
      nextBillingDate,
    });

    // Increment tier subscriber count
    await SubscriptionTier.findByIdAndUpdate(tierId, { $inc: { subscriberCount: 1 } });

    // Notify creator
    const subscriber = await User.findById(req.user._id).select('name profilePhoto');
    const notification = await Notification.create({
      recipient: creatorId,
      sender: req.user._id,
      type: 'subscription',
      message: `${subscriber.name} subscribed to your ${tier.name} tier`,
    });

    getIO().to(`user:${creatorId}`).emit('newNotification', {
      ...notification.toObject(),
      sender: { _id: subscriber._id, name: subscriber.name, profilePhoto: subscriber.profilePhoto },
    });

    res.status(201).json({
      subscription,
      message: 'Subscription created. Payment will be processed.',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      subscriber: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Decrement tier subscriber count
    await SubscriptionTier.findByIdAndUpdate(subscription.tier, { $inc: { subscriberCount: -1 } });

    // Notify creator
    const subscriber = await User.findById(req.user._id).select('name');
    const notification = await Notification.create({
      recipient: subscription.creator,
      sender: req.user._id,
      type: 'subscription',
      message: `${subscriber.name} cancelled their subscription`,
    });

    getIO().to(`user:${subscription.creator}`).emit('newNotification', {
      ...notification.toObject(),
      sender: { _id: subscriber._id, name: subscriber.name, profilePhoto: subscriber.profilePhoto },
    });

    res.json({ message: 'Subscription cancelled. Access remains until billing period ends.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== MY SUBSCRIPTIONS / SUBSCRIBERS ==========

// List creators I'm subscribed to
exports.getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      subscriber: req.user._id,
      status: { $in: ['active', 'cancelled'] },
    })
      .populate('creator', 'name profilePhoto isCreator badges')
      .populate('tier', 'name badge perks')
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List my subscribers (creator only)
exports.getMySubscribers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.monetization?.isCreator) {
      return res.status(403).json({ message: 'Not a creator account' });
    }

    const subscribers = await Subscription.find({
      creator: req.user._id,
      status: 'active',
    })
      .populate('subscriber', 'name profilePhoto')
      .populate('tier', 'name badge price')
      .sort({ createdAt: -1 });

    // Group by tier
    const grouped = {};
    subscribers.forEach((sub) => {
      const tierName = sub.tier?.name || 'Unknown';
      if (!grouped[tierName]) {
        grouped[tierName] = {
          tier: sub.tier,
          subscribers: [],
        };
      }
      grouped[tierName].subscribers.push(sub);
    });

    res.json({ subscribers, grouped, total: subscribers.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is subscribed to a specific creator
exports.checkSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      creator: req.params.creatorId,
      subscriber: req.user._id,
      status: 'active',
    }).populate('tier', 'name badge perks');

    res.json({
      isSubscribed: !!subscription,
      subscription: subscription || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

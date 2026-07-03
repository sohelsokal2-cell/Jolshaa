const HelpRequest = require('../models/HelpRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const { getIO } = require('../socket');

const URGENCY_EXPIRY = {
  immediate: 6 * 60 * 60 * 1000,
  within_hours: 24 * 60 * 60 * 1000,
  within_days: 72 * 60 * 60 * 1000,
};

const HELP_TYPE_ICONS = {
  medical: '🏥',
  flood: '🌊',
  fire: '🔥',
  lost_person: '🔍',
  food: '🍲',
  shelter: '🏠',
  financial: '💰',
  other: '🆘',
};

const createNotification = async (recipientId, senderId, type, meta = {}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: 'system',
      ...meta,
    });
    getIO().to(`user:${recipientId}`).emit('newNotification', {
      ...notification.toObject(),
      meta: { helpNotification: true, ...meta.meta },
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { title, description, helpType, location, urgency, postId } = req.body;

    if (!title || !description || !helpType || !location?.district || !location?.division) {
      return res.status(400).json({ message: 'Title, description, helpType, and location (division+district) are required' });
    }

    // Rate limit: max 3 active requests per user
    const activeCount = await HelpRequest.countDocuments({
      requester: req.user._id,
      status: 'active',
    });
    if (activeCount >= 3) {
      return res.status(400).json({ message: 'You can have at most 3 active help requests at a time' });
    }

    const expiresAt = new Date(Date.now() + (URGENCY_EXPIRY[urgency] || URGENCY_EXPIRY.immediate));

    const helpRequest = await HelpRequest.create({
      post: postId || null,
      requester: req.user._id,
      title,
      description,
      helpType,
      location: {
        division: location.division,
        district: location.district,
        upazila: location.upazila || '',
        coordinates: location.coordinates || {},
      },
      urgency: urgency || 'immediate',
      expiresAt,
    });

    await helpRequest.populate('requester', 'name profilePhoto');

    // Emit to district room
    const districtRoom = `district_${location.district}`;
    getIO().to(districtRoom).emit('newHelpRequest', {
      ...helpRequest.toObject(),
      icon: HELP_TYPE_ICONS[helpType] || '🆘',
    });

    // If immediate urgency, emit a special alert
    if (urgency === 'immediate') {
      getIO().to(districtRoom).emit('urgentHelpAlert', {
        title: helpRequest.title,
        district: location.district,
        helpType,
        icon: HELP_TYPE_ICONS[helpType] || '🆘',
      });
    }

    res.status(201).json(helpRequest);
  } catch (error) {
    console.error('Create help request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPostHelp = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, helpType, location, urgency } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const activeCount = await HelpRequest.countDocuments({
      requester: req.user._id,
      status: 'active',
    });
    if (activeCount >= 3) {
      return res.status(400).json({ message: 'You can have at most 3 active help requests at a time' });
    }

    const expiresAt = new Date(Date.now() + (URGENCY_EXPIRY[urgency] || URGENCY_EXPIRY.immediate));

    const helpRequest = await HelpRequest.create({
      post: id,
      requester: req.user._id,
      title: title || post.text?.slice(0, 100) || 'Help needed',
      description: description || post.text || '',
      helpType: helpType || 'other',
      location: {
        division: location?.division || '',
        district: location?.district || '',
        upazila: location?.upazila || '',
        coordinates: location?.coordinates || {},
      },
      urgency: urgency || 'immediate',
      expiresAt,
    });

    await helpRequest.populate('requester', 'name profilePhoto');

    const districtRoom = `district_${helpRequest.location.district}`;
    getIO().to(districtRoom).emit('newHelpRequest', {
      ...helpRequest.toObject(),
      icon: HELP_TYPE_ICONS[helpRequest.helpType] || '🆘',
    });

    res.status(201).json(helpRequest);
  } catch (error) {
    console.error('Create post help error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNearby = async (req, res) => {
  try {
    const { district, division, helpType, sort } = req.query;

    const query = { status: 'active', expiresAt: { $gt: new Date() } };

    if (district) query['location.district'] = district;
    if (division) query['location.division'] = division;
    if (helpType && helpType !== 'all') query.helpType = helpType;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let requests;
    if (sort === 'urgent') {
      requests = await HelpRequest.aggregate([
        { $match: query },
        {
          $addFields: {
            urgencyOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ['$urgency', 'immediate'] }, then: 1 },
                  { case: { $eq: ['$urgency', 'within_hours'] }, then: 2 },
                  { case: { $eq: ['$urgency', 'within_days'] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { urgencyOrder: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'requester',
            foreignField: '_id',
            as: 'requester',
            pipeline: [{ $project: { name: 1, profilePhoto: 1 } }],
          },
        },
        { $unwind: { path: '$requester', preserveNullAndEmptyArrays: true } },
        { $project: { helpers: 0, urgencyOrder: 0 } },
      ]);
    } else {
      requests = await HelpRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requester', 'name profilePhoto')
        .select('-helpers');
    }

    const total = await HelpRequest.countDocuments(query);

    // Auto-expire check
    const expired = await HelpRequest.find({
      status: 'active',
      expiresAt: { $lte: new Date() },
    }).select('_id');
    if (expired.length > 0) {
      await HelpRequest.updateMany(
        { _id: { $in: expired.map(e => e._id) } },
        { $set: { status: 'expired' } }
      );
    }

    res.json({
      requests,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Get nearby help error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRequest = async (req, res) => {
  try {
    const request = await HelpRequest.findById(req.params.id)
      .populate('requester', 'name profilePhoto helpedCount helpedOthersCount')
      .populate('helpers.user', 'name profilePhoto');

    if (!request) return res.status(404).json({ message: 'Help request not found' });

    // Auto-expire
    if (request.status === 'active' && request.expiresAt <= new Date()) {
      request.status = 'expired';
      await request.save();
    }

    // Increment view count
    request.viewCount += 1;
    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Get help request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.offerHelp = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const request = await HelpRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Help request not found' });

    if (request.status !== 'active') {
      return res.status(400).json({ message: 'This help request is no longer active' });
    }

    if (request.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot offer help on your own request' });
    }

    // Check if already offered
    const alreadyOffered = request.helpers.some(
      h => h.user.toString() === req.user._id.toString()
    );
    if (alreadyOffered) {
      return res.status(400).json({ message: 'You have already offered help for this request' });
    }

    request.helpers.push({
      user: req.user._id,
      message: message || '',
      offeredAt: new Date(),
      status: 'offered',
    });
    await request.save();

    // Notify requester
    await createNotification(request.requester, req.user._id, 'system', {
      relatedPost: request.post || undefined,
      meta: {
        type: 'helper_offer',
        helpRequestId: request._id,
        title: request.title,
        helperName: req.user.name,
      },
    });

    // Emit socket event to requester
    getIO().to(`user:${request.requester}`).emit('newHelperOffer', {
      helpRequestId: request._id,
      helper: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
      message: message || '',
    });

    res.json({ message: 'Help offer submitted', helpers: request.helpers });
  } catch (error) {
    console.error('Offer help error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptHelper = async (req, res) => {
  try {
    const { id, helperId } = req.params;

    const request = await HelpRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Help request not found' });

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requester can accept helpers' });
    }

    const helper = request.helpers.id(helperId);
    if (!helper) return res.status(404).json({ message: 'Helper not found' });

    helper.status = 'accepted';
    await request.save();

    // Create help coordination conversation
    const conversation = await Conversation.create({
      participants: [req.user._id, helper.user],
      conversationType: 'help_coordination',
      helpRequest: request._id,
    });

    // Send initial system message
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: `সাহায্য সমন্বয় চ্যাট: "${request.title}"\n\nএই চ্যাটে আপনি সাহায্য সম্পর্কে কথা বলতে পারবেন।`,
    });

    await conversation.populate('participants', 'name profilePhoto');

    // Notify helper
    await createNotification(helper.user, req.user._id, 'system', {
      relatedConversation: conversation._id,
      meta: {
        type: 'offer_accepted',
        helpRequestId: request._id,
        title: request.title,
        requesterName: req.user.name,
        conversationId: conversation._id,
      },
    });

    getIO().to(`user:${helper.user}`).emit('helpOfferAccepted', {
      helpRequestId: request._id,
      conversation: { _id: conversation._id, participants: conversation.participants },
      title: request.title,
    });

    res.json({
      message: 'Helper accepted',
      conversation: { _id: conversation._id, participants: conversation.participants },
    });
  } catch (error) {
    console.error('Accept helper error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resolveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedNote } = req.body;

    const request = await HelpRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Help request not found' });

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requester can mark as resolved' });
    }

    request.status = 'resolved';
    request.resolvedAt = new Date();
    request.resolvedNote = resolvedNote || '';
    await request.save();

    // Update stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { helpedCount: 1 } });

    const acceptedHelpers = request.helpers.filter(h => h.status === 'accepted');
    for (const h of acceptedHelpers) {
      await User.findByIdAndUpdate(h.user, { $inc: { helpedOthersCount: 1 } });
    }

    // Notify all helpers
    for (const h of request.helpers) {
      if (h.user.toString() !== req.user._id.toString()) {
        await createNotification(h.user, req.user._id, 'system', {
          relatedPost: request.post || undefined,
          meta: {
            type: 'help_resolved',
            helpRequestId: request._id,
            title: request.title,
            resolvedNote: resolvedNote || '',
          },
        });

        getIO().to(`user:${h.user}`).emit('helpResolved', {
          helpRequestId: request._id,
          title: request.title,
          resolvedNote: resolvedNote || '',
        });
      }
    }

    res.json({ message: 'Help request resolved' });
  } catch (error) {
    console.error('Resolve help error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getHelpHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [given, received] = await Promise.all([
      HelpRequest.find({
        'helpers.user': id,
        status: 'resolved',
      })
        .sort({ resolvedAt: -1 })
        .limit(20)
        .populate('requester', 'name profilePhoto')
        .select('title helpType status resolvedAt resolvedNote helpers'),

      HelpRequest.find({
        requester: id,
        status: { $in: ['resolved', 'active'] },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('requester', 'name profilePhoto')
        .select('title helpType status createdAt resolvedAt resolvedNote helpers'),
    ]);

    const user = await User.findById(id).select('helpedCount helpedOthersCount');

    res.json({
      helpedCount: user?.helpedCount || 0,
      helpedOthersCount: user?.helpedOthersCount || 0,
      given,
      received,
    });
  } catch (error) {
    console.error('Get help history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

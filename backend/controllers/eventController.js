const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const { hasId } = require('../utils/id');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, visibility } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ message: 'Title and start date are required' });
    }

    let coverPhoto = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/events');
      coverPhoto = result.secure_url;
    }

    const event = await Event.create({
      title,
      description,
      location,
      startDate,
      endDate,
      visibility: visibility || 'public',
      coverPhoto,
      creator: req.user._id,
      attendees: [{ user: req.user._id, status: 'going' }]
    });

    await event.populate('creator', 'name profilePhoto');

    res.status(201).json({ event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { past } = req.query;

    const query = {};
    if (past === 'true') {
      query.startDate = { $lt: new Date() };
    } else {
      query.startDate = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .sort({ startDate: past === 'true' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profilePhoto');

    const total = await Event.countDocuments(query);

    const eventsWithMeta = events.map(event => ({
      ...event.toObject(),
      attendeeCount: event.attendees.filter(a => a.status === 'going').length,
      maybeCount: event.attendees.filter(a => a.status === 'maybe').length,
      myStatus: event.attendees.find(a => a.user.toString() === req.user._id.toString())?.status || null,
      isCreator: event.creator._id.toString() === req.user._id.toString()
    }));

    res.json({
      events: eventsWithMeta,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name profilePhoto')
      .populate('attendees.user', 'name profilePhoto')
      .populate('invitedUsers', 'name profilePhoto');

    if (!event) return res.status(404).json({ message: 'Event not found' });

    const myStatus = event.attendees.find(a => a.user._id.toString() === req.user._id.toString())?.status || null;
    const isCreator = event.creator._id.toString() === req.user._id.toString();
    const isInvited = event.invitedUsers.some(u => u._id.toString() === req.user._id.toString());

    res.json({
      event: {
        ...event.toObject(),
        attendeeCount: event.attendees.filter(a => a.status === 'going').length,
        maybeCount: event.attendees.filter(a => a.status === 'maybe').length,
        notGoingCount: event.attendees.filter(a => a.status === 'not_going').length,
        myStatus,
        isCreator,
        isInvited
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can update' });
    }

    const allowedFields = ['title', 'description', 'location', 'startDate', 'endDate', 'visibility'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/events');
      event.coverPhoto = result.secure_url;
    }

    await event.save();
    await event.populate('creator', 'name profilePhoto');

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rsvpEvent = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existing = event.attendees.find(a => a.user.toString() === req.user._id.toString());
    if (existing) {
      existing.status = status;
      existing.respondedAt = new Date();
    } else {
      event.attendees.push({ user: req.user._id, status });
    }

    await event.save();

    if (status === 'going' && event.creator.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: event.creator,
        sender: req.user._id,
        type: 'event_rsvp',
        relatedEvent: event._id
      });
    }

    res.json({ message: 'RSVP updated', status });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.inviteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can invite' });
    }

    const newInvites = userIds.filter(id => !hasId(event.invitedUsers, id));
    event.invitedUsers.push(...newInvites);
    await event.save();

    await Promise.all(newInvites.map(userId =>
      Notification.create({
        recipient: userId,
        sender: req.user._id,
        type: 'event_invite',
        relatedEvent: event._id
      })
    ));

    res.json({ message: `${newInvites.length} users invited`, invitedUsers: event.invitedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendees.user', 'name profilePhoto');

    if (!event) return res.status(404).json({ message: 'Event not found' });

    const going = event.attendees.filter(a => a.status === 'going').map(a => a.user);
    const maybe = event.attendees.filter(a => a.status === 'maybe').map(a => a.user);
    const notGoing = event.attendees.filter(a => a.status === 'not_going').map(a => a.user);

    res.json({ going, maybe, notGoing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const now = new Date();

    const created = await Event.find({ creator: req.user._id, startDate: { $gte: now } })
      .sort({ startDate: 1 })
      .populate('creator', 'name profilePhoto');

    const attending = await Event.find({
      'attendees.user': req.user._id,
      'attendees.status': 'going',
      creator: { $ne: req.user._id },
      startDate: { $gte: now }
    })
      .sort({ startDate: 1 })
      .populate('creator', 'name profilePhoto');

    const invited = await Event.find({
      invitedUsers: req.user._id,
      creator: { $ne: req.user._id },
      'attendees.user': { $ne: req.user._id },
      startDate: { $gte: now }
    })
      .sort({ startDate: 1 })
      .populate('creator', 'name profilePhoto');

    const allEvents = [...created, ...attending, ...invited];
    const uniqueEvents = [...new Map(allEvents.map(e => [e._id.toString(), e])).values()];
    uniqueEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const eventsWithMeta = uniqueEvents.map(event => ({
      ...event.toObject(),
      attendeeCount: event.attendees.filter(a => a.status === 'going').length,
      myStatus: event.attendees.find(a => a.user.toString() === req.user._id.toString())?.status || null,
      isCreator: event.creator._id.toString() === req.user._id.toString()
    }));

    res.json({ events: eventsWithMeta });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  inviteUsers,
  getAttendees,
  getMyEvents
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/', upload.single('coverPhoto'), upload.checkMediaSize, createEvent);
router.get('/my', getMyEvents);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.put('/:id', upload.single('coverPhoto'), upload.checkMediaSize, updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/rsvp', rsvpEvent);
router.post('/:id/invite', inviteUsers);
router.get('/:id/attendees', getAttendees);

module.exports = router;

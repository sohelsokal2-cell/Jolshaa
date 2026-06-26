const express = require('express');
const router = express.Router();
const multer = require('multer');
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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

router.post('/', upload.single('coverPhoto'), createEvent);
router.get('/my', getMyEvents);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.put('/:id', upload.single('coverPhoto'), updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/rsvp', rsvpEvent);
router.post('/:id/invite', inviteUsers);
router.get('/:id/attendees', getAttendees);

module.exports = router;

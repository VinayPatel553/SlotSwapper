import express from 'express';
import Event from '../models/Event.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user._id }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, startTime, endTime, status } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide title, startTime, and endTime' });
    }

    const event = await Event.create({
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: status || 'BUSY',
      userId: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the event belongs to the user
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const { title, startTime, endTime, status } = req.body;

    if (title) event.title = title;
    if (startTime) event.startTime = new Date(startTime);
    if (endTime) event.endTime = new Date(endTime);
    if (status) event.status = status;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the event belongs to the user
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


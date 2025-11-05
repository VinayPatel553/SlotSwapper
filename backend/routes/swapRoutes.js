import express from 'express';
import Event from '../models/Event.js';
import SwapRequest from '../models/SwapRequest.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/swappable-slots
// @desc    Get all swappable slots from other users
// @access  Private
router.get('/swappable-slots', protect, async (req, res) => {
  try {
    const swappableSlots = await Event.find({
      status: 'SWAPPABLE',
      userId: { $ne: req.user._id }
    })
    .populate('userId', 'name email')
    .sort({ startTime: 1 });

    res.json(swappableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/swap-request
// @desc    Create a swap request
// @access  Private
router.post('/swap-request', protect, async (req, res) => {
  try {
    const { mySlotId, theirSlotId } = req.body;

    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({ message: 'Please provide both mySlotId and theirSlotId' });
    }

    // Get both slots
    const mySlot = await Event.findById(mySlotId);
    const theirSlot = await Event.findById(theirSlotId);

    if (!mySlot || !theirSlot) {
      return res.status(404).json({ message: 'One or both slots not found' });
    }

    // Verify mySlot belongs to the requester
    if (mySlot.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only swap your own slots' });
    }

    // Verify both slots are SWAPPABLE
    if (mySlot.status !== 'SWAPPABLE' || theirSlot.status !== 'SWAPPABLE') {
      return res.status(400).json({ message: 'Both slots must be SWAPPABLE' });
    }

    // Verify we're not trying to swap with ourselves
    if (theirSlot.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot swap with your own slot' });
    }

    // Check if there's already a pending swap request for these slots
    const existingRequest = await SwapRequest.findOne({
      $or: [
        {
          requesterSlotId: mySlotId,
          responderSlotId: theirSlotId,
          status: 'PENDING'
        },
        {
          requesterSlotId: theirSlotId,
          responderSlotId: mySlotId,
          status: 'PENDING'
        }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A swap request already exists for these slots' });
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      requesterId: req.user._id,
      responderId: theirSlot.userId,
      requesterSlotId: mySlotId,
      responderSlotId: theirSlotId,
      status: 'PENDING'
    });

    // Update both slots to SWAP_PENDING
    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';
    await mySlot.save();
    await theirSlot.save();

    const populatedRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requesterId', 'name email')
      .populate('responderId', 'name email')
      .populate('requesterSlotId')
      .populate('responderSlotId');

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/swap-response/:requestId
// @desc    Respond to a swap request (accept or reject)
// @access  Private
router.post('/swap-response/:requestId', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { accepted } = req.body;

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({ message: 'Please provide accepted (true/false)' });
    }

    const swapRequest = await SwapRequest.findById(requestId)
      .populate('requesterSlotId')
      .populate('responderSlotId');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Verify the user is the responder
    if (swapRequest.responderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this swap request' });
    }

    // Verify the request is still pending
    if (swapRequest.status !== 'PENDING') {
      return res.status(400).json({ message: 'Swap request is no longer pending' });
    }

    if (accepted) {
      // ACCEPTED: Swap the owners
      swapRequest.status = 'ACCEPTED';
      
      const requesterSlot = swapRequest.requesterSlotId;
      const responderSlot = swapRequest.responderSlotId;

      // Swap the userIds
      const tempUserId = requesterSlot.userId;
      requesterSlot.userId = responderSlot.userId;
      responderSlot.userId = tempUserId;

      // Set both slots back to BUSY
      requesterSlot.status = 'BUSY';
      responderSlot.status = 'BUSY';

      await requesterSlot.save();
      await responderSlot.save();
    } else {
      // REJECTED: Set slots back to SWAPPABLE
      swapRequest.status = 'REJECTED';
      
      swapRequest.requesterSlotId.status = 'SWAPPABLE';
      swapRequest.responderSlotId.status = 'SWAPPABLE';

      await swapRequest.requesterSlotId.save();
      await swapRequest.responderSlotId.save();
    }

    await swapRequest.save();

    const updatedRequest = await SwapRequest.findById(requestId)
      .populate('requesterId', 'name email')
      .populate('responderId', 'name email')
      .populate('requesterSlotId')
      .populate('responderSlotId');

    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/swap-requests/incoming
// @desc    Get incoming swap requests for the logged-in user
// @access  Private
router.get('/swap-requests/incoming', protect, async (req, res) => {
  try {
    const incomingRequests = await SwapRequest.find({
      responderId: req.user._id,
      status: 'PENDING'
    })
    .populate('requesterId', 'name email')
    .populate('requesterSlotId')
    .populate('responderSlotId')
    .sort({ createdAt: -1 });

    res.json(incomingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/swap-requests/outgoing
// @desc    Get outgoing swap requests from the logged-in user
// @access  Private
router.get('/swap-requests/outgoing', protect, async (req, res) => {
  try {
    const outgoingRequests = await SwapRequest.find({
      requesterId: req.user._id
    })
    .populate('responderId', 'name email')
    .populate('requesterSlotId')
    .populate('responderSlotId')
    .sort({ createdAt: -1 });

    res.json(outgoingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


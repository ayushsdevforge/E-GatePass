const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const GatepassRequest = require('../models/GatepassRequest');

// @desc    Get all gatepass requests
// @route   GET /api/gatepass/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
  try {
    // For now, return empty array
    res.status(200).json({
      success: true,
      requests: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create a gatepass request
// @route   POST /api/gatepass/requests
// @access  Private
router.post('/requests', protect, async (req, res) => {
  try {
    const { reason, tg } = req.body;
    const tgUser = await User.findOne({ email: tg, role: 'tg' });
    if (!tgUser) return res.status(400).json({ success: false, message: 'TG not found' });

    const newRequest = await GatepassRequest.create({
      student: req.user._id,
      reason,
      tg: tgUser._id
    });

    res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all TGs
// @route   GET /api/gatepass/tgs
// @access  Public
router.get('/tgs', async (req, res) => {
  try {
    const tgs = await User.find({ role: 'tg', status: 'active' }).select('fullName email');
    res.json({ success: true, tgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Function to generate a unique ticket ID
function generateTicketId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `GP-${timestamp}-${randomStr}`.toUpperCase();
}

// Update request status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const request = await GatepassRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Generate ticket ID if request is being approved
        if (status === 'approved' && !request.ticketId) {
            request.ticketId = generateTicketId();
        }

        request.status = status;
        
        if (status === 'forwarded') {
            request.forwardedTo = req.user._id;
            request.forwardedAt = new Date();
        } else if (status === 'approved') {
            request.approvedBy = req.user._id;
            request.approvedAt = new Date();
        } else if (status === 'rejected') {
            request.rejectedBy = req.user._id;
            request.rejectedAt = new Date();
        }

        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
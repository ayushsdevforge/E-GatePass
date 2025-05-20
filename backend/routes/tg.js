const express = require('express');
const { tgLogin, verify } = require('../controllers/authController');
const { getTGRequests, forwardToHOD, deleteRequest, getHODs } = require('../controllers/gatepassController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/login', tgLogin);
router.get('/verify', verify);
router.get('/requests', protect, getTGRequests);
router.post('/requests/:id/forward', protect, forwardToHOD);
router.delete('/request/:id', protect, deleteRequest);
router.get('/hods', protect, getHODs);

module.exports = router; 
// inquiryRoutes.js
const express = require('express');
const router = express.Router();
const { submitInquiry, getAllInquiries } = require('../controllers/inquiryController');
// const { protect, adminOnly } = require('../middleware/auth');

// POST /api/inquiries - Submit a new inquiry (public)
router.post('/', submitInquiry);

// GET /api/inquiries - Get all inquiries (admin only)
// router.get('/', protect, adminOnly, getAllInquiries);

module.exports = router;

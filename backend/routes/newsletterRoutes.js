// newsletterRoutes.js
const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe } = require('../controllers/newsletterController');

// POST /api/newsletter/subscribe
router.post('/subscribe', subscribe);

// DELETE /api/newsletter/unsubscribe
router.delete('/unsubscribe', unsubscribe);

module.exports = router;

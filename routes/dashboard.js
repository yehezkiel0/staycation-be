const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary statistics
// @access  Private (Admin only)
router.get('/summary', auth, dashboardController.getSummary);

// @route   GET /api/dashboard/activity
// @desc    Get recent activity (bookings)
// @access  Private (Admin only)
router.get('/activity', auth, dashboardController.getActivity);

module.exports = router;

const User = require('../models/User');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private (Admin only)
exports.getSummary = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Parallel execution for performance
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      revenueData
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Property.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'checked_in', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.json({
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue
    });
  } catch (error) {
    console.error('Dashboard Summary Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recent activity (bookings)
// @route   GET /api/dashboard/activity
// @access  Private (Admin only)
exports.getActivity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const recentBookings = await Booking.find()
      .populate('user', 'firstName lastName')
      .populate('property', 'title')
      .sort({ createdAt: -1 }) // Newest first
      .limit(5);

    res.json(recentBookings);
  } catch (error) {
    console.error('Dashboard Activity Error:', error.message);
    // require('fs').writeFileSync('dashboard_error.log', error.stack); // Uncomment for debugging
    res.status(500).json({ message: 'Server error', error: error.stack });
  }
};

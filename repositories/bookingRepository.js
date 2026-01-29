const Booking = require("../models/Booking");

class BookingRepository {
  async create(bookingData) {
    const booking = new Booking(bookingData);
    await booking.save();
    return booking;
  }

  async find(query = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const bookings = await Booking.find(query)
      .populate("property", "title location images price type")
      .populate("user", "firstName lastName email")
      .populate("review")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);
    return { bookings, total };
  }

  async findOne(query) {
    return await Booking.findOne(query);
  }

  async findById(id) {
    return await Booking.findById(id);
  }

  async findByIdWithDetails(id) {
    return await Booking.findById(id)
      .populate("property", "title location images price type features")
      .populate("user", "firstName lastName email phone")
      .populate("review");
  }

  async update(id, updateData) {
    return await Booking.findByIdAndUpdate(id, updateData, { new: true });
  }

  async save(booking) {
    return await booking.save();
  }

  async deleteMany(query) {
    return await Booking.deleteMany(query);
  }

  async findLatest(limit = 50) {
    return await Booking.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id");
  }
}

module.exports = new BookingRepository();

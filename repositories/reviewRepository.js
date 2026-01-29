const Review = require("../models/Review");
const Property = require("../models/Property");

class ReviewRepository {
  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const reviews = await Review.find(query)
      .populate("user", "firstName lastName avatar")
      .populate("property", "name city country imageUrls")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);
    return { reviews, total };
  }

  async findById(id) {
    return await Review.findById(id)
      .populate("user", "firstName lastName avatar")
      .populate("property", "name city country imageUrls")
      .populate("booking", "checkIn checkOut");
  }

  async findOne(query) {
    return await Review.findOne(query);
  }

  async create(data) {
    const review = new Review(data);
    await review.save();
    return review;
  }

  async update(id, updateData) {
    const review = await Review.findById(id);
    if (!review) return null;

    Object.assign(review, updateData);
    review.updatedAt = new Date();
    await review.save();
    return review;
  }

  async delete(id) {
    return await Review.findByIdAndDelete(id);
  }

  async save(review) {
    return await review.save();
  }

  async updatePropertyRating(propertyId) {
    const reviews = await Review.find({ property: propertyId });

    if (reviews.length === 0) {
      await Property.findByIdAndUpdate(propertyId, {
        "ratings.average": 0,
        "ratings.count": 0,
      });
      return;
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating.overall,
      0,
    );
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await Property.findByIdAndUpdate(propertyId, {
      "ratings.average": averageRating,
      "ratings.count": reviews.length,
    });
  }
}

module.exports = new ReviewRepository();

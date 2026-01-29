const Property = require("../models/Property");

class PropertyRepository {
  async findAll(filter = {}, sort = {}, pagination = { limit: 10, skip: 0 }) {
    const properties = await Property.find(filter)
      .populate("category", "name slug")
      .populate("owner", "firstName lastName avatar")
      .populate("agent", "user profileImage")
      .sort(sort)
      .limit(pagination.limit)
      .skip(pagination.skip)
      .select("-__v");

    return properties;
  }

  async count(filter = {}) {
    return await Property.countDocuments(filter);
  }

  async findMostPicked(limit = 6) {
    return await Property.find({ isPopular: true })
      .populate("category", "name slug")
      .populate("agent", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findById(id) {
    return await Property.findById(id);
  }

  async findByIdWithDetails(id) {
    return await Property.findById(id)
      .populate("category", "name slug description")
      .populate("owner", "firstName lastName avatar email phone")
      .populate("agent", "user profileImage bio contact")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "firstName lastName avatar",
        },
        match: { status: "published" },
        options: { sort: { publishedAt: -1 }, limit: 10 },
      });
  }

  async create(data) {
    const property = await Property.create(data);
    await property.populate("category", "name slug");
    await property.populate("owner", "firstName lastName avatar");
    return property;
  }

  async update(id, data) {
    return await Property.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name slug")
      .populate("owner", "firstName lastName avatar");
  }

  async delete(id) {
    const property = await Property.findById(id);
    if (property) {
      await property.deleteOne();
    }
    return property;
  }

  async save(property) {
    return await property.save();
  }
}

module.exports = new PropertyRepository();

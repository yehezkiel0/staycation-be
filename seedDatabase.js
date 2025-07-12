const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Property = require("./models/Property");
const Category = require("./models/Category");
const Agent = require("./models/Agent");
const Story = require("./models/Story");
const Review = require("./models/Review");
const Booking = require("./models/Booking");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding...");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Property.deleteMany({});
    await Category.deleteMany({});
    await Agent.deleteMany({});
    await Story.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    console.log("Existing data cleared...");
  } catch (error) {
    console.error("Error clearing data:", error);
  }
};

// Seed Categories
const seedCategories = async () => {
  const categories = [
    {
      name: "Beach House",
      slug: "beach-house",
      description: "Relax by the ocean with stunning beach views",
      icon: "/images/icon_beach.svg",
      color: "#007bff",
      order: 1,
      isActive: true,
      featured: true,
    },
    {
      name: "Mountain Lodge",
      slug: "mountain-lodge",
      description: "Escape to peaceful mountain retreats",
      icon: "/images/icon_mountain.svg",
      color: "#28a745",
      order: 2,
      isActive: true,
      featured: false,
    },
    {
      name: "City Apartment",
      slug: "city-apartment",
      description: "Modern living in the heart of the city",
      icon: "/images/icon_city.svg",
      color: "#dc3545",
      order: 3,
      isActive: true,
      featured: false,
    },
    {
      name: "Villa",
      slug: "villa",
      description: "Luxury villas for exclusive getaways",
      icon: "/images/icon_villa.svg",
      color: "#ffc107",
      order: 4,
      isActive: true,
      featured: true,
    },
    {
      name: "Resort",
      slug: "resort",
      description: "All-inclusive resorts for the ultimate vacation",
      icon: "/images/icon_resort.svg",
      color: "#17a2b8",
      order: 5,
      isActive: true,
      featured: true,
    },
    {
      name: "Farm Stay",
      slug: "farm-stay",
      description: "Experience authentic rural life and farming",
      icon: "/images/icon_farm.svg",
      color: "#6f42c1",
      order: 6,
      isActive: true,
      featured: false,
    },
    {
      name: "Treehouse",
      slug: "treehouse",
      description: "Unique elevated accommodations in nature",
      icon: "/images/icon_tree.svg",
      color: "#20c997",
      order: 7,
      isActive: true,
      featured: false,
    },
    {
      name: "Boat House",
      slug: "boat-house",
      description: "Floating accommodations on rivers and lakes",
      icon: "/images/icon_boat.svg",
      color: "#fd7e14",
      order: 8,
      isActive: true,
      featured: false,
    },
  ];

  try {
    const createdCategories = await Category.insertMany(categories);
    console.log("Categories seeded successfully");
    return createdCategories;
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
};

// Seed Users
const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = [
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@staycation.com",
      password: hashedPassword,
      role: "admin",
      verified: true,
      phone: "+1234567890",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@staycation.com",
      password: hashedPassword,
      role: "agent",
      verified: true,
      phone: "+628123456789",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b0e0?w=150&h=150&fit=crop&crop=face",
    },
    {
      firstName: "Ahmad",
      lastName: "Wirawan",
      email: "ahmad@staycation.com",
      password: hashedPassword,
      role: "agent",
      verified: true,
      phone: "+628123456790",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      firstName: "Maria",
      lastName: "Santosa",
      email: "maria@staycation.com",
      password: hashedPassword,
      role: "agent",
      verified: true,
      phone: "+628123456791",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      firstName: "David",
      lastName: "Prasetyo",
      email: "david@staycation.com",
      password: hashedPassword,
      role: "agent",
      verified: true,
      phone: "+628123456792",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: hashedPassword,
      role: "user",
      verified: true,
      phone: "+1234567891",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      firstName: "Emma",
      lastName: "Watson",
      email: "emma@example.com",
      password: hashedPassword,
      role: "user",
      verified: true,
      phone: "+1234567894",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    },
  ];

  try {
    const createdUsers = await User.insertMany(users);
    console.log("Users seeded successfully");
    return createdUsers;
  } catch (error) {
    console.error("Error seeding users:", error);
  }
};

// Seed Agents
const seedAgents = async (users) => {
  const agents = [
    {
      user: users[1]._id, // Assuming second user is an agent
      agentId: "AGT001",
      bio: "Sarah specializes in luxury beachfront properties across Bali. With over 5 years of experience, she has helped hundreds of guests find their perfect tropical escape.",
      specialties: ["luxury-properties", "beach-properties"],
      languages: [
        { language: "English", level: "native" },
        { language: "Indonesian", level: "fluent" },
        { language: "Mandarin", level: "conversational" },
      ],
      location: {
        city: "Denpasar",
        state: "Bali",
        country: "Indonesia",
        serviceAreas: ["Bali", "Nusa Tenggara"],
      },
      contact: {
        phone: "+628123456789",
        whatsapp: "+628123456789",
        telegram: "@sarah_bali_agent",
        alternateEmail: "sarah.agent@staycation.com",
      },
      experience: {
        yearsInBusiness: 5,
        previousWork: "Previously worked at Bali Tourism Board for 3 years",
        education:
          "Bachelor's Degree in Tourism Management - Udayana University",
        certifications: [
          "Certified Tourism Professional (CTP)",
          "Bali Tourism License - Level A",
          "Hospitality Excellence Certificate",
          "Real Estate Marketing Specialist",
          "First Aid & CPR Certified",
        ],
      },
      statistics: {
        totalBookings: 342,
        totalRevenue: 156780,
        responseTime: {
          average: 2,
          unit: "hours",
        },
        successRate: 96,
      },
      ratings: {
        average: 4.9,
        count: 127,
        breakdown: { 5: 98, 4: 25, 3: 3, 2: 1, 1: 0 },
      },
      verification: {
        isVerified: true,
        documents: [
          {
            type: "identity",
            url: "/documents/sarah_id.pdf",
            status: "approved",
            uploadedAt: new Date("2023-01-10"),
          },
          {
            type: "license",
            url: "/documents/sarah_tourism_license.pdf",
            status: "approved",
            uploadedAt: new Date("2023-01-12"),
          },
          {
            type: "certification",
            url: "/documents/sarah_hospitality_cert.pdf",
            status: "approved",
            uploadedAt: new Date("2023-01-14"),
          },
        ],
        verifiedAt: new Date("2023-01-15"),
      },
      socialMedia: {
        instagram: "@sarah_bali_stays",
        facebook: "Sarah Bali Properties",
        linkedin: "sarah-johnson-tourism",
      },
      status: "active",
      featured: true,
    },
    {
      user: users[2]._id, // Assuming third user is an agent
      agentId: "AGT002",
      bio: "Ahmad is your go-to expert for cultural experiences in Yogyakarta and Central Java. He knows the best traditional accommodations near historical sites.",
      specialties: ["family-accommodations", "eco-friendly", "business-travel"],
      languages: [
        { language: "Indonesian", level: "native" },
        { language: "English", level: "fluent" },
        { language: "Dutch", level: "basic" },
      ],
      location: {
        city: "Yogyakarta",
        state: "DIY Yogyakarta",
        country: "Indonesia",
        serviceAreas: ["Yogyakarta", "Central Java", "Solo"],
      },
      contact: {
        phone: "+628123456790",
        whatsapp: "+628123456790",
        telegram: "@ahmad_jogja_guide",
        alternateEmail: "ahmad.cultural@staycation.com",
      },
      experience: {
        yearsInBusiness: 4,
        previousWork: "Cultural Heritage Guide at Borobudur Temple for 2 years",
        education: "Bachelor's Degree in History - Gadjah Mada University",
        certifications: [
          "Licensed Tour Guide - Yogyakarta",
          "Cultural Heritage Specialist Certificate",
          "Sustainable Tourism Certification",
          "Business Travel Coordinator License",
          "Indonesian Culture Ambassador",
        ],
      },
      statistics: {
        totalBookings: 278,
        totalRevenue: 89450,
        responseTime: {
          average: 1,
          unit: "hours",
        },
        successRate: 94,
      },
      ratings: {
        average: 4.8,
        count: 89,
        breakdown: { 5: 67, 4: 18, 3: 3, 2: 1, 1: 0 },
      },
      verification: {
        isVerified: true,
        documents: [
          {
            type: "identity",
            url: "/documents/ahmad_id.pdf",
            status: "approved",
            uploadedAt: new Date("2023-03-15"),
          },
          {
            type: "license",
            url: "/documents/ahmad_guide_license.pdf",
            status: "approved",
            uploadedAt: new Date("2023-03-18"),
          },
          {
            type: "certification",
            url: "/documents/ahmad_cultural_cert.pdf",
            status: "approved",
            uploadedAt: new Date("2023-03-19"),
          },
        ],
        verifiedAt: new Date("2023-03-20"),
      },
      socialMedia: {
        instagram: "@ahmad_jogja_culture",
        facebook: "Ahmad Yogya Heritage Tours",
        website: "www.jogjaheritage.com",
      },
      status: "active",
      featured: true,
    },
    {
      user: users[3]._id, // Adding third agent
      agentId: "AGT003",
      bio: "Maria is a mountain tourism specialist focusing on adventure travel and eco-friendly accommodations in West Java. She's passionate about sustainable tourism and outdoor activities.",
      specialties: ["mountain-retreats", "eco-friendly", "pet-friendly"],
      languages: [
        { language: "Indonesian", level: "native" },
        { language: "English", level: "fluent" },
        { language: "German", level: "conversational" },
      ],
      location: {
        city: "Bandung",
        state: "West Java",
        country: "Indonesia",
        serviceAreas: ["Bandung", "Bogor", "West Java Highlands"],
      },
      contact: {
        phone: "+628123456791",
        whatsapp: "+628123456791",
        telegram: "@maria_mountain_guide",
        alternateEmail: "maria.mountain@staycation.com",
      },
      experience: {
        yearsInBusiness: 3,
        previousWork:
          "Adventure Tourism Coordinator at Bandung Highland Resort",
        education: "Bachelor's Degree in Environmental Science - ITB",
        certifications: [
          "Mountain Guide Certification - Level II",
          "Eco-Tourism Specialist Certificate",
          "Adventure Travel Trade Association Member",
          "Pet Travel Coordinator License",
          "Wilderness First Aid Certified",
        ],
      },
      statistics: {
        totalBookings: 156,
        totalRevenue: 67890,
        responseTime: {
          average: 3,
          unit: "hours",
        },
        successRate: 92,
      },
      ratings: {
        average: 4.7,
        count: 64,
        breakdown: { 5: 45, 4: 15, 3: 3, 2: 1, 1: 0 },
      },
      verification: {
        isVerified: true,
        documents: [
          {
            type: "identity",
            url: "/documents/maria_id.pdf",
            status: "approved",
            uploadedAt: new Date("2023-06-05"),
          },
          {
            type: "license",
            url: "/documents/maria_mountain_guide.pdf",
            status: "approved",
            uploadedAt: new Date("2023-06-08"),
          },
          {
            type: "certification",
            url: "/documents/maria_environmental_cert.pdf",
            status: "approved",
            uploadedAt: new Date("2023-06-09"),
          },
        ],
        verifiedAt: new Date("2023-06-10"),
      },
      socialMedia: {
        instagram: "@maria_highland_adventures",
        facebook: "Maria Mountain Escapes",
        linkedin: "maria-environmental-tourism",
      },
      status: "active",
      featured: false,
    },
    {
      user: users[4]._id, // Adding fourth agent
      agentId: "AGT004",
      bio: "David specializes in luxury city accommodations and business travel solutions across Jakarta and surrounding areas. He ensures premium service for corporate clients and luxury travelers.",
      specialties: ["luxury-properties", "business-travel", "city-apartments"],
      languages: [
        { language: "Indonesian", level: "native" },
        { language: "English", level: "fluent" },
        { language: "Japanese", level: "conversational" },
        { language: "Korean", level: "basic" },
      ],
      location: {
        city: "Jakarta",
        state: "DKI Jakarta",
        country: "Indonesia",
        serviceAreas: ["Jakarta", "Tangerang", "Bekasi", "Depok"],
      },
      contact: {
        phone: "+628123456792",
        whatsapp: "+628123456792",
        telegram: "@david_jakarta_luxury",
        alternateEmail: "david.luxury@staycation.com",
      },
      experience: {
        yearsInBusiness: 6,
        previousWork: "Senior Concierge at Grand Hyatt Jakarta for 4 years",
        education: "Master's Degree in Hotel Management - Trisakti University",
        certifications: [
          "Luxury Travel Specialist (LTS)",
          "Certified Business Travel Professional",
          "Jakarta Tourism Board License - Premium",
          "Corporate Housing Specialist Certificate",
          "International Concierge Certification",
        ],
      },
      statistics: {
        totalBookings: 423,
        totalRevenue: 245600,
        responseTime: {
          average: 1,
          unit: "hours",
        },
        successRate: 98,
      },
      ratings: {
        average: 4.9,
        count: 156,
        breakdown: { 5: 142, 4: 12, 3: 2, 2: 0, 1: 0 },
      },
      verification: {
        isVerified: true,
        documents: [
          {
            type: "identity",
            url: "/documents/david_id.pdf",
            status: "approved",
            uploadedAt: new Date("2022-11-01"),
          },
          {
            type: "license",
            url: "/documents/david_tourism_premium.pdf",
            status: "approved",
            uploadedAt: new Date("2022-11-03"),
          },
          {
            type: "certification",
            url: "/documents/david_luxury_service.pdf",
            status: "approved",
            uploadedAt: new Date("2022-11-04"),
          },
        ],
        verifiedAt: new Date("2022-11-05"),
      },
      socialMedia: {
        instagram: "@david_jakarta_luxury",
        facebook: "David Jakarta Premium Stays",
        linkedin: "david-jakarta-hospitality",
        website: "www.jakartapremiumstays.com",
      },
      status: "active",
      featured: true,
    },
  ];

  try {
    const createdAgents = await Agent.insertMany(agents);
    console.log("Agents seeded successfully");
    return createdAgents;
  } catch (error) {
    console.error("Error seeding agents:", error);
  }
};

// Seed Properties
const seedProperties = async (categories, agents) => {
  // Check if we have enough data
  if (!categories || categories.length === 0) {
    console.log("No categories found, skipping properties seeding");
    return [];
  }
  if (!agents || agents.length === 0) {
    console.log("No agents found, skipping properties seeding");
    return [];
  }

  // Use first user as owner for now
  const users = await User.find().limit(1);
  if (users.length === 0) {
    console.log("No users found, skipping properties seeding");
    return [];
  }
  const ownerId = users[0]._id;

  const properties = [
    // Beach House Properties
    {
      title: "Tropical Beach Villa Bali",
      slug: "tropical-beach-villa-bali",
      description:
        "Luxurious beachfront villa with stunning ocean views, private pool, and direct beach access. Perfect for a romantic getaway or family vacation.",
      type: "villa",
      owner: ownerId,
      category: categories[0]._id, // Beach House
      agent: agents[0]._id,
      location: {
        address: "Jl. Pantai Seminyak No. 88, Seminyak",
        city: "Denpasar",
        state: "Bali",
        country: "Indonesia",
        coordinates: {
          lat: -8.6905,
          lng: 115.1629,
        },
      },
      price: {
        amount: 120,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        area: {
          size: 150,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "Private Pool", icon: "fas fa-swimming-pool" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Air Conditioning", icon: "fas fa-snowflake" },
        { name: "Beach Access", icon: "fas fa-umbrella-beach" },
        { name: "Kitchen", icon: "fas fa-utensils" },
        { name: "Parking", icon: "fas fa-parking" },
      ],
      imageUrls: [
        { url: "/images/img-featured-1.jpg", isPrimary: true },
        { url: "/images/img-featured-2.jpg", isPrimary: false },
        { url: "/images/img-featured-3.jpg", isPrimary: false },
      ],
      isPopular: true,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.9,
        count: 87,
      },
    },
    {
      title: "Beachside Cottage Lombok",
      slug: "beachside-cottage-lombok",
      description:
        "Cozy cottage steps away from pristine beaches with traditional Indonesian architecture and modern comforts.",
      type: "cottage",
      owner: ownerId,
      category: categories[0]._id, // Beach House
      agent: agents[0]._id,
      location: {
        address: "Pantai Senggigi, Lombok Barat",
        city: "Mataram",
        state: "West Nusa Tenggara",
        country: "Indonesia",
        coordinates: {
          lat: -8.4963,
          lng: 116.0425,
        },
      },
      price: {
        amount: 75,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        area: {
          size: 80,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "Beach Access", icon: "fas fa-umbrella-beach" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Air Conditioning", icon: "fas fa-snowflake" },
        { name: "Terrace", icon: "fas fa-home" },
        { name: "Kitchenette", icon: "fas fa-utensils" },
      ],
      imageUrls: [{ url: "/images/image-mostpicked-1.jpg", isPrimary: true }],
      isPopular: true,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.6,
        count: 42,
      },
    },

    // Mountain Lodge Properties
    {
      title: "Highland Retreat Bandung",
      slug: "highland-retreat-bandung",
      description:
        "Peaceful mountain lodge surrounded by tea plantations and cool mountain air. Perfect for nature lovers and relaxation.",
      type: "lodge",
      owner: ownerId,
      category: categories[1]._id, // Mountain Lodge
      agent: agents[1]._id,
      location: {
        address: "Jl. Raya Lembang KM 15, Lembang",
        city: "Bandung",
        state: "West Java",
        country: "Indonesia",
        coordinates: {
          lat: -6.812,
          lng: 107.6162,
        },
      },
      price: {
        amount: 90,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        area: {
          size: 200,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Mountain View", icon: "fas fa-mountain" },
        { name: "Fireplace", icon: "fas fa-fire" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Hiking Trails", icon: "fas fa-hiking" },
        { name: "Full Kitchen", icon: "fas fa-utensils" },
        { name: "Parking", icon: "fas fa-parking" },
        { name: "Garden", icon: "fas fa-seedling" },
      ],
      imageUrls: [{ url: "/images/image-mostpicked-2.jpg", isPrimary: true }],
      isPopular: true,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.8,
        count: 65,
      },
    },
    {
      title: "Pine Forest Cabin Bogor",
      description:
        "Rustic cabin nestled in pine forest with modern amenities. Ideal for families and groups seeking mountain adventure.",
      type: "cabin",
      owner: ownerId,
      category: categories[1]._id, // Mountain Lodge
      agent: agents[0]._id,
      location: {
        address: "Jl. Raya Puncak KM 87, Puncak",
        city: "Bogor",
        state: "West Java",
        country: "Indonesia",
        coordinates: {
          lat: -6.7008,
          lng: 106.9447,
        },
      },
      price: {
        amount: 65,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        area: {
          size: 120,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Forest View", icon: "fas fa-tree" },
        { name: "BBQ Area", icon: "fas fa-fire" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Heating", icon: "fas fa-thermometer-half" },
        { name: "Kitchen", icon: "fas fa-utensils" },
        { name: "Parking", icon: "fas fa-parking" },
      ],
      imageUrls: [{ url: "/images/image-mostpicked-3.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.4,
        count: 28,
      },
    },

    // City Apartment Properties
    {
      title: "Modern Loft Jakarta",
      slug: "modern-loft-jakarta",
      description:
        "Stylish loft apartment in the heart of Jakarta with city skyline views and premium amenities.",
      type: "apartment",
      owner: ownerId,
      category: categories[2]._id, // City Apartment
      agent: agents[1]._id,
      location: {
        address: "Jl. Sudirman Kav 25, Setiabudi",
        city: "Jakarta",
        state: "DKI Jakarta",
        country: "Indonesia",
        coordinates: {
          lat: -6.2088,
          lng: 106.8456,
        },
      },
      price: {
        amount: 85,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        area: {
          size: 95,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "City View", icon: "fas fa-city" },
        { name: "Gym Access", icon: "fas fa-dumbbell" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Swimming Pool", icon: "fas fa-swimming-pool" },
        { name: "Kitchen", icon: "fas fa-utensils" },
        { name: "Concierge", icon: "fas fa-concierge-bell" },
        { name: "Metro Access", icon: "fas fa-subway" },
      ],
      imageUrls: [{ url: "/images/image-mostpicked-4.jpg", isPrimary: true }],
      isPopular: true,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.7,
        count: 53,
      },
    },
    {
      title: "Executive Suite Surabaya",
      slug: "executive-suite-surabaya",
      description:
        "Luxury apartment suite with business amenities perfect for business travelers and city explorers.",
      type: "suite",
      owner: ownerId,
      category: categories[2]._id, // City Apartment
      agent: agents[0]._id,
      location: {
        address: "Jl. HR Muhammad 1-3, Surabaya Center",
        city: "Surabaya",
        state: "East Java",
        country: "Indonesia",
        coordinates: {
          lat: -7.2575,
          lng: 112.7521,
        },
      },
      price: {
        amount: 110,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        area: {
          size: 75,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "City View", icon: "fas fa-city" },
        { name: "Business Center", icon: "fas fa-briefcase" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Room Service", icon: "fas fa-concierge-bell" },
        { name: "Minibar", icon: "fas fa-wine-bottle" },
        { name: "Valet Parking", icon: "fas fa-parking" },
      ],
      imageUrls: [{ url: "/images/image-mostpicked-5.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.5,
        count: 31,
      },
    },

    // Villa Properties
    {
      title: "Luxury Villa Ubud",
      slug: "luxury-villa-ubud",
      description:
        "Private villa surrounded by rice fields with infinity pool and traditional Balinese architecture.",
      type: "villa",
      owner: ownerId,
      category: categories[3]._id, // Villa
      agent: agents[0]._id,
      location: {
        address: "Jl. Monkey Forest Road, Ubud",
        city: "Gianyar",
        state: "Bali",
        country: "Indonesia",
        coordinates: {
          lat: -8.5069,
          lng: 115.2625,
        },
      },
      price: {
        amount: 200,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 10,
        bedrooms: 5,
        bathrooms: 4,
        area: {
          size: 300,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Infinity Pool", icon: "fas fa-swimming-pool" },
        { name: "Rice Field View", icon: "fas fa-seedling" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Yoga Deck", icon: "fas fa-om" },
        { name: "Full Kitchen", icon: "fas fa-utensils" },
        { name: "Butler Service", icon: "fas fa-concierge-bell" },
        { name: "Spa", icon: "fas fa-spa" },
        { name: "Garden", icon: "fas fa-leaf" },
      ],
      imageUrls: [
        { url: "/images/treasure-1.jpg", isPrimary: true },
        { url: "/images/treasure-2.jpg", isPrimary: false },
      ],
      isPopular: true,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.9,
        count: 125,
      },
    },
    {
      title: "Modern Villa Canggu",
      slug: "modern-villa-canggu",
      description:
        "Contemporary villa with minimalist design, private pool, and easy access to Canggu beaches.",
      type: "villa",
      owner: ownerId,
      category: categories[3]._id, // Villa
      agent: agents[1]._id,
      location: {
        address: "Jl. Pantai Berawa, Canggu",
        city: "Badung",
        state: "Bali",
        country: "Indonesia",
        coordinates: {
          lat: -8.6481,
          lng: 115.1342,
        },
      },
      price: {
        amount: 150,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        area: {
          size: 250,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Private Pool", icon: "fas fa-swimming-pool" },
        { name: "Beach Access", icon: "fas fa-umbrella-beach" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Rooftop Terrace", icon: "fas fa-building" },
        { name: "Full Kitchen", icon: "fas fa-utensils" },
        { name: "Parking", icon: "fas fa-parking" },
        { name: "Garden", icon: "fas fa-seedling" },
      ],
      imageUrls: [
        { url: "/images/treasure-3.jpg", isPrimary: true },
        { url: "/images/treasure-4.jpg", isPrimary: false },
      ],
      isPopular: true,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.6,
        count: 78,
      },
    },

    // Additional Beach Properties
    {
      title: "Ocean View Resort Bintan",
      slug: "ocean-view-resort-bintan",
      description:
        "Stunning oceanfront resort with white sandy beaches and crystal clear waters. Perfect for family holidays.",
      type: "resort",
      owner: ownerId,
      category: categories[0]._id, // Beach House
      agent: agents[1]._id,
      location: {
        address: "Jl. Teluk Dalam, Bintan Resort",
        city: "Bintan",
        state: "Riau Islands",
        country: "Indonesia",
        coordinates: {
          lat: 1.1304,
          lng: 104.453,
        },
      },
      price: {
        amount: 95,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        area: {
          size: 80,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Private Beach", icon: "fas fa-umbrella-beach" },
        { name: "Swimming Pool", icon: "fas fa-swimming-pool" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Spa", icon: "fas fa-spa" },
        { name: "Restaurant", icon: "fas fa-utensils" },
        { name: "Water Sports", icon: "fas fa-swimmer" },
      ],
      imageUrls: [
        { url: "/images/image-category-1.jpg", isPrimary: true },
        { url: "/images/image-category-2.jpg", isPrimary: false },
      ],
      isPopular: true,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.7,
        count: 92,
      },
    },

    // Additional Mountain Properties
    {
      title: "Alpine Cabin Dieng",
      slug: "alpine-cabin-dieng",
      description:
        "Cozy wooden cabin in the highlands with stunning sunrise views and cool mountain air.",
      type: "cabin",
      owner: ownerId,
      category: categories[1]._id, // Mountain Lodge
      agent: agents[0]._id,
      location: {
        address: "Dieng Plateau, Wonosobo",
        city: "Wonosobo",
        state: "Central Java",
        country: "Indonesia",
        coordinates: {
          lat: -7.2068,
          lng: 109.9108,
        },
      },
      price: {
        amount: 45,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        area: {
          size: 100,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Mountain View", icon: "fas fa-mountain" },
        { name: "Fireplace", icon: "fas fa-fire" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Hiking Trails", icon: "fas fa-hiking" },
        { name: "BBQ Area", icon: "fas fa-fire" },
        { name: "Sunrise Deck", icon: "fas fa-sun" },
      ],
      imageUrls: [{ url: "/images/image-category-2.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.3,
        count: 38,
      },
    },

    // Additional City Properties
    {
      title: "Premium Suite Medan",
      slug: "premium-suite-medan",
      description:
        "Luxurious suite in downtown Medan with modern amenities and easy access to business district.",
      type: "suite",
      owner: ownerId,
      category: categories[2]._id, // City Apartment
      agent: agents[1]._id,
      location: {
        address: "Jl. Imam Bonjol, Medan",
        city: "Medan",
        state: "North Sumatra",
        country: "Indonesia",
        coordinates: {
          lat: 3.5952,
          lng: 98.6722,
        },
      },
      price: {
        amount: 70,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 3,
        bedrooms: 1,
        bathrooms: 1,
        area: {
          size: 65,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "City View", icon: "fas fa-city" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Air Conditioning", icon: "fas fa-snowflake" },
        { name: "Gym Access", icon: "fas fa-dumbbell" },
        { name: "Business Center", icon: "fas fa-briefcase" },
        { name: "24h Security", icon: "fas fa-shield-alt" },
      ],
      imageUrls: [{ url: "/images/image-category-3.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.1,
        count: 21,
      },
    },

    // Additional Villa Properties
    {
      title: "Traditional Villa Yogyakarta",
      slug: "traditional-villa-yogyakarta",
      description:
        "Authentic Javanese villa near Borobudur temple with traditional architecture and modern comfort.",
      type: "villa",
      owner: ownerId,
      category: categories[3]._id, // Villa
      agent: agents[0]._id,
      location: {
        address: "Jl. Magelang KM 18, Magelang",
        city: "Magelang",
        state: "Central Java",
        country: "Indonesia",
        coordinates: {
          lat: -7.6053,
          lng: 110.2203,
        },
      },
      price: {
        amount: 125,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        area: {
          size: 200,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Cultural Tours", icon: "fas fa-monument" },
        { name: "Traditional Garden", icon: "fas fa-seedling" },
        { name: "WiFi", icon: "fas fa-wifi" },
        { name: "Temple Views", icon: "fas fa-place-of-worship" },
        { name: "Local Guide", icon: "fas fa-user-tie" },
        { name: "Bicycle Rental", icon: "fas fa-bicycle" },
      ],
      imageUrls: [
        { url: "/images/image-category-4.jpg", isPrimary: true },
        { url: "/images/treasure-1.jpg", isPrimary: false },
      ],
      isPopular: true,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.8,
        count: 156,
      },
    },

    // More Beach Properties
    {
      title: "Surfing Lodge Mentawai",
      slug: "surfing-lodge-mentawai",
      description:
        "Surfer's paradise with direct access to world-class waves and pristine beaches.",
      type: "lodge",
      owner: ownerId,
      category: categories[0]._id, // Beach House
      agent: agents[1]._id,
      location: {
        address: "Mentawai Islands, West Sumatra",
        city: "Mentawai",
        state: "West Sumatra",
        country: "Indonesia",
        coordinates: {
          lat: -1.85,
          lng: 99.15,
        },
      },
      price: {
        amount: 180,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        area: {
          size: 120,

          unit: "sqm",
        },
      },
      amenities: [
        { name: "Surf Guide", icon: "fas fa-water" },
        { name: "Board Rental", icon: "fas fa-swimmer" },
        { name: "Boat Transfer", icon: "fas fa-ship" },
        { name: "Diving Equipment", icon: "fas fa-swimmer" },
        { name: "Fishing Tours", icon: "fas fa-fish" },
        { name: "Beach BBQ", icon: "fas fa-fire" },
      ],
      imageUrls: [{ url: "/images/image-category-5.jpg", isPrimary: true }],
      isPopular: true,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.9,
        count: 73,
      },
    },

    // Mountain Resort
    {
      title: "Highland Resort Toba",
      slug: "highland-resort-toba",
      description:
        "Lakeside resort with breathtaking views of Lake Toba and Batak cultural experiences.",
      type: "resort",
      owner: ownerId,
      category: categories[1]._id, // Mountain Lodge
      agent: agents[0]._id,
      location: {
        address: "Samosir Island, Lake Toba",
        city: "Samosir",
        state: "North Sumatra",
        country: "Indonesia",
        coordinates: {
          lat: 2.6521,
          lng: 98.8576,
        },
      },
      price: {
        amount: 110,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 5,
        bedrooms: 2,
        bathrooms: 2,
        area: {
          size: 90,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "Lake View", icon: "fas fa-water" },
        { name: "Cultural Tours", icon: "fas fa-monument" },
        { name: "Boat Rides", icon: "fas fa-ship" },
        { name: "Traditional Food", icon: "fas fa-utensils" },
        { name: "Hiking Trails", icon: "fas fa-hiking" },
        { name: "Hot Springs", icon: "fas fa-hot-tub" },
      ],
      imageUrls: [{ url: "/images/image-category-6.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.5,
        count: 67,
      },
    },

    // Resort Properties
    {
      title: "Grand Tropical Resort Lombok",
      slug: "grand-tropical-resort-lombok",
      description:
        "Luxury all-inclusive resort with multiple pools, restaurants, and activities for the whole family.",
      type: "resort",
      owner: ownerId,
      category: categories[4]._id, // Resort
      agent: agents[1]._id,
      location: {
        address: "Senggigi Beach, West Lombok",
        city: "Mataram",
        state: "West Nusa Tenggara",
        country: "Indonesia",
      },
      price: {
        amount: 250,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        area: {
          size: 180,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "All Inclusive", icon: "fas fa-utensils" },
        { name: "Multiple Pools", icon: "fas fa-swimming-pool" },
        { name: "Spa & Wellness", icon: "fas fa-spa" },
        { name: "Kids Club", icon: "fas fa-child" },
        { name: "Water Sports", icon: "fas fa-swimmer" },
        { name: "Golf Course", icon: "fas fa-golf-ball" },
      ],
      imageUrls: [{ url: "/images/image-category-7.jpg", isPrimary: true }],
      isPopular: true,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.8,
        count: 156,
      },
    },

    // Farm Stay Property
    {
      title: "Organic Farm Stay Bandung",
      slug: "organic-farm-stay-bandung",
      description:
        "Experience authentic farm life with organic vegetables, farm-to-table meals, and hands-on activities.",
      type: "farmstay",
      owner: ownerId,
      category: categories[5]._id, // Farm Stay
      agent: agents[0]._id,
      location: {
        address: "Lembang, Bandung Barat",
        city: "Bandung",
        state: "West Java",
        country: "Indonesia",
      },
      price: {
        amount: 65,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        area: {
          size: 100,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "Organic Gardens", icon: "fas fa-seedling" },
        { name: "Farm Animals", icon: "fas fa-paw" },
        { name: "Fresh Vegetables", icon: "fas fa-carrot" },
        { name: "Cooking Classes", icon: "fas fa-utensils" },
        { name: "Hiking Trails", icon: "fas fa-hiking" },
        { name: "Mountain Views", icon: "fas fa-mountain" },
      ],
      imageUrls: [{ url: "/images/image-category-8.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.6,
        count: 45,
      },
    },

    // Treehouse Property
    {
      title: "Rainforest Treehouse Kalimantan",
      slug: "rainforest-treehouse-kalimantan",
      description:
        "Unique elevated accommodation in pristine rainforest with wildlife viewing and canopy tours.",
      type: "treehouse",
      owner: ownerId,
      category: categories[6]._id, // Treehouse
      agent: agents[1]._id,
      location: {
        address: "Tanjung Puting National Park",
        city: "Pangkalan Bun",
        state: "Central Kalimantan",
        country: "Indonesia",
      },
      price: {
        amount: 110,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        area: {
          size: 60,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "Rainforest Views", icon: "fas fa-tree" },
        { name: "Wildlife Spotting", icon: "fas fa-binoculars" },
        { name: "Canopy Tours", icon: "fas fa-route" },
        { name: "Nature Guides", icon: "fas fa-user-tie" },
        { name: "Eco Friendly", icon: "fas fa-leaf" },
        { name: "Bird Watching", icon: "fas fa-dove" },
      ],
      imageUrls: [{ url: "/images/image-category-9.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: true,
      status: "active",
      ratings: {
        average: 4.7,
        count: 32,
      },
    },

    // Boat House Property
    {
      title: "Floating Villa Toba Lake",
      slug: "floating-villa-toba-lake",
      description:
        "Unique floating accommodation on Lake Toba with traditional Batak architecture and stunning lake views.",
      type: "boathouse",
      owner: ownerId,
      category: categories[7]._id, // Boat House
      agent: agents[0]._id,
      location: {
        address: "Lake Toba, Samosir Island",
        city: "Samosir",
        state: "North Sumatra",
        country: "Indonesia",
      },
      price: {
        amount: 80,
        currency: "USD",
        unit: "night",
      },
      specifications: {
        maxGuests: 5,
        bedrooms: 2,
        bathrooms: 1,
        area: {
          size: 70,
          unit: "sqm",
        },
      },
      amenities: [
        { name: "Lake Views", icon: "fas fa-water" },
        { name: "Traditional Design", icon: "fas fa-home" },
        { name: "Fishing Equipment", icon: "fas fa-fish" },
        { name: "Boat Access", icon: "fas fa-ship" },
        { name: "Cultural Tours", icon: "fas fa-monument" },
        { name: "Hot Springs", icon: "fas fa-hot-tub" },
      ],
      imageUrls: [{ url: "/images/image-category-10.jpg", isPrimary: true }],
      isPopular: false,
      isFeatured: false,
      status: "active",
      ratings: {
        average: 4.4,
        count: 28,
      },
    },

    // Properties for Agent 3 (Mountain/Eco-Tourism Specialist)
    {
      title: "Eco Mountain Lodge Bandung",
      slug: "eco-mountain-lodge-bandung",
      description:
        "Sustainable mountain lodge with breathtaking views of West Java highlands. Perfect for eco-conscious travelers seeking tranquility.",
      type: "lodge",
      owner: ownerId,
      category: categories[2]._id, // Mountain Retreat
      agent: agents[2]._id, // Agent 3
      price: {
        amount: 350000,
        currency: "IDR",
        per: "night",
      },
      location: {
        address: "Jl. Raya Ciwidey No. 45, Ciwidey",
        city: "Bandung",
        state: "West Java",
        country: "Indonesia",
        zipCode: "40973",
        coordinates: {
          latitude: -7.1574,
          longitude: 107.4262,
        },
      },
      images: [
        {
          url: "/images/image-category-7.jpg",
          caption: "Mountain Lodge Exterior",
          isMain: true,
        },
        {
          url: "/images/image-category-8.jpg",
          caption: "Cozy Living Area",
          isMain: false,
        },
      ],
      specifications: {
        bedrooms: 3,
        bathrooms: 2,
        livingRooms: 1,
        kitchens: 1,
        maxGuests: 6,
        area: {
          size: 150,
          unit: "sqm",
        },
      },
      amenities: [
        {
          name: "Mountain View",
          category: "outdoor",
          icon: "fas fa-mountain",
        },
        {
          name: "Fireplace",
          category: "basic",
          icon: "fas fa-fire",
        },
        {
          name: "Hiking Trails",
          category: "outdoor",
          icon: "fas fa-hiking",
        },
      ],
      houseRules: {
        checkIn: "15:00",
        checkOut: "11:00",
        smokingAllowed: false,
        petsAllowed: true,
        partiesAllowed: false,
        quietHours: {
          start: "22:00",
          end: "07:00",
        },
      },
      availability: {
        minimumStay: 2,
        maximumStay: 14,
        advanceNotice: 1,
        preparationTime: 1,
        calendar: [],
      },
      status: "active",
      featured: true,
      instantBook: false,
      ratings: {
        average: 4.7,
        count: 23,
      },
    },
    {
      title: "Highland Tea Plantation Villa",
      slug: "highland-tea-plantation-villa",
      description:
        "Charming villa surrounded by tea plantations with cool mountain air and stunning sunrise views.",
      type: "villa",
      owner: ownerId,
      category: categories[2]._id, // Mountain Retreat
      agent: agents[2]._id, // Agent 3
      price: {
        amount: 450000,
        currency: "IDR",
        per: "night",
      },
      location: {
        address: "Jl. Perkebunan Teh No. 12, Lembang",
        city: "Bandung",
        state: "West Java",
        country: "Indonesia",
        zipCode: "40391",
        coordinates: {
          latitude: -6.8103,
          longitude: 107.6172,
        },
      },
      images: [
        {
          url: "/images/image-category-9.jpg",
          caption: "Tea Plantation View",
          isMain: true,
        },
        {
          url: "/images/image-category-10.jpg",
          caption: "Villa Interior",
          isMain: false,
        },
      ],
      specifications: {
        bedrooms: 4,
        bathrooms: 3,
        livingRooms: 1,
        kitchens: 1,
        maxGuests: 8,
        area: {
          size: 200,
          unit: "sqm",
        },
      },
      amenities: [
        {
          name: "Mountain View",
          category: "outdoor",
          icon: "fas fa-mountain",
        },
        {
          name: "Tea Tasting",
          category: "entertainment",
          icon: "fas fa-leaf",
        },
        {
          name: "Nature Walks",
          category: "outdoor",
          icon: "fas fa-walking",
        },
      ],
      houseRules: {
        checkIn: "14:00",
        checkOut: "12:00",
        smokingAllowed: false,
        petsAllowed: true,
        partiesAllowed: false,
        quietHours: {
          start: "22:00",
          end: "06:00",
        },
      },
      availability: {
        minimumStay: 2,
        maximumStay: 10,
        advanceNotice: 2,
        preparationTime: 1,
        calendar: [],
      },
      status: "active",
      featured: false,
      instantBook: true,
      ratings: {
        average: 4.6,
        count: 18,
      },
    },

    // Properties for Agent 4 (Luxury Business Travel Specialist)
    {
      title: "Executive Business Suite Jakarta",
      slug: "executive-business-suite-jakarta",
      description:
        "Luxury business suite in the heart of Jakarta's business district with full office amenities and city views.",
      type: "suite",
      owner: ownerId,
      category: categories[3]._id, // City Apartment
      agent: agents[3]._id, // Agent 4
      price: {
        amount: 800000,
        currency: "IDR",
        per: "night",
      },
      location: {
        address: "Jl. Sudirman No. 88, Senayan",
        city: "Jakarta",
        state: "DKI Jakarta",
        country: "Indonesia",
        zipCode: "12190",
        coordinates: {
          latitude: -6.2297,
          longitude: 106.8261,
        },
      },
      images: [
        {
          url: "/images/image-category-11.jpg",
          caption: "Executive Suite",
          isMain: true,
        },
        {
          url: "/images/image-category-12.jpg",
          caption: "Business Center",
          isMain: false,
        },
      ],
      specifications: {
        bedrooms: 1,
        bathrooms: 1,
        livingRooms: 1,
        kitchens: 1,
        maxGuests: 2,
        area: {
          size: 80,
          unit: "sqm",
        },
      },
      amenities: [
        {
          name: "City View",
          category: "outdoor",
          icon: "fas fa-city",
        },
        {
          name: "Business Center",
          category: "basic",
          icon: "fas fa-briefcase",
        },
        {
          name: "Meeting Room",
          category: "basic",
          icon: "fas fa-users",
        },
      ],
      houseRules: {
        checkIn: "15:00",
        checkOut: "12:00",
        smokingAllowed: false,
        petsAllowed: false,
        partiesAllowed: false,
        quietHours: {
          start: "23:00",
          end: "06:00",
        },
      },
      availability: {
        minimumStay: 1,
        maximumStay: 30,
        advanceNotice: 0,
        preparationTime: 0,
        calendar: [],
      },
      status: "active",
      featured: true,
      instantBook: true,
      ratings: {
        average: 4.9,
        count: 45,
      },
    },
    {
      title: "Luxury Corporate Apartment",
      slug: "luxury-corporate-apartment",
      description:
        "High-end corporate apartment with premium amenities for business executives and luxury travelers.",
      type: "apartment",
      owner: ownerId,
      category: categories[3]._id, // City Apartment
      agent: agents[3]._id, // Agent 4
      price: {
        amount: 1200000,
        currency: "IDR",
        per: "night",
      },
      location: {
        address: "Jl. Kuningan No. 45, Kuningan",
        city: "Jakarta",
        state: "DKI Jakarta",
        country: "Indonesia",
        zipCode: "12950",
        coordinates: {
          latitude: -6.2368,
          longitude: 106.8318,
        },
      },
      images: [
        {
          url: "/images/image-category-1.jpg",
          caption: "Luxury Living Room",
          isMain: true,
        },
        {
          url: "/images/image-category-2.jpg",
          caption: "Master Bedroom",
          isMain: false,
        },
      ],
      specifications: {
        bedrooms: 2,
        bathrooms: 2,
        livingRooms: 1,
        kitchens: 1,
        maxGuests: 4,
        area: {
          size: 120,
          unit: "sqm",
        },
      },
      amenities: [
        {
          name: "City View",
          category: "outdoor",
          icon: "fas fa-city",
        },
        {
          name: "Gym Access",
          category: "entertainment",
          icon: "fas fa-dumbbell",
        },
        {
          name: "Swimming Pool",
          category: "outdoor",
          icon: "fas fa-swimming-pool",
        },
      ],
      houseRules: {
        checkIn: "15:00",
        checkOut: "12:00",
        smokingAllowed: false,
        petsAllowed: false,
        partiesAllowed: false,
        quietHours: {
          start: "23:00",
          end: "06:00",
        },
      },
      availability: {
        minimumStay: 3,
        maximumStay: 60,
        advanceNotice: 1,
        preparationTime: 1,
        calendar: [],
      },
      status: "active",
      featured: true,
      instantBook: false,
      ratings: {
        average: 4.8,
        count: 32,
      },
    },
  ];

  try {
    const createdProperties = await Property.insertMany(properties);
    console.log(
      `Properties seeded successfully: ${createdProperties.length} properties`
    );

    // Update agents with their properties
    const agentPropertyMap = {};

    // Group properties by agent
    createdProperties.forEach((property) => {
      const agentId = property.agent.toString();
      if (!agentPropertyMap[agentId]) {
        agentPropertyMap[agentId] = [];
      }
      agentPropertyMap[agentId].push(property._id);
    });

    // Update each agent with their properties
    for (const [agentId, propertyIds] of Object.entries(agentPropertyMap)) {
      await Agent.findByIdAndUpdate(
        agentId,
        { $set: { properties: propertyIds } },
        { new: true }
      );
    }

    console.log(`Agent properties updated successfully`);
    return createdProperties;
  } catch (error) {
    console.error("Error seeding properties:", error);
  }
};

// Seed Stories
const seedStories = async (users) => {
  const stories = [
    {
      title: "A Perfect Weekend Getaway in Bali",
      slug: "perfect-weekend-getaway-bali",
      excerpt:
        "Discover how Sarah and John spent their romantic weekend in a beautiful beachfront villa in Bali.",
      content:
        "Our weekend in Bali was absolutely magical. From the moment we arrived at the beachfront villa, we knew this would be a trip to remember. The villa was perfectly positioned with stunning ocean views, and the sound of waves was our constant companion. The private pool overlooked the beach, and we spent hours just floating and watching the sunset paint the sky in brilliant colors. The villa staff was incredibly attentive, ensuring every detail was perfect for our romantic escape. We enjoyed candlelit dinners on the terrace, couples massage in the villa's spa room, and long walks on the pristine beach. This getaway strengthened our bond and created memories we'll treasure forever.",
      author: {
        user: users[1]._id, // Sarah Johnson
        name: "Sarah Johnson",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b0e0?w=150&h=150&fit=crop&crop=face",
      },
      featuredImage: {
        url: "/images/img-featured-1.jpg",
        alt: "Beachfront villa in Bali",
        caption: "Stunning beachfront villa with ocean views",
      },
      category: "Romance",
      tags: ["Bali", "Romance", "Beach", "Villa", "Couple"],
      location: {
        city: "Denpasar",
        state: "Bali",
        country: "Indonesia",
      },
      readTime: 5,
      engagement: {
        views: 245,
        likes: {
          count: 18,
          users: [users[2]._id, users[3]._id],
        },
      },
      status: "published",
      featured: true,
      featuredOrder: 1,
    },
    {
      title: "Family Adventure in Yogyakarta",
      slug: "family-adventure-yogyakarta",
      excerpt:
        "Follow the Anderson family as they explore the cultural heart of Java in their comfortable city apartment.",
      content:
        "Yogyakarta has always been on our family bucket list, and this trip exceeded all our expectations. Staying in the heart of the city gave us easy access to all the cultural sites including Borobudur, Prambanan, and the Sultan's Palace. Our spacious apartment was perfect for our family of four, with separate bedrooms for the kids and a full kitchen where we could prepare local ingredients we bought from Malioboro Street. The kids loved learning about Javanese culture through batik making classes and traditional puppet shows. We also took day trips to the surrounding temples and enjoyed the famous gudeg cuisine. The apartment's central location made it easy to explore on foot, and the friendly local neighbors gave us great recommendations for hidden gems that tourists usually miss.",
      author: {
        user: users[2]._id, // Mike Anderson
        name: "Mike Anderson",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      featuredImage: {
        url: "/images/img-featured-2.jpg",
        alt: "Family exploring Yogyakarta",
        caption: "Cultural exploration in the heart of Java",
      },
      category: "Family",
      tags: ["Yogyakarta", "Family", "Culture", "Apartment", "Temple"],
      location: {
        city: "Yogyakarta",
        state: "DIY Yogyakarta",
        country: "Indonesia",
      },
      readTime: 7,
      engagement: {
        views: 189,
        likes: {
          count: 15,
          users: [users[1]._id, users[4]._id],
        },
      },
      status: "published",
      featured: false,
    },
    {
      title: "Solo Traveler's Guide to Jakarta",
      slug: "solo-traveler-guide-jakarta",
      excerpt:
        "Tips and experiences from Maria's solo adventure staying in modern Jakarta apartments.",
      content:
        "As a solo female traveler, Jakarta initially seemed daunting, but it turned out to be one of my most rewarding travel experiences. The modern apartment I stayed in provided the perfect base for exploring the city safely and comfortably. Located in the business district, it was well-connected to public transportation and had 24-hour security. I spent my days exploring the vibrant neighborhoods, from the historic Kota Tua to the trendy Kemang area. The city's diverse culinary scene was a highlight - from street food tours in Chinatown to fine dining in upscale malls. I also discovered Jakarta's growing arts scene, visiting galleries and attending cultural events. The apartment's fast wifi allowed me to work remotely while traveling, making it perfect for digital nomads. Jakarta surprised me with its warmth and energy, and I left with a deep appreciation for Indonesian urban culture.",
      author: {
        user: users[4]._id, // Emma Watson
        name: "Emma Watson",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      },
      featuredImage: {
        url: "/images/img-featured-3.jpg",
        alt: "Solo traveler in Jakarta",
        caption: "Exploring Jakarta's urban landscape",
      },
      category: "Solo",
      tags: ["Jakarta", "Solo Travel", "Urban", "Apartment", "Culture"],
      location: {
        city: "Jakarta",
        state: "DKI Jakarta",
        country: "Indonesia",
      },
      readTime: 6,
      engagement: {
        views: 167,
        likes: {
          count: 12,
          users: [users[1]._id],
        },
      },
      status: "published",
      featured: true,
      featuredOrder: 2,
    },
  ];

  try {
    const createdStories = await Story.insertMany(stories);
    console.log("Stories seeded successfully");
    return createdStories;
  } catch (error) {
    console.error("Error seeding stories:", error);
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearData();

    const categories = await seedCategories();
    const users = await seedUsers();
    const agents = await seedAgents(users);
    const properties = await seedProperties(categories, agents);
    const stories = await seedStories(users);

    console.log("Database seeded successfully!");
    console.log("Sample admin credentials:");
    console.log("Email: admin@staycation.com");
    console.log("Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  require("dotenv").config();
  seedDatabase();
}

module.exports = { seedDatabase };

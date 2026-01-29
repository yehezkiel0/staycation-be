const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Property = require("./models/Property");
const Category = require("./models/Category");
const Agent = require("./models/Agent");
const Booking = require("./models/Booking");
require("dotenv").config();

// Connect to Database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/staycation");
    console.log("MongoDB connected for seeding...");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Helper: Get random integer
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Get random item from array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Main Seed Function
const seedDatabase = async () => {
  await connectDB();

  try {
    // 1. Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      Category.deleteMany({}),
      Agent.deleteMany({}),
      Booking.deleteMany({}),
    ]);

    // 2. Create Users (1 Admin, 5 Agents, 10 Regular Users)
    console.log("Creating users...");
    const password = "password123";
    
    // Admin
    const adminUser = await User.create({
      firstName: "Admin", lastName: "User", email: process.env.ADMIN_EMAIL || "admin@staycation.com",
      password: process.env.ADMIN_PASSWORD || password, role: "admin", verified: true, phone: "+6281234567890",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36"
    });

    // Agents (Users)
    const agentUsers = [];
    for (let i = 1; i <= 5; i++) {
      agentUsers.push(await User.create({
        firstName: `Agent${i}`, lastName: "Doe", email: `agent${i}@staycation.com`,
        password: password, role: "agent", verified: true, phone: `+628123456789${i}`,
        avatar: `https://i.pravatar.cc/150?u=agent${i}`
      }));
    }

    // Regular Users
    const regularUsers = [];
    for (let i = 1; i <= 20; i++) {
      regularUsers.push(await User.create({
        firstName: `User${i}`, lastName: "Test", email: `user${i}@example.com`,
        password: password, role: "user", verified: true, phone: `+6281299999${i}`,
        avatar: `https://i.pravatar.cc/150?u=user${i}`
      }));
    }

    // 3. Create Categories
    console.log("Creating categories...");
    const categoryData = [
      { name: "Beach House", slug: "beach-house" },
      { name: "Mountain Lodge", slug: "mountain-lodge" },
      { name: "City Apartment", slug: "city-apartment" },
      { name: "Villa", slug: "villa" },
      { name: "Resort", slug: "resort" }
    ];
    const categories = await Category.insertMany(categoryData);

    // 4. Create proper Agents (linked to User)
    console.log("Creating agent profiles...");
    const agents = [];
    for (let i = 0; i < agentUsers.length; i++) {
        agents.push(await Agent.create({
            user: agentUsers[i]._id,
            agentId: `AGT00${i+1}`,
            bio: "Experienced agent.",
            location: { city: "Jakarta", state: "DKI Jakarta", country: "Indonesia" },
            contact: { phone: `08123456789${i}` },
            statistics: { totalBookings: 0 }
        }));
    }

    // 5. Create 100 Properties (Dummy Data)
    console.log("Generating 100 properties...");
    const properties = [];
    const cities = ["Bali", "Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Lombok"];
    const propertyTypes = ["villa", "apartment", "house", "hotel"];

    for (let i = 0; i < 100; i++) {
      const selectedCity = getRandomItem(cities);
      const priceAmount = getRandomInt(500000, 5000000);
      const title = `Luxury Stay ${i + 1} in ${selectedCity}`;
      const slug = title.toLowerCase().replace(/ /g, '-') + `-${Date.now()}-${i}`;
      
      properties.push({
        title: title,
        slug: slug,
        description: `Experience the best stay at property ${i + 1}.`,
        price: {
            amount: priceAmount,
            currency: "IDR",
            per: "night"
        },
        location: {
            address: `Jl. Raya No. ${i}`,
            city: selectedCity,
            state: "Indonesia",
            country: "Indonesia"
        },
        category: getRandomItem(categories)._id,
        agent: getRandomItem(agents)._id,
        owner: adminUser._id, // Owner required
        images: [
            { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945", isMain: true },
            { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd" }
        ],
        type: getRandomItem(propertyTypes),
        specifications: {
            bedrooms: getRandomInt(1, 5),
            bathrooms: getRandomInt(1, 3),
            maxGuests: getRandomInt(2, 10),
            area: { size: getRandomInt(30, 200), unit: "sqm" }
        },
        amenities: [
            { name: "WiFi", icon: "wifi", category: "basic" },
            { name: "AC", icon: "ac_unit", category: "basic" },
            { name: "Pool", icon: "pool", category: "outdoor" }
        ],
        isFeatured: Math.random() < 0.2, // 20% chance
        isPopular: Math.random() < 0.2, // 20% chance
        status: "active"
      });
    }
    const createdProperties = await Property.insertMany(properties);

    // 6. Create 1000 Bookings (Dummy Data for Speed Test)
    console.log("Generating 1000 bookings...");
    const bookings = [];
    // status enums: "pending", "confirmed", "checked_in", "checked_out", "cancelled", "completed"
    const statusOptions = ["confirmed", "pending", "completed", "cancelled", "checked_in"];

    for (let i = 0; i < 1000; i++) {
        const prop = getRandomItem(createdProperties);
        const nights = getRandomInt(1, 7);
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + getRandomInt(-30, 30));
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + nights);
        
        const totalPrice = prop.price.amount * nights;
        const adults = getRandomInt(1, 4);
        const children = getRandomInt(0, 2);

        bookings.push({
            bookingId: `BK${Date.now()}${i}`,
            user: getRandomItem(regularUsers)._id,
            property: prop._id,
            checkIn: checkIn,
            checkOut: checkOut,
            guests: {
                adults: adults,
                children: children,
                infants: 0
            },
            totalGuests: adults + children,
            nights: nights,
            pricing: {
                basePrice: prop.price.amount,
                totalPrice: totalPrice
            },
            status: getRandomItem(statusOptions),
            guestDetails: {
                firstName: "Guest",
                lastName: "User",
                email: "guest@example.com",
                phone: "08123456789"
            },
            payment: {
                method: "bank_transfer",
                status: "paid"
            }
        });
    }
    
    // Insert in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < bookings.length; i += chunkSize) {
        const chunk = bookings.slice(i, i + chunkSize);
        await Booking.insertMany(chunk);
        console.log(`Inserted bookings ${i} to ${i + chunk.length}`);
    }

    console.log("Seeding Complete!");
    console.log(`- ${categories.length} Categories`);
    console.log(`- ${regularUsers.length + agentUsers.length + 1} Users`);
    console.log(`- ${createdProperties.length} Properties`);
    console.log(`- ${bookings.length} Bookings`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    const fs = require('fs');
    fs.writeFileSync('seed_errors.json', JSON.stringify(error, null, 2));
    if (error.errors) {
        fs.writeFileSync('seed_validation_errors.json', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
};

seedDatabase();

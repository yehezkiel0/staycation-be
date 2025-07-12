const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

const app = express();

// Test the basic server setup
describe("Staycation Backend", () => {
  beforeAll(async () => {
    // Connect to test database
    const url =
      process.env.MONGODB_TEST_URI ||
      "mongodb://localhost:27017/staycation_test";
    await mongoose.connect(url);
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.close();
  });

  describe("API Health Check", () => {
    test("GET /api/health should return 200", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
    });
  });

  describe("Authentication", () => {
    test("POST /api/auth/register should create new user", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", "test@example.com");
    });

    test("POST /api/auth/login should authenticate user", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });
  });

  describe("Properties", () => {
    test("GET /api/properties should return properties list", async () => {
      const response = await request(app).get("/api/properties");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("properties");
      expect(Array.isArray(response.body.properties)).toBe(true);
    });
  });

  describe("Categories", () => {
    test("GET /api/categories should return categories list", async () => {
      const response = await request(app).get("/api/categories");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("categories");
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });

  describe("Stories", () => {
    test("GET /api/stories should return stories list", async () => {
      const response = await request(app).get("/api/stories");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("stories");
      expect(Array.isArray(response.body.stories)).toBe(true);
    });

    test("GET /api/stories/featured should return featured stories", async () => {
      const response = await request(app).get("/api/stories/featured");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Agents", () => {
    test("GET /api/agents should return agents list", async () => {
      const response = await request(app).get("/api/agents");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("agents");
      expect(Array.isArray(response.body.agents)).toBe(true);
    });
  });
});

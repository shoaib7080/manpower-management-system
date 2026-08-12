// Run this file once if no Admin is setup
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ROLE_LEVELS } from "../config/constants.js";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = "admin@ogasco.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await User.create({
      name: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      level: ROLE_LEVELS.ADMIN, // Level 1
    });

    console.log("✅ Initial Level 1 Admin account seeded successfully!");
    console.log("Email: admin@ogasco.com");
    console.log("Password: admin123");
    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();

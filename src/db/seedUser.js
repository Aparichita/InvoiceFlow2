// src/db/seedUser.js  (optional; run once during dev)
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./index.js";
import { User } from "../models/user.model.js";

const seed = async () => {
  try {
    await connectDB();

    const email = process.env.SEED_USER_EMAIL || "vendor@example.com";
    const username = process.env.SEED_USER_USERNAME || "vendor1";
    const password = process.env.SEED_USER_PASSWORD || "Password123";

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        username,
        password,
        isEmailVerified: true,
      });
      console.log("Seeded user:", email, "password:", password);
    } else {
      console.log("User already exists:", email);
    }
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seed();

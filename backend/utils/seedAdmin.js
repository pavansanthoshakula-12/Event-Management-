// One-time script that creates the FIRST admin account.
// Usage:  npm run seed:admin
// Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env. There is NO public endpoint for this.
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Please set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.");
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}). Nothing was changed.`);
  } else {
    await User.create({ name: ADMIN_NAME || "System Admin", email, password: ADMIN_PASSWORD, role: "admin" });
    console.log(`Admin account created for ${email}. You can now log in.`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});

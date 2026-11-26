import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../utils/constants.js";

// Students must provide these fields; admins do not.
function isStudent() {
  return this.role === ROLES.STUDENT;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot be longer than 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned by queries unless explicitly requested
    },
    role: {
      type: String,
      enum: { values: Object.values(ROLES), message: "Invalid role" },
      default: ROLES.STUDENT,
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [30, "Roll number is too long"],
      required: [isStudent, "Roll number is required"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [80, "Department name is too long"],
      required: [isStudent, "Department is required"],
    },
    yearOfStudy: {
      type: Number,
      min: [1, "Year of study must be between 1 and 6"],
      max: [6, "Year of study must be between 1 and 6"],
      required: [isStudent, "Year of study is required"],
    },
  },
  { timestamps: true }
);

// Unique roll number, but only for documents that actually have one (admins have none).
userSchema.index(
  { rollNumber: 1 },
  { unique: true, partialFilterExpression: { rollNumber: { $type: "string" } } }
);

// Hash the password whenever it is new or changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Never leak the password hash in JSON responses.
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);

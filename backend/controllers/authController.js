import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const sendAuthResponse = (res, status, user, message) =>
  res.status(status).json({
    success: true,
    message,
    data: { token: generateToken(user._id), user },
  });

// POST /api/auth/register  (public) - always creates a STUDENT. Role is never read from the body.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber, department, yearOfStudy } = req.body;

  if (await User.findOne({ email })) {
    throw new AppError("An account with this email already exists", 409);
  }
  if (await User.findOne({ rollNumber: rollNumber.toUpperCase() })) {
    throw new AppError("An account with this roll number already exists", 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    rollNumber,
    department,
    yearOfStudy,
    role: "student",
  });

  sendAuthResponse(res, 201, user, "Registration successful");
});

// POST /api/auth/login  (public) - for both admin and students
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  // Same message for "no such user" and "wrong password" so attackers learn nothing.
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  sendAuthResponse(res, 200, user, "Login successful");
});

// GET /api/auth/me  (logged in)
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

// PUT /api/auth/me  (logged in) - update own name / department / year. Email, role, roll number cannot change here.
export const updateMe = asyncHandler(async (req, res) => {
  const { name, department, yearOfStudy } = req.body;
  if (name !== undefined) req.user.name = name;
  if (req.user.role === "student") {
    if (department !== undefined) req.user.department = department;
    if (yearOfStudy !== undefined) req.user.yearOfStudy = yearOfStudy;
  }
  await req.user.save();
  res.status(200).json({ success: true, message: "Profile updated", data: req.user });
});

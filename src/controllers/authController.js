import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @route   POST /api/auth/register
// @desc    Register a new user and return a JWT
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const userExists = await User.findOne({ email: email.toLowerCase().trim() });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // Password hashing happens automatically via the pre('save') hook
  // defined on the User model.
  const user = await User.create({ name: name.trim(), email, password });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    },
  });
});

// @route   POST /api/auth/login
// @desc    Authenticate a user and return a JWT
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Fix #7 — normalize email before querying so 'Jane@Example.COM'
  // matches the stored 'jane@example.com' (Mongoose lowercases on save
  // but not on queries).
  // .select('+password') overrides the schema's select:false so we can
  // compare the submitted password against the stored hash.
  const user = await User
    .findOne({ email: email.toLowerCase().trim() })
    .select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    },
  });
});

// @route   GET /api/auth/me
// @desc    Get the currently authenticated user's profile
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

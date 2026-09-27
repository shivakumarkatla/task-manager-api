import crypto from 'crypto';

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

  const normalizedEmail = email.toLowerCase().trim();

  const userExists = await User.findOne({
    email: normalizedEmail,
  });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

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

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select('+password');

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

// @route   POST /api/auth/forgot-password
// @desc    Generate a password reset token
// @access  Public

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide your email address');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  /*
   * We intentionally return the same message whether or not
   * the email exists. This prevents revealing which email
   * addresses have accounts.
   */

  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        'If an account exists with this email, a password reset link has been generated.',
    });
  }

  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing it in MongoDB
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires after 15 minutes
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  /*
   * Generate the reset URL using the deployed frontend URL
   * stored in the FRONTEND_URL environment variable.
   *
   * Example:
   * https://task-manager-frontend-rouge-omega.vercel.app/reset-password/<token>
   */

  const frontendUrl = process.env.FRONTEND_URL;

  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  res.status(200).json({
    success: true,
    message:
      'If an account exists with this email, a password reset link has been generated.',
    resetUrl,
  });
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password using a valid reset token
// @access  Public

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    res.status(400);
    throw new Error('Password reset token is required');
  }

  if (!password) {
    res.status(400);
    throw new Error('Please provide a new password');
  }

  if (password.trim().length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Hash the token received from the URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find a user with a matching, non-expired token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  }).select('+password +resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  // Set the new password
  user.password = password;

  // Invalidate the reset token
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message:
      'Password reset successful. You can now log in with your new password.',
  });
});
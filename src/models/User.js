import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // Fix #4 — reject whitespace-only passwords that would pass minlength.
      validate: {
        validator: (v) => v && v.trim().length >= 6,
        message: 'Password must not be blank or whitespace only',
      },
      // select: false means the password hash is excluded from all query
      // results by default, so we never accidentally leak it in responses.
      select: false,
    },
  },
  { timestamps: true }
);

// Before saving a user, hash the password if it was set or changed.
// Fix #3 — wrapped in try/catch so bcrypt errors are passed to Mongoose's
// error chain rather than becoming unhandled promise rejections.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare a plain-text password (from a login request)
// against the hashed password stored in the database.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

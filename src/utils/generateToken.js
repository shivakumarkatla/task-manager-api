import jwt from 'jsonwebtoken';

// Signs a JWT containing the user's ID. This token is sent back to the
// client on register/login, and must be included as
// "Authorization: Bearer <token>" on protected requests afterward.
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export default generateToken;

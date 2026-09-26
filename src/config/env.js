import dotenv from 'dotenv';

// This module must be the very first import in server.js.
// In ES Modules, all imports are hoisted and evaluated before any
// code runs — so calling dotenv.config() inside server.js after
// import statements is too late. By placing it here and importing
// this file first, we guarantee process.env is populated before
// any other module (db.js, generateToken.js, etc.) reads from it.
dotenv.config();


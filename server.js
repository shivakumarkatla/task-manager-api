// IMPORTANT: env.js must be the first import.
// ES Modules hoist all imports before executing any code, so dotenv.config()
// must live inside its own module imported before everything else — otherwise
// process.env values would be undefined when db.js and other modules load.
import './src/config/env.js';

import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Fix #2 — added .catch() so an unexpected connectDB rejection doesn't
// silently disappear as an unhandled promise rejection.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });

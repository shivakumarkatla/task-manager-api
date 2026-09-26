import mongoose from 'mongoose';

// Connects to MongoDB using the URI from environment variables.
// If the connection fails, we exit the process because the API
// cannot function without a database.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

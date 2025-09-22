// server/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // keep common options for compatibility; harmless if ignored in newer mongoose
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Atlas connected");
    console.log(`MongoDB host: ${conn.connection.host}`);
    console.log(`📦 Using database: ${conn.connection.name}`);
  } catch (err) {
    console.error("Mongo connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;

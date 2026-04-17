import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from '../utils/seed.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cashflow_erp');
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Seed initial data if needed
    await seedDatabase();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from 'mongoose';
import { UserModel } from './models/Users.js';
import { BranchModel } from './models/Branch.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

export const seedDatabase = async () => {
  let isStandalone = false;
  try {
    if (mongoose.connection.readyState === 0) {
      isStandalone = true;
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cashflow_db');
      console.log('✅ Connected to MongoDB for seeding');
    }

    let mainBranch = await BranchModel.findOne({});
    if (!mainBranch) {
      console.log('Seeding initial branch...');
      mainBranch = await BranchModel.create({
        name: 'Main Branch',
        location: 'Mumbai'
      });
    }

    console.log('Checking standard users...');

    // 1. Original Admin (from previous versions)
    const originalAdmin = await UserModel.findOne({ email: 'admin@cashflow.in' });
    if (!originalAdmin) {
      const adminHash = await bcrypt.hash('admin123', 12);
      await UserModel.create({
        name: 'Super Admin', email: 'admin@cashflow.in', phone: '9876543210', role: 'admin',
        username: 'admin', password_hash: adminHash, status: 'active'
      });
      console.log('Created legacy admin: admin@cashflow.in');
    }

    // 2. NEW Admin User requested
    const newAdmin = await UserModel.findOne({ email: 'master@cashflow.in' });
    if (!newAdmin) {
      const newAdminHash = await bcrypt.hash('MasterAdmin@123', 12);
      await UserModel.create({
        name: 'Master Admin', email: 'master@cashflow.in', phone: '9999999999', role: 'admin',
        username: 'master_admin', password_hash: newAdminHash, status: 'active'
      });
      console.log('Created NEW admin: master@cashflow.in');
    }

    // 3. NEW Branch User requested
    if (mainBranch) {
      const newBranch = await UserModel.findOne({ email: 'frontdesk@cashflow.in' });
      if (!newBranch) {
        const newBranchHash = await bcrypt.hash('FrontDesk@123', 12);
        await UserModel.create({
          name: 'Front Desk Branch', email: 'frontdesk@cashflow.in', phone: '8888888888', role: 'branch',
          branch_id: mainBranch._id.toString(), username: 'front_desk', password_hash: newBranchHash, status: 'active'
        });
        console.log('Created NEW branch user: frontdesk@cashflow.in');
      }
    }

    console.log('🎉 Database seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (isStandalone && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    }
  }
};

// Auto-execute if run directly via "node seed.js"
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

import mongoose from 'mongoose';
import { UserModel } from '../models/Users.js';
import { BranchModel } from '../models/Branch.js';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  try {
    const branchCount = await BranchModel.countDocuments();
    let mainBranch;

    if (branchCount === 0) {
      console.log('Seeding initial branch...');
      mainBranch = await BranchModel.create({
        name: 'Main Branch',
        location: 'Mumbai'
      });
    } else {
      mainBranch = await BranchModel.findOne({ name: 'Main Branch' });
    }

    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial users...');
      
      const adminPasswordHash = await bcrypt.hash('admin123', 12);
      await UserModel.create({
        name: 'Super Admin',
        email: 'admin@cashflow.in',
        phone: '9876543210',
        role: 'admin',
        username: 'admin',
        password_hash: adminPasswordHash,
        status: 'active'
      });

      if (mainBranch) {
        const branchPasswordHash = await bcrypt.hash('branch123', 12);
        await UserModel.create({
          name: 'Branch Manager',
          email: 'branch@cashflow.in',
          phone: '9876543211',
          role: 'branch',
          branch_id: mainBranch._id.toString(),
          username: 'branch',
          password_hash: branchPasswordHash,
          status: 'active'
        });
      }
      
      console.log('Database seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

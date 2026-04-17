import mongoose from 'mongoose';
import Transaction from './Transaction.js';

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Virtual for 'id' to map _id
branchSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
branchSchema.set('toJSON', { virtuals: true });
branchSchema.set('toObject', { virtuals: true });

const BranchModel = mongoose.model('Branch', branchSchema);

const Branch = {
  async findAll() {
    // Need to aggregate transactions
    const branches = await BranchModel.find().sort({ created_at: -1 }).lean({ virtuals: true });
    
    // For each branch, get transaction count and total profit (lazy way, better to use aggregate)
    const branchesWithStats = await Promise.all(branches.map(async (b) => {
      // Find transactions by branch.id
      // In Mongoose, we need to check if transaction model has branch_id matching this _id
      const stats = await mongoose.model('Transaction').aggregate([
        { $match: { branch_id: String(b._id) } },
        {
          $group: {
            _id: null,
            transaction_count: { $sum: 1 },
            total_profit: { $sum: '$profit' }
          }
        }
      ]);
      b.id = b._id.toString();
      b.transaction_count = stats.length > 0 ? stats[0].transaction_count : 0;
      b.total_profit = stats.length > 0 ? stats[0].total_profit : 0;
      return b;
    }));
    return branchesWithStats;
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const b = await BranchModel.findById(id).lean({ virtuals: true });
    if(b) b.id = b._id.toString();
    return b || null;
  },

  async existsByName(name, excludeId = null) {
    const query = { name };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await BranchModel.countDocuments(query);
    return count > 0;
  },

  async create({ name, location }) {
    const branch = await BranchModel.create({ name, location });
    const b = branch.toObject();
    b.id = b._id.toString();
    return b;
  },

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await BranchModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
};

// Exporting both the mongoose model and the repo interface
export { BranchModel };
export default Branch;
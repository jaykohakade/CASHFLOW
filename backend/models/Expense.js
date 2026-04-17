import mongoose from 'mongoose';
import { BranchModel } from './Branch.js';

const expenseSchema = new mongoose.Schema(
  {
    branch_id: { type: String, required: true, index: true },
    expense_name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    note: { type: String, default: '', trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

expenseSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

const ExpenseModel = mongoose.model('Expense', expenseSchema);

/* ── helper: attach branch_name ── */
const _joinBranch = async (exp) => {
  if (!exp) return null;
  if (exp.branch_id && mongoose.Types.ObjectId.isValid(exp.branch_id)) {
    const branch = await BranchModel.findById(exp.branch_id).lean();
    if (branch) exp.branch_name = branch.name;
  }
  exp.id = exp._id.toString();
  return exp;
};

const Expense = {
  async findAll(filters = {}) {
    const query = {};
    if (filters.branch_id) query.branch_id = String(filters.branch_id);
    if (filters.date_from || filters.date_to) {
      query.date = {};
      if (filters.date_from) query.date.$gte = new Date(filters.date_from);
      if (filters.date_to)
        query.date.$lte = new Date(filters.date_to + 'T23:59:59.999Z');
    }

    const limit = parseInt(filters.limit) || 500;
    const offset = parseInt(filters.offset) || 0;

    const expenses = await ExpenseModel.find(query)
      .sort({ date: -1, _id: -1 })
      .skip(offset)
      .limit(limit)
      .lean({ virtuals: true });

    return Promise.all(expenses.map(_joinBranch));
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const exp = await ExpenseModel.findById(id).lean({ virtuals: true });
    return _joinBranch(exp);
  },

  async create({ branch_id, expense_name, amount, date, note }) {
    const result = await ExpenseModel.create({
      branch_id: String(branch_id),
      expense_name: expense_name.trim(),
      amount: parseFloat(amount),
      date: new Date(date),
      note: (note || '').trim(),
    });
    const exp = result.toObject();
    exp.id = exp._id.toString();
    return exp;
  },

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await ExpenseModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  async summaryByBranch() {
    const results = await ExpenseModel.aggregate([
      {
        $group: {
          _id: '$branch_id',
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
        },
      },
      { $sort: { total_amount: -1 } },
    ]);

    return Promise.all(
      results.map(async (r) => {
        const bObj = await BranchModel.findById(r._id).lean();
        return {
          branch_id: r._id,
          branch_name: bObj ? bObj.name : null,
          count: r.count,
          total_amount: r.total_amount,
        };
      })
    );
  },
};

export { ExpenseModel };
export default Expense;

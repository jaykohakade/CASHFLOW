import mongoose from 'mongoose';
import { BranchModel } from './Branch.js';
import * as PortalModel from './PortalModel.js';

const transactionSchema = new mongoose.Schema({
  branch_id: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  portal: { type: String, required: true, index: true },
  transaction_type: { type: String, enum: ['CC Withdrawal', 'CC Bill Payment'], default: 'CC Withdrawal', index: true },
  card_digit: { type: String, default: '0000' },
  customer_name: { type: String, default: '' },
  mobile_number: { type: String, default: '', index: true },
  bank_account: { type: String, default: '' },
  bill_pay_charges: { type: Number, default: 0.00 },
  amount: { type: Number, required: true },
  charges: { type: Number, required: true }, // 2.5% for CC Withdrawal, 3.5% for CC Bill Payment
  portal_charges: { type: Number, required: true },
  profit: { type: Number, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

transactionSchema.virtual('id').get(function() { return this._id.toHexString(); });
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

const TransactionModel = mongoose.model('Transaction', transactionSchema);

const DEFAULT_PORTAL_RATE = 0.018; // 1.8%
const TRANSACTION_TYPE_RATES = {
  'CC Withdrawal': 0.025,
  'CC Bill Payment': 0.035,
};

const _joinBranchTx = async (tx) => {
  if (!tx) return null;
  if (tx.branch_id && mongoose.Types.ObjectId.isValid(tx.branch_id)) {
    const branch = await BranchModel.findById(tx.branch_id).lean();
    if (branch) {
      tx.branch_name = branch.name;
    }
  }
  tx.id = tx._id.toString();
  
  // Format dates manually just in case it doesn't match MySQL perfectly, but typically ISO strings are fine.
  // MySQL date fields fetched returned Date objects or strings depending on config.
  // We'll leave it as a Date object from mongoose lean().
  return tx;
};


const Transaction = {
  normalizeTransactionType(transactionType) {
    const normalized = String(transactionType || '').trim().toLowerCase();
    if (normalized === 'cc withdrawal' || normalized === 'cc withdrawl') return 'CC Withdrawal';
    if (normalized === 'cc bill payment') return 'CC Bill Payment';
    return null;
  },

  compute(amount, transactionType, portalRate = DEFAULT_PORTAL_RATE) {
    const amt = parseFloat(amount) || 0;
    const normalizedType = Transaction.normalizeTransactionType(transactionType);
    const chargeRate = TRANSACTION_TYPE_RATES[normalizedType] || TRANSACTION_TYPE_RATES['CC Withdrawal'];
    const safePortalRate = Number.isFinite(Number(portalRate)) ? Number(portalRate) : DEFAULT_PORTAL_RATE;
    const charges = parseFloat((amt * chargeRate).toFixed(2));
    const portal_charges = parseFloat((amt * safePortalRate).toFixed(2));
    const profit = parseFloat((charges - portal_charges).toFixed(2));
    return { chargeRate, charges, portal_charges, profit };
  },

  async findAll(filters = {}) {
    const query = {};

    if (filters.branch_id) query.branch_id = String(filters.branch_id);
    if (filters.date_from || filters.date_to) {
      query.date = {};
      if (filters.date_from) query.date.$gte = new Date(filters.date_from);
      if (filters.date_to) query.date.$lte = new Date(filters.date_to + 'T23:59:59.999Z');
    }
    if (filters.portal) query.portal = filters.portal;

    const limit = parseInt(filters.limit) || 500;
    const offset = parseInt(filters.offset) || 0;

    const transactions = await TransactionModel.find(query)
      .sort({ date: -1, _id: -1 })
      .skip(offset)
      .limit(limit)
      .lean({ virtuals: true });

    return Promise.all(transactions.map(_joinBranchTx));
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const txn = await TransactionModel.findById(id).lean({ virtuals: true });
    return _joinBranchTx(txn);
  },

  async create({
    branch_id,
    date,
    portal,
    amount,
    transaction_type,
    card_digit,
    customer_name,
    mobile_number,
    bank_account,
    bill_pay_charges,
  }) {
    const normalizedType = Transaction.normalizeTransactionType(transaction_type);
    let portalRate = 0;
    
    // Using mongoose to get portal rate
    const portals = await mongoose.model('Portal').find({ portal_name: portal.trim() }).limit(1).lean();
    if (portals.length > 0 && portals[0].charge_per_transaction !== undefined) {
      portalRate = Number(portals[0].charge_per_transaction) / 100;
    }

    const extraBillPayCharges = parseFloat(bill_pay_charges) || 0;
    const { charges, portal_charges } = Transaction.compute(amount, normalizedType, portalRate);
    const profit = parseFloat((charges - portal_charges - extraBillPayCharges).toFixed(2));

    let txDate = new Date(date);

    const result = await TransactionModel.create({
      branch_id: String(branch_id),
      date: txDate,
      portal: portal.trim(),
      transaction_type: normalizedType || 'CC Withdrawal',
      card_digit: String(card_digit || '0000').trim(),
      customer_name: (customer_name || '').trim(),
      mobile_number: String(mobile_number || '').trim(),
      bank_account: String(bank_account || '').trim(),
      bill_pay_charges: extraBillPayCharges,
      amount: parseFloat(amount),
      charges,
      portal_charges,
      profit
    });

    const txn = result.toObject();
    txn.id = txn._id.toString();
    
    return txn;
  },

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await TransactionModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  async summaryByBranch() {
    const results = await TransactionModel.aggregate([
      {
        $group: {
          _id: '$branch_id',
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
          total_charges: { $sum: '$charges' },
          total_portal: { $sum: '$portal_charges' },
          total_profit: { $sum: '$profit' }
        }
      },
      { $sort: { total_profit: -1 } }
    ]);
    
    return Promise.all(results.map(async r => {
      const bObj = await BranchModel.findById(r._id).lean();
      return {
        branch_id: r._id,
        branch_name: bObj ? bObj.name : null,
        count: r.count,
        total_amount: r.total_amount,
        total_charges: r.total_charges,
        total_portal: r.total_portal,
        total_profit: r.total_profit
      };
    }));
  },

  async monthlySummary(branchId = null) {
    const match = {};
    if (branchId) match.branch_id = String(branchId);

    const results = await TransactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
          total_profit: { $sum: '$profit' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    return results.map(r => ({
      month: r._id,
      count: r.count,
      total_amount: r.total_amount,
      total_profit: r.total_profit
    }));
  },
};

export { TransactionModel };
export default Transaction;

import Transaction from '../models/Transaction.js';
import Branch from '../models/Branch.js';

/**
 * GET /api/transactions
 * Query params: branch_id, date_from, date_to, portal, limit, offset
 */
export const getAllTransactions = async (req, res) => {
  try {
    const filters = {
      branch_id: req.query.branch_id || null,
      date_from: req.query.date_from || null,
      date_to:   req.query.date_to   || null,
      portal:    req.query.portal    || null,
      limit:     req.query.limit     || 500,
      offset:    req.query.offset    || 0,
    };

    const transactions = await Transaction.findAll(filters);
    res.json(transactions);

  } catch (err) {
    console.error('[transactionController.getAllTransactions]', err);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

/**
 * GET /api/transactions/summary
 * Returns aggregate totals per branch
 */
export const getSummaryByBranch = async (req, res) => {
  try {
    const summary = await Transaction.summaryByBranch();
    res.json(summary);
  } catch (err) {
    console.error('[transactionController.getSummaryByBranch]', err);
    res.status(500).json({ message: 'Failed to fetch summary', error: err.message });
  }
};

/**
 * GET /api/transactions/monthly
 * Query params: branch_id (optional)
 * Returns last 12 months of totals
 */
export const getMonthlyReport = async (req, res) => {
  try {
    const data = await Transaction.monthlySummary(req.query.branch_id || null);
    res.json(data);
  } catch (err) {
    console.error('[transactionController.getMonthlyReport]', err);
    res.status(500).json({ message: 'Failed to fetch monthly report', error: err.message });
  }
};

/**
 * GET /api/transactions/:id
 */
export const getTransactionById = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    console.error('[transactionController.getTransactionById]', err);
    res.status(500).json({ message: 'Failed to fetch transaction', error: err.message });
  }
};

/**
 * POST /api/transactions
 * Body: { branch_id, date, portal, amount }
 * Server re-computes charges, portal_charges, profit for data integrity
 */
export const createTransaction = async (req, res) => {
  try {
    const {
      branch_id,
      date,
      portal,
      amount,
      transaction_type,
      card_digit,
      customer_name,
      mobile_number,
      bank_account,
    } = req.body;

    // ── Validation ──
    if (!branch_id) {
      return res.status(400).json({ message: 'branch_id is required' });
    }
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ message: 'A valid date is required (YYYY-MM-DD)' });
    }
    if (!portal || !portal.trim()) {
      return res.status(400).json({ message: 'Portal name is required' });
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (Number(amount) > 10_000_000) {
      return res.status(400).json({ message: 'Amount exceeds maximum allowed limit (₹1 Crore)' });
    }

    // ── Verify branch exists ──
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(404).json({ message: `Branch #${branch_id} not found` });
    }

    const txn = await Transaction.create({ branch_id, date, portal: portal.trim(), amount });
    res.status(201).json({ ...txn, branch_name: branch.name });

  } catch (err) {
    console.error('[transactionController.createTransaction]', err);
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};

/**
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('[transactionController.deleteTransaction]', err);
    res.status(500).json({ message: 'Failed to delete transaction', error: err.message });
  }
};

/**
 * GET /api/transactions/preview-charges?amount=X
 * Client-side calculation helper — returns computed charges without saving
 */
export const previewCharges = (req, res) => {
  const amount = parseFloat(req.query.amount);
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Provide a valid positive amount' });
  }
  res.json(Transaction.compute(amount));
};

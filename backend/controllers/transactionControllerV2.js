import Transaction from '../models/Transaction.js';
import Branch from '../models/Branch.js';

export const getAllTransactions = async (req, res) => {
  try {
    const filters = {
      branch_id: req.query.branch_id || null,
      date_from: req.query.date_from || null,
      date_to: req.query.date_to || null,
      portal: req.query.portal || null,
      limit: req.query.limit || 500,
      offset: req.query.offset || 0,
    };

    const transactions = await Transaction.findAll(filters);
    res.json(transactions);
  } catch (err) {
    console.error('[transactionControllerV2.getAllTransactions]', err);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

export const getSummaryByBranch = async (req, res) => {
  try {
    const summary = await Transaction.summaryByBranch();
    res.json(summary);
  } catch (err) {
    console.error('[transactionControllerV2.getSummaryByBranch]', err);
    res.status(500).json({ message: 'Failed to fetch summary', error: err.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const data = await Transaction.monthlySummary(req.query.branch_id || null);
    res.json(data);
  } catch (err) {
    console.error('[transactionControllerV2.getMonthlyReport]', err);
    res.status(500).json({ message: 'Failed to fetch monthly report', error: err.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    console.error('[transactionControllerV2.getTransactionById]', err);
    res.status(500).json({ message: 'Failed to fetch transaction', error: err.message });
  }
};

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
      bill_pay_charges,
    } = req.body;

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
    if (Number(amount) > 10000000) {
      return res.status(400).json({ message: 'Amount exceeds maximum allowed limit (Rs 1 Crore)' });
    }

    const normalizedType = Transaction.normalizeTransactionType(transaction_type) || 'CC Withdrawal';
    
    // Optional validations for legacy forms compatibility
    const safeCardDigit = String(card_digit || '0000').trim();
    if (card_digit && !/^\d{4}$/.test(safeCardDigit)) {
      return res.status(400).json({ message: 'Card digit must be exactly 4 digits' });
    }
    
    const safeMobileNumber = String(mobile_number || '').trim();
    if (mobile_number && !/^\d{10,15}$/.test(safeMobileNumber)) {
      return res.status(400).json({ message: 'Mobile number must be 10 to 15 digits' });
    }

    if (normalizedType === 'CC Bill Payment' && bill_pay_charges !== undefined && bill_pay_charges !== '') {
      if (isNaN(bill_pay_charges) || Number(bill_pay_charges) < 0) {
        return res.status(400).json({ message: 'bill_pay_charges must be a valid non-negative number' });
      }
    }

    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(404).json({ message: `Branch #${branch_id} not found` });
    }

    const txn = await Transaction.create({
      branch_id,
      date,
      portal: portal.trim(),
      amount,
      transaction_type: normalizedType,
      card_digit: String(card_digit || '0000').trim(),
      customer_name: (customer_name || '').trim(),
      mobile_number: String(mobile_number || '').trim(),
      bank_account: String(bank_account || '').trim(),
      bill_pay_charges: Number(bill_pay_charges || 0),
    });

    res.status(201).json({ ...txn, branch_name: branch.name });
  } catch (err) {
    console.error('[transactionControllerV2.createTransaction]', err);
    res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('[transactionControllerV2.deleteTransaction]', err);
    res.status(500).json({ message: 'Failed to delete transaction', error: err.message });
  }
};

export const previewCharges = (req, res) => {
  const amount = parseFloat(req.query.amount);
  const transactionType = req.query.transaction_type;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Provide a valid positive amount' });
  }

  const normalizedType = Transaction.normalizeTransactionType(transactionType);
  if (!normalizedType) {
    return res.status(400).json({ message: 'Provide a valid transaction_type' });
  }

  res.json(Transaction.compute(amount, normalizedType));
};

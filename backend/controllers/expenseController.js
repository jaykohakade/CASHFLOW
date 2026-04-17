import Expense from '../models/Expense.js';
import Branch from '../models/Branch.js';

export const getAllExpenses = async (req, res) => {
  try {
    const filters = {
      branch_id: req.query.branch_id || null,
      date_from: req.query.date_from || null,
      date_to: req.query.date_to || null,
      limit: req.query.limit || 500,
      offset: req.query.offset || 0,
    };
    const expenses = await Expense.findAll(filters);
    res.json(expenses);
  } catch (err) {
    console.error('[expenseController.getAllExpenses]', err);
    res.status(500).json({ message: 'Failed to fetch expenses', error: err.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Expense not found' });
    res.json(exp);
  } catch (err) {
    console.error('[expenseController.getExpenseById]', err);
    res.status(500).json({ message: 'Failed to fetch expense', error: err.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { branch_id, expense_name, amount, date, note } = req.body;

    if (!branch_id) return res.status(400).json({ message: 'branch_id is required' });
    if (!expense_name || !expense_name.trim())
      return res.status(400).json({ message: 'Expense name is required' });
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ message: 'Amount must be a positive number' });
    if (!date || isNaN(Date.parse(date)))
      return res.status(400).json({ message: 'A valid date is required (YYYY-MM-DD)' });

    // Look up branch name (optional — skip id validity check since branch_id is stored as string)
    let branchName = null;
    try {
      const branch = await Branch.findById(branch_id);
      branchName = branch ? branch.name : null;
    } catch (_) {
      // branch lookup failed — continue saving anyway
    }

    const exp = await Expense.create({ branch_id, expense_name, amount, date, note });

    // Ensure id is present in response
    const responseExp = { ...exp, id: exp._id ? exp._id.toString() : exp.id };
    if (branchName) responseExp.branch_name = branchName;

    res.status(201).json(responseExp);
  } catch (err) {
    console.error('[expenseController.createExpense]', err);
    res.status(500).json({ message: 'Failed to create expense', error: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('[expenseController.deleteExpense]', err);
    res.status(500).json({ message: 'Failed to delete expense', error: err.message });
  }
};

export const getSummaryByBranch = async (req, res) => {
  try {
    const summary = await Expense.summaryByBranch();
    res.json(summary);
  } catch (err) {
    console.error('[expenseController.getSummaryByBranch]', err);
    res.status(500).json({ message: 'Failed to fetch expense summary', error: err.message });
  }
};

import express from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  deleteExpense,
  getSummaryByBranch,
} from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', getAllExpenses);
router.get('/summary', getSummaryByBranch);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;

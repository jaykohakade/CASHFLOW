import express from 'express';
import {
  getAllTransactions,
  getSummaryByBranch,
  getMonthlyReport,
  getTransactionById,
  createTransaction,
  deleteTransaction,
  previewCharges,
} from '../controllers/transactionControllerV2.js';

const router = express.Router();

router.get('/', getAllTransactions);
router.get('/summary', getSummaryByBranch);
router.get('/monthly', getMonthlyReport);
router.get('/preview-charges', previewCharges);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

export default router;

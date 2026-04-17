// backend/routes/branchRoutes.js
import express from 'express';
import { getAllBranches, createBranch, deleteBranch } from '../controllers/branchController.js';

const router = express.Router();

router.get('/', getAllBranches);
router.post('/', createBranch);
router.delete('/:id', deleteBranch);

export default router;
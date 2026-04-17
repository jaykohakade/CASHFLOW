import express from 'express';
import {
  addPortal,
  getPortals,
  updatePortal,
  deletePortal
} from '../controllers/portalController.js';

const router = express.Router();

// Routes
router.get('/', getPortals);
router.post('/', addPortal);
router.put('/:id', updatePortal);
router.delete('/:id', deletePortal);

export default router;
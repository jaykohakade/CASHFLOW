import {
  createPortal,
  getAllPortals,
  updatePortalById,
  deletePortalById
} from '../models/PortalModel.js';

// validation (same as your route)
const validate = ({ portal_name, company_name, charge_per_transaction }) => {
  const errors = [];

  if (!portal_name?.trim()) errors.push('portal_name is required');
  if (!company_name?.trim()) errors.push('company_name is required');

  if (charge_per_transaction === undefined || charge_per_transaction === '') {
    errors.push('charge_per_transaction is required');
  } else {
    const n = Number(charge_per_transaction);
    if (isNaN(n)) errors.push('must be number');
    else if (n < 0) errors.push('cannot be negative');
    else if (n > 100) errors.push('cannot exceed 100');
  }

  return errors;
};

// CREATE
export const addPortal = async (req, res) => {
  try {
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const portal = await createPortal(req.body);
    res.status(201).json(portal);

  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Portal already exists' });

    res.status(500).json({ message: 'Failed to create portal' });
  }
};

// GET ALL
export const getPortals = async (req, res) => {
  try {
    const data = await getAllPortals();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch portals' });
  }
};

// UPDATE
export const updatePortal = async (req, res) => {
  try {
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const updated = await updatePortalById(req.params.id, req.body);

    if (!updated) return res.status(404).json({ message: 'Portal not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update portal' });
  }
};

// DELETE
export const deletePortal = async (req, res) => {
  try {
    const success = await deletePortalById(req.params.id);

    if (!success) return res.status(404).json({ message: 'Portal not found' });

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete portal' });
  }
};
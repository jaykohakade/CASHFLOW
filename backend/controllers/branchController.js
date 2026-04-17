// backend/controllers/branchController.js
import Branch from '../models/Branch.js';

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll();
    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch branches', error: err.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !location) return res.status(400).json({ message: 'Required fields missing' });

    const nameTaken = await Branch.existsByName(name.trim());
    if (nameTaken) return res.status(409).json({ message: 'Branch name already exists' });

    const newBranch = await Branch.create({ name, location });
    res.status(201).json(newBranch);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const deleted = await Branch.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};
import bcrypt from 'bcryptjs';
import User from "../models/Users.js";
import Branch from '../models/Branch.js';

/**
 * GET /api/users
 * Returns all users (admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    // Strip password hash before sending
    const safe = users.map(({ password_hash, ...u }) => u);
    res.json(safe);
  } catch (err) {
    console.error('[userController.getAllUsers]', err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password_hash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    console.error('[userController.getUserById]', err);
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

/**
 * GET /api/users/by-branch/:branchId
 * Get all users assigned to a specific branch
 */
export const getUsersByBranch = async (req, res) => {
  try {
    const users = await User.findByBranch(req.params.branchId);
    res.json(users.map(({ password_hash, ...u }) => u));
  } catch (err) {
    console.error('[userController.getUsersByBranch]', err);
    res.status(500).json({ message: 'Failed to fetch branch users', error: err.message });
  }
};

/**
 * POST /api/users
 * Body: { name, email, phone, password, role, branch_id }
 */
export const createUser = async (req, res) => { 
  try {
    const { name, email, phone, password, role, branch_id } = req.body;

    console.log('[createUser] Received payload:', { name, email, phone, role, branch_id, password: password ? '***' : 'missing' });

    /* ── Validation ── */
    if (!name || name.trim().length < 2)
      return res.status(400).json({ message: 'Full name is required (min 2 chars)' });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'A valid email address is required' });

    if (phone && phone.trim() !== '' && !/^[6-9]\d{9}$/.test(phone))
      return res.status(400).json({ message: 'Valid 10-digit Indian mobile number required' });

    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (!role || !['admin', 'branch'].includes(role))
      return res.status(400).json({ message: 'Role must be "admin" or "branch"' });

    if (role === 'branch' && !branch_id)
      return res.status(400).json({ message: 'branch_id is required for branch role' });

    /* ── Duplicate email check ── */
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ message: 'A user with this email already exists' });

    /* ── Verify branch exists ── */
    if (branch_id) {
      const branch = await Branch.findById(branch_id);
      if (!branch) return res.status(404).json({ message: `Branch #${branch_id} not found` });
    }

    /* ── Hash password with bcryptjs ── */
    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name:          name.trim(),
      email:         email.toLowerCase().trim(),
      phone:         phone.trim(),
      role,
      branch_id:     branch_id || null,
      username:      email.toLowerCase().split('@')[0], // auto-generate username
      password_hash: password_hash,
      status:        'active',
    });

    console.log('[createUser] User created successfully:', { id: user.id, name: user.name, email: user.email });
    
    // Add branch info if branch role
    const response = { ...user };
    if (branch_id) {
      const branch = await Branch.findById(branch_id);
      response.branch_name = branch?.name || null;
      response.branch_location = branch?.location || null;
    }
    
    res.status(201).json(response);

  } catch (err) {
    console.error('[userController.createUser]', err);
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
};

/**
 * PUT /api/users/:id
 * Body: { name, email, phone, role, branch_id }
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, branch_id } = req.body;
    const { id } = req.params;

    if (!name || name.trim().length < 2)
      return res.status(400).json({ message: 'Full name required' });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Valid email required' });

    if (phone && phone.trim() !== '' && !/^[6-9]\d{9}$/.test(phone))
      return res.status(400).json({ message: 'Valid 10-digit mobile number required' });

    if (!role || !['admin', 'branch'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    if (role === 'branch' && !branch_id)
      return res.status(400).json({ message: 'branch_id required for branch role' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = await User.update(id, { name, email, phone, role, branch_id: branch_id || null });
    if (!updated) return res.status(404).json({ message: 'User not found' });

    // Return updated user with branch info
    const fresh = await User.findById(id);
    const { password_hash, ...safe } = fresh;
    res.json(safe);

  } catch (err) {
    console.error('[userController.updateUser]', err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

/**
 * PATCH /api/users/:id
 * Partial update — used for toggling status
 * Body: { status }
 */
export const patchUser = async (req, res) => {
  try {
    const { status } = req.body;
    if (status && !['active', 'inactive'].includes(status))
      return res.status(400).json({ message: 'Status must be "active" or "inactive"' });

    const updated = await User.updateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({ id: parseInt(req.params.id), status });

  } catch (err) {
    console.error('[userController.patchUser]', err);
    res.status(500).json({ message: 'Failed to update user status', error: err.message });
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[userController.deleteUser]', err);
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

/**
 * GET /api/users/roles
 * Returns available roles (static) — used by frontend selectors
 */
export const getRoles = (req, res) => {
  res.json([
    { value: 'admin',  label: 'Administrator', description: 'Full access to all branches and data' },
    { value: 'branch', label: 'Branch Manager', description: 'Access limited to assigned branch' },
  ]);
};

/**
 * PATCH /api/users/:id/change-password
 * Body: { currentPassword, newPassword }
 * Verifies current password against stored hash, then updates to new hash.
 */
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both currentPassword and newPassword are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    // Fetch raw user (includes password_hash)
    const user = await User.findByIdRaw(id);
    if (!user)
      return res.status(404).json({ message: 'User not found.' });

    if (!user.password_hash)
      return res.status(400).json({ message: 'No password set for this account. Contact admin.' });

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Current password is incorrect.' });

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(id, newHash);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[userController.changePassword]', err);
    res.status(500).json({ message: 'Failed to change password.', error: err.message });
  }
};

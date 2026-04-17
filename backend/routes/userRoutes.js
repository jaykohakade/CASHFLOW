import express from "express";
import {
  getAllUsers,
  getUserById,
  getUsersByBranch,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getRoles,
  changePassword
} from '../controllers/userController.js';

const router = express.Router();

/**
 * @route   GET /api/users/roles
 */
router.get('/roles', getRoles);

/**
 * @route   GET /api/users
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/by-branch/:branchId
 */
router.get('/by-branch/:branchId', getUsersByBranch);

/**
 * @route   GET /api/users/:id
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 */
router.post('/', createUser);

/**
 * @route   PUT /api/users/:id
 */
router.put('/:id', updateUser);

/**
 * @route   PATCH /api/users/:id
 */
router.patch('/:id', patchUser);

/**
 * @route   PATCH /api/users/:id/change-password
 */
router.patch('/:id/change-password', changePassword);

/**
 * @route   DELETE /api/users/:id
 */
router.delete('/:id', deleteUser);

export default router;
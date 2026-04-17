import mongoose from 'mongoose';
import { BranchModel } from './Branch.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, default: null },
  role: { type: String, enum: ['admin', 'branch'], default: 'branch', index: true },
  branch_id: { type: String, default: null, index: true }, // Store as string to simplify relationships
  username: { type: String, unique: true, sparse: true, index: true },
  password_hash: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.virtual('id').get(function() { return this._id.toHexString(); });
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const UserModel = mongoose.model('User', userSchema);

const _joinBranch = async (userObj) => {
  if (!userObj) return null;
  if (userObj.branch_id && mongoose.Types.ObjectId.isValid(userObj.branch_id)) {
    const branch = await BranchModel.findById(userObj.branch_id).lean();
    if (branch) {
      userObj.branch_name = branch.name;
      userObj.branch_location = branch.location;
    }
  }
  userObj.id = userObj._id.toString();
  return userObj;
};

const Users = {
  async findAll() {
    const users = await UserModel.find().sort({ created_at: -1 }).lean({ virtuals: true });
    return Promise.all(users.map(_joinBranch));
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const user = await UserModel.findById(id).lean({ virtuals: true });
    return _joinBranch(user);
  },

  async findByUsername(username) {
    const user = await UserModel.findOne({ username }).lean({ virtuals: true });
    return _joinBranch(user);
  },

  async findByEmail(email) {
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean({ virtuals: true });
    return user ? { id: user._id.toString() } : null;
  },

  async create({ name, email, phone, role, branch_id, username, password_hash, status = 'active' }) {
    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      role,
      branch_id: branch_id || null,
      username: username?.trim() || null,
      password_hash: password_hash || null,
      status,
    });
    const u = user.toObject();
    u.id = u._id.toString();
    return u;
  },

  async update(id, { name, email, phone, role, branch_id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await UserModel.updateOne({ _id: id }, {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      role,
      branch_id: branch_id || null
    });
    return result.modifiedCount > 0 || result.matchedCount > 0;
  },

  async updateStatus(id, status) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await UserModel.updateOne({ _id: id }, { status });
    return result.modifiedCount > 0 || result.matchedCount > 0;
  },

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  async findByRole(role) {
    const users = await UserModel.find({ role }).sort({ name: 1 }).lean({ virtuals: true });
    return Promise.all(users.map(_joinBranch));
  },

  async findByBranch(branchId) {
    const users = await UserModel.find({ branch_id: String(branchId) }).sort({ name: 1 }).lean({ virtuals: true });
    return users.map(u => {
      u.id = u._id.toString();
      return u;
    });
  },

  // Returns the raw document (with password_hash) for internal use
  async findByIdRaw(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserModel.findById(id).lean({ virtuals: true });
  },

  async updatePassword(id, newHash) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await UserModel.updateOne({ _id: id }, { password_hash: newHash });
    return result.modifiedCount > 0 || result.matchedCount > 0;
  },
};

export { UserModel };
export default Users;
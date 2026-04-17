import mongoose from 'mongoose';

const portalSchema = new mongoose.Schema({
  portal_name: { type: String, required: true },
  company_name: { type: String, required: true },
  charge_per_transaction: { type: Number, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

portalSchema.virtual('id').get(function() { return this._id.toHexString(); });
portalSchema.set('toJSON', { virtuals: true });
portalSchema.set('toObject', { virtuals: true });

const Portal = mongoose.model('Portal', portalSchema);

export const createPortal = async ({ portal_name, company_name, charge_per_transaction }) => {
  const existing = await Portal.findOne({ portal_name: portal_name.trim() });
  if (existing) {
    const err = new Error('Duplicate');
    err.code = 'ER_DUP_ENTRY';
    throw err;
  }
  
  const portal = await Portal.create({
    portal_name: portal_name.trim(),
    company_name: company_name.trim(),
    charge_per_transaction: Number(charge_per_transaction)
  });
  
  const p = portal.toObject();
  p.id = p._id.toString();
  return p;
};

export const getAllPortals = async () => {
  const portals = await Portal.find().sort({ created_at: -1 }).lean({ virtuals: true });
  return portals.map(p => { p.id = p._id.toString(); return p; });
};

export const updatePortalById = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const { portal_name, company_name, charge_per_transaction } = data;

  const result = await Portal.updateOne({ _id: id }, {
    portal_name: portal_name.trim(),
    company_name: company_name.trim(),
    charge_per_transaction: Number(charge_per_transaction)
  });

  if (result.matchedCount === 0) return null;

  const p = await Portal.findById(id).lean({ virtuals: true });
  p.id = p._id.toString();
  return p;
};

export const deletePortalById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const result = await Portal.deleteOne({ _id: id });
  return result.deletedCount > 0;
};
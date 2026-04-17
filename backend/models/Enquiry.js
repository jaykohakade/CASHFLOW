import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

enquirySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

const EnquiryModel = mongoose.model('Enquiry', enquirySchema);

const Enquiry = {
  async findAll() {
    return EnquiryModel.find().sort({ created_at: -1 });
  },
  async create(data) {
    return EnquiryModel.create(data);
  },
  async updateStatus(id, status) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await EnquiryModel.updateOne({ _id: id }, { status });
    return result.modifiedCount > 0 || result.matchedCount > 0;
  },
  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await EnquiryModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
};

export default Enquiry;

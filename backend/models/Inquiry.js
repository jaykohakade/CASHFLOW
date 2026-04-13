// Inquiry.js - Mongoose Model
// const mongoose = require('mongoose');

/*
const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      minlength: 10,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'resolved'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['swipe', 'renewal', 'application', 'franchise', 'general'],
      default: 'general',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
*/

// TODO: Uncomment and install mongoose to activate
module.exports = {};

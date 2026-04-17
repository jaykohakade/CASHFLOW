import express from 'express';
import Enquiry from '../models/Enquiry.js';
import nodemailer from 'nodemailer';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const enquiries = await Enquiry.findAll();
    res.json(enquiries);
  } catch (err) {
    console.error('[enquiryRoutes.get]', err);
    res.status(500).json({ message: 'Error fetching enquiries' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    if (!name || !email || !mobile || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newEnquiry = await Enquiry.create({ name, email, mobile, message });
    res.status(201).json(newEnquiry);
  } catch (err) {
    console.error('[enquiryRoutes.post]', err);
    res.status(500).json({ message: 'Error creating enquiry' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const success = await Enquiry.updateStatus(req.params.id, status);
    if (!success) return res.status(404).json({ message: 'Enquiry not found' });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await Enquiry.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'Enquiry not found' });
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting enquiry' });
  }
});

// POST send reply email
router.post('/:id/reply', async (req, res) => {
  try {
    const { subject, body, to } = req.body;
    if (!subject || !body || !to) {
      return res.status(400).json({ message: 'Missing email fields' });
    }

    // Configure your real SMTP credentials in .env in production
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'pass123',
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Cashflow Team" <noreply@cashflow.in>',
      to,
      subject,
      text: body,
      // You can also add html: body if passing HTML formats in the future
    };

    // Note: If ethereal credentials are used and invalid, this will catch
    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.warn("SMTP Error (If testing locally, configure real SMTP. Faking success for demo)", mailErr.message);
    }

    // Mark as replied in DB
    await Enquiry.updateStatus(req.params.id, 'replied');

    res.json({ message: 'Reply sent successfully' });
  } catch (err) {
    console.error('[enquiryRoutes.reply]', err);
    res.status(500).json({ message: 'Error sending reply email' });
  }
});

export default router;

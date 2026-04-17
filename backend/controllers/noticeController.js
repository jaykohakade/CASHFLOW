import Notice from '../models/Notice.js';
import fs from 'fs';
import path from 'path';

// Create a new notice
export const createNotice = async (req, res) => {
  try {
    const { title, message, emoji } = req.body;
    const files = req.files || {};

    const imageUrl = files['image'] ? `/uploads/${files['image'][0].filename}` : null;
    const fileUrl = files['file'] ? `/uploads/${files['file'][0].filename}` : null;
    const audioUrl = files['audio'] ? `/uploads/${files['audio'][0].filename}` : null;

    const notice = new Notice({
      title,
      message,
      emoji,
      imageUrl,
      fileUrl,
      audioUrl,
      createdBy: req.user ? req.user.id : null,
    });

    await notice.save();
    res.status(201).json({ success: true, count: 1, data: notice });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all notices
export const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    let notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const { title, message, emoji } = req.body;
    const files = req.files || {};

    let updateData = { title, message, emoji };

    if (files['image']) {
      updateData.imageUrl = `/uploads/${files['image'][0].filename}`;
    }
    if (files['file']) {
      updateData.fileUrl = `/uploads/${files['file'][0].filename}`;
    }
    if (files['audio']) {
      updateData.audioUrl = `/uploads/${files['audio'][0].filename}`;
    }

    notice = await Notice.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add or update a branch/user reaction on a notice
export const reactToNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, branchId, branchName, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ success: false, message: 'userId and emoji are required' });
    }

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const existingReactionIndex = notice.reactions.findIndex(
      (reaction) => reaction.userId === String(userId)
    );

    if (existingReactionIndex >= 0) {
      const existingReaction = notice.reactions[existingReactionIndex];

      if (existingReaction.emoji === emoji) {
        notice.reactions.splice(existingReactionIndex, 1);
      } else {
        notice.reactions[existingReactionIndex] = {
          ...existingReaction.toObject(),
          emoji,
          branchId: branchId || existingReaction.branchId || null,
          branchName: branchName || existingReaction.branchName || '',
          reactedAt: new Date(),
        };
      }
    } else {
      notice.reactions.push({
        userId: String(userId),
        branchId: branchId || null,
        branchName: branchName || '',
        emoji,
        reactedAt: new Date(),
      });
    }

    await notice.save();

    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    console.error('Error reacting to notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete notice
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await Notice.findByIdAndDelete(id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

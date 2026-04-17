import express from 'express';
import multer from 'multer';
import { createNotice, getNotices, updateNotice, reactToNotice, deleteNotice } from '../controllers/noticeController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const cpUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

router.post('/', cpUpload, createNotice);
router.get('/', getNotices);
router.patch('/:id/react', reactToNotice);
router.put('/:id', cpUpload, updateNotice);
router.delete('/:id', deleteNotice);

export default router;

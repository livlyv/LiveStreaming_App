const { Router } = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

// Upload file to Cloudflare R2
router.post('/upload',
  upload.single('file'),
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // TODO: Implement Cloudflare R2 upload
      // For now, return a mock URL
      const fileId = uuidv4();
      const fileExtension = req.file.originalname.split('.').pop();
      const mockUrl = `https://r2.example.com/uploads/${fileId}.${fileExtension}`;

      // Store file metadata in database
      const { data: fileRecord, error } = await supabaseAdmin
        .from('media_files')
        .insert([{
          id: fileId,
          user_id: req.user.id,
          filename: req.file.originalname,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          url: mockUrl,
          type: req.file.mimetype.startsWith('image/') ? 'image' : 'video'
        }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to save file metadata' });
      }

      res.json({
        message: 'File uploaded successfully',
        file: {
          id: fileRecord.id,
          filename: fileRecord.filename,
          url: fileRecord.url,
          type: fileRecord.type,
          size: fileRecord.file_size
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  })
);

// Get user's uploaded files
router.get('/my-files', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { page = 1, limit = 20, type } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabaseAdmin
    .from('media_files')
    .select('*')
    .eq('user_id', req.user.id)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (type && (type === 'image' || type === 'video')) {
    query = query.eq('type', type);
  }

  const { data: files, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch files' });
  }

  res.json({
    files,
    page: Number(page),
    limit: Number(limit)
  });
}));

// Delete file
router.delete('/:fileId', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { fileId } = req.params;

  // Verify file ownership
  const { data: file, error: fetchError } = await supabaseAdmin
    .from('media_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', req.user.id)
    .single();

  if (fetchError || !file) {
    return res.status(404).json({ error: 'File not found or access denied' });
  }

  // TODO: Delete from Cloudflare R2
  // For now, just delete from database

  const { error: deleteError } = await supabaseAdmin
    .from('media_files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', req.user.id);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to delete file' });
  }

  res.json({ message: 'File deleted successfully' });
}));

// Get file by ID
router.get('/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const { data: file, error } = await supabaseAdmin
    .from('media_files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (error || !file) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.json({ file });
}));

module.exports = router;

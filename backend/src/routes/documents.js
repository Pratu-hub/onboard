const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const { 
  generateUploadSasUrl, 
  generateReadSasUrl 
} = require('../utils/firebaseStorage');

// Note: Local multer setup is now optional/deprecated but kept for fallback
const uploadDir = process.env.UPLOAD_DIR || './uploads';

/**
 * GET /api/documents
 * New Hires see their own docs. HR roles see all docs.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    let result;

    if (['HR_ADMIN', 'HR_REVIEWER'].includes(req.user.role)) {
      result = await pool.request().query(`
        SELECT d.*, u.name AS user_name, u.email AS user_email
        FROM documents d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.uploaded_at DESC
      `);
    } else {
      result = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .query('SELECT * FROM documents WHERE user_id = @user_id ORDER BY uploaded_at DESC');
    }

    res.json({ documents: result.recordset });
  } catch (err) {
    console.error('List documents error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/documents/generate-sas
 * Generates a SAS URL for direct-to-blob upload from the frontend.
 */
router.get('/generate-sas', authenticate, async (req, res) => {
  const { filename, doc_type, content_type } = req.query;
  
  if (!filename || !doc_type) {
    return res.status(400).json({ error: 'filename and doc_type are required query params' });
  }

  try {
    const uniqueName = `${req.user.id}/${Date.now()}-${filename}`;
    const sasUrl = await generateUploadSasUrl(uniqueName, content_type || 'application/octet-stream');
    
    res.json({ 
      uploadUrl: sasUrl, 
      blobName: uniqueName,
      docType: doc_type 
    });
  } catch (err) {
    console.error('SAS generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate SAS token' });
  }
});

/**
 * POST /api/documents/confirm-upload
 * Confirms a successful blob upload and updates the database record.
 */
router.post('/confirm-upload', authenticate, async (req, res) => {
  const { blobName, originalName, docType } = req.body;

  if (!blobName || !docType) {
    return res.status(400).json({ error: 'blobName and docType are required' });
  }

  try {
    const pool = await getPool();
    
    // Check if a slot for this doc_type already exists for the user
    const existing = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('doc_type', sql.NVarChar, docType)
      .query('SELECT id FROM documents WHERE user_id = @user_id AND doc_type = @doc_type');

    let result;
    if (existing.recordset.length > 0) {
      // Update existing slot
      result = await pool.request()
        .input('id', sql.Int, existing.recordset[0].id)
        .input('filename', sql.NVarChar, blobName)
        .input('original_name', sql.NVarChar, originalName || blobName)
        .query(`
          UPDATE documents 
          SET filename = @filename, original_name = @original_name, status = 'uploaded', uploaded_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
    } else {
      // Create new record
      result = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('doc_type', sql.NVarChar, docType)
        .input('filename', sql.NVarChar, blobName)
        .input('original_name', sql.NVarChar, originalName || blobName)
        .query(`
          INSERT INTO documents (user_id, doc_type, filename, original_name, status)
          OUTPUT INSERTED.*
          VALUES (@user_id, @doc_type, @filename, @original_name, 'uploaded')
        `);
    }

    res.status(200).json({ document: result.recordset[0] });
  } catch (err) {
    console.error('Confirm upload error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/documents/:id/status
 * HR roles only — update document status (verify / reject).
 */
router.patch('/:id/status', authenticate, requireRole('HR_ADMIN', 'HR_REVIEWER'), async (req, res) => {
  const docId = parseInt(req.params.id);
  const { status, reviewer_notes } = req.body;

  const validStatuses = ['pending', 'uploaded', 'ai_processing', 'verified', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, docId)
      .input('status', sql.NVarChar, status)
      .input('reviewer_notes', sql.NVarChar, reviewer_notes || null)
      .query(`
        UPDATE documents 
        SET status = @status, reviewer_notes = @reviewer_notes, reviewed_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document: result.recordset[0] });
  } catch (err) {
    console.error('Update document status error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

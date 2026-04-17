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
const { processDocumentWithAI } = require('../utils/aiProcessor');

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

    const document = result.recordset[0];
    res.status(200).json({ document });

    // Trigger AI processing in background (fire-and-forget)
    setImmediate(async () => {
      console.log(`[AI-TRIGGER] Starting background AI for doc ${document.id} (${document.doc_type})`);
      try {
        // Get a fresh pool reference for the background task
        const bgPool = await getPool();
        
        // Update status to ai_processing
        await bgPool.request()
          .input('doc_id', sql.Int, document.id)
          .query("UPDATE documents SET status = 'ai_processing' WHERE id = @doc_id");
        console.log(`[AI-TRIGGER] Status set to ai_processing for doc ${document.id}`);

        // Generate a signed read URL for the AI service
        const viewUrl = await generateReadSasUrl(document.filename, 30);
        console.log(`[AI-TRIGGER] Generated read URL for doc ${document.id}`);

        // Run the AI analysis
        await processDocumentWithAI(document.id, viewUrl, document.doc_type);
        console.log(`[AI-TRIGGER] AI processing complete for doc ${document.id}`);
      } catch (aiErr) {
        console.error(`[AI-TRIGGER] Background AI failed for doc ${document.id}:`, aiErr.message);
        console.error(`[AI-TRIGGER] Stack:`, aiErr.stack);
        // Revert status so it doesn't stay stuck on ai_processing
        try {
          const bgPool = await getPool();
          await bgPool.request()
            .input('doc_id', sql.Int, document.id)
            .query("UPDATE documents SET status = 'uploaded' WHERE id = @doc_id");
        } catch (_) { /* ignore cleanup error */ }
      }
    });
  } catch (err) {
    console.error('Confirm upload error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/documents/:id/view-url
 * Generates a temporary signed read URL for viewing an uploaded document.
 */
router.get('/:id/view-url', authenticate, async (req, res) => {
  const docId = parseInt(req.params.id);

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, docId)
      .query('SELECT * FROM documents WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.recordset[0];
    console.log(`Generating view URL for doc ID ${docId}, filename: ${doc.filename}`);

    // Only allow the owner or HR roles to view
    if (doc.user_id !== req.user.id && !['HR_ADMIN', 'HR_REVIEWER'].includes(req.user.role)) {
      console.warn(`Unauthorized access attempt to doc ${docId} by user ${req.user.id}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!doc.filename) {
      console.warn(`No filename found for doc ${docId}`);
      return res.status(400).json({ error: 'No file uploaded for this document' });
    }

    const viewUrl = await generateReadSasUrl(doc.filename, 60);
    console.log(`Successfully generated view URL for ${doc.filename}`);
    res.json({ viewUrl, originalName: doc.original_name });
  } catch (err) {
    console.error('View URL generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate view URL' });
  }
});

/**
 * PATCH /api/documents/:id/status
 * HR roles only — update document status (verify / reject).
 */
router.patch('/:id/status', authenticate, requireRole('HR_ADMIN', 'HR_REVIEWER'), async (req, res) => {
  const docId = parseInt(req.params.id);
  const { status, reviewer_notes } = req.body;

  const validStatuses = ['pending', 'uploaded', 'ai_processing', 'verified', 'rejected', 'flagged'];
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

/**
 * POST /api/documents/:id/verify
 * HR roles only — manually trigger AI verification for a specific document.
 */
router.post('/:id/verify', authenticate, requireRole('HR_ADMIN', 'HR_REVIEWER'), async (req, res) => {
  const docId = parseInt(req.params.id);

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, docId)
      .query('SELECT * FROM documents WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.recordset[0];
    if (!doc.filename) {
      return res.status(400).json({ error: 'No file uploaded for this document' });
    }

    // Set status to ai_processing
    await pool.request()
      .input('id', sql.Int, docId)
      .query("UPDATE documents SET status = 'ai_processing' WHERE id = @id");

    // Generate a read URL and run AI analysis
    const viewUrl = await generateReadSasUrl(doc.filename, 30);
    const aiResult = await processDocumentWithAI(docId, viewUrl, doc.doc_type);

    // Fetch the updated record
    const updated = await pool.request()
      .input('id', sql.Int, docId)
      .query('SELECT * FROM documents WHERE id = @id');

    res.json({
      document: updated.recordset[0],
      aiResult
    });
  } catch (err) {
    console.error('Manual verify error:', err.message);
    res.status(500).json({ error: 'AI verification failed' });
  }
});

module.exports = router;

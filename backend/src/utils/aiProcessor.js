const DocumentIntelligence = require('@azure-rest/ai-document-intelligence').default;
const { AzureKeyCredential } = require('@azure/core-auth');
const { AzureOpenAI } = require('openai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getPool, sql } = require('../db/init');
const { crossVerifyWithProfile, crossVerifyWithOpenAI } = require('./crossVerifier');

// === Azure Document Intelligence (OCR Layer) ===
const diEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const diKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

// === Azure OpenAI (GenAI Layer) ===
const aoaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const aoaiKey = process.env.AZURE_OPENAI_KEY;
const aoaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

/**
 * System prompt shared across all document types.
 * Designed to be minimal to reduce input token usage.
 */
const SYSTEM_PROMPT = `You are a document verification AI for an employee onboarding system. Respond ONLY with valid JSON. No markdown, no explanation. Use this exact schema:
{"status":"valid|flagged|rejected","confidence":0.0-1.0,"summary":"<max 30 words>","fields":{"<key>":"<value>"}}
Rules:
- status=valid: document matches expected type and is legible
- status=flagged: document is partially valid or missing key info
- status=rejected: wrong document type or completely illegible
- confidence: your certainty as a decimal (e.g. 0.92)
- summary: one-sentence plain English verdict, max 30 words
- fields: 2-5 key data points extracted from the document`;

/**
 * Per-type user prompts. Kept very short to minimize input tokens.
 * The OCR text is appended after the prompt.
 */
const DOC_PROMPTS = {
  government_id: 'Verify this is a government-issued ID (Aadhaar/PAN/Passport/License). Extract: id_type, id_number, name, dob.',
  education_cert: 'Verify this is an educational certificate/degree. Extract: institution, degree, year, grade_or_cgpa.',
  nda: 'Verify this is a Non-Disclosure Agreement. Extract: parties, effective_date, has_signature (true/false).',
  bank_details: 'Verify this contains bank account details. Extract: bank_name, account_number_last4, ifsc_code, account_type.',
  offer_letter: 'Verify this is an employment offer letter. Extract: company, designation, joining_date, salary_mentioned (true/false).'
};

/**
 * Extracts text from a document using Azure Document Intelligence (OCR).
 * This is the preprocessing step before GenAI analysis.
 *
 * @param {string} documentUrl - A publicly accessible (signed) URL to the document.
 * @returns {string} - Extracted text content, or empty string on failure.
 */
async function extractTextWithOCR(documentUrl) {
  if (!diEndpoint || !diKey) {
    console.warn('[OCR] Document Intelligence credentials not configured, skipping OCR.');
    return '';
  }

  try {
    const client = DocumentIntelligence(diEndpoint, new AzureKeyCredential(diKey));

    console.log(`[OCR] Starting text extraction...`);

    const initialResponse = await client
      .path('/documentModels/{modelId}:analyze', 'prebuilt-layout')
      .post({
        contentType: 'application/json',
        body: { urlSource: documentUrl }
      });

    const operationUrl = initialResponse.headers['operation-location'];
    if (!operationUrl) {
      console.error('[OCR] No operation-location header. Status:', initialResponse.status);
      return '';
    }

    // Poll for completion (max 60s)
    let attempts = 0;
    while (attempts < 30) {
      await sleep(2000);
      attempts++;
      const pollResponse = await client.pathUnchecked(operationUrl).get();
      const pollBody = pollResponse.body;

      if (pollBody.status === 'succeeded') {
        const content = (pollBody.analyzeResult?.content || '').trim();
        console.log(`[OCR] Extracted ${content.length} chars in ${attempts * 2}s`);
        return content;
      } else if (pollBody.status === 'failed') {
        console.error('[OCR] Analysis failed:', pollBody.error?.message);
        return '';
      }
    }

    console.error('[OCR] Timed out after 60s');
    return '';
  } catch (err) {
    console.error('[OCR] Error:', err.message);
    return '';
  }
}

/**
 * Sends extracted text to Azure OpenAI GPT-4o-mini for intelligent validation.
 * 
 * Token optimization strategy:
 * - System prompt: ~120 tokens (fixed cost)
 * - User prompt: ~30 tokens + truncated OCR text
 * - OCR text: capped at 800 chars (~200 tokens)
 * - max_tokens: 150 (hard cap on output)
 * - Total per call: ~500 tokens max
 *
 * @param {string} ocrText - Extracted text from OCR.
 * @param {string} docType - Expected document type.
 * @returns {Object} - { status, confidence, summary, fields }
 */
async function analyzeWithGenAI(ocrText, docType) {
  if (!aoaiEndpoint || !aoaiKey) {
    console.warn('[GenAI] Azure OpenAI credentials not configured. Falling back to rule-based.');
    return null;
  }

  try {
    const client = new AzureOpenAI({
      endpoint: aoaiEndpoint,
      apiKey: aoaiKey,
      apiVersion: '2024-08-01-preview',
      deployment: aoaiDeployment
    });

    // Truncate OCR text to save tokens (800 chars ≈ 200 tokens)
    const truncatedText = ocrText.length > 800
      ? ocrText.substring(0, 800) + '...[truncated]'
      : ocrText;

    const userPrompt = DOC_PROMPTS[docType] || 'Verify this document and extract key fields.';

    console.log(`[GenAI] Sending ${truncatedText.length} chars to ${aoaiDeployment}`);

    const response = await client.chat.completions.create({
      model: aoaiDeployment,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${userPrompt}\n\nDOCUMENT TEXT:\n${truncatedText}` }
      ],
      max_tokens: 150,
      temperature: 0.1, // Low temperature for consistent, deterministic output
      response_format: { type: 'json_object' }
    });

    const usage = response.usage;
    console.log(`[GenAI] Tokens used — prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens}, total: ${usage?.total_tokens}`);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[GenAI] Empty response from model');
      return null;
    }

    const parsed = JSON.parse(content);

    // Validate the response structure
    return {
      status: ['valid', 'flagged', 'rejected'].includes(parsed.status) ? parsed.status : 'flagged',
      confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      summary: (parsed.summary || 'Analysis complete.').substring(0, 200),
      fields: parsed.fields || {}
    };

  } catch (err) {
    console.error('[GenAI] Error:', err.message);
    return null;
  }
}

/**
 * FALLBACK: Rule-based validation (used when GenAI is unavailable).
 * Preserved from the original implementation for resilience.
 */
const RULE_VALIDATORS = {
  government_id: (text) => {
    const t = text.toLowerCase();
    const aadhaar = /\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/.test(t);
    const pan = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(text);
    const passport = /\b[A-Z][0-9]{7}\b/.test(text);
    const found = [aadhaar && 'Aadhaar', pan && 'PAN', passport && 'Passport'].filter(Boolean);
    if (found.length === 0) return { status: 'flagged', summary: '⚠️ No valid ID patterns detected.' };
    return { status: 'valid', summary: `✅ Government ID detected: ${found.join(', ')}.` };
  },
  education_cert: (text) => {
    const t = text.toLowerCase();
    const kws = ['university', 'degree', 'certificate', 'bachelor', 'master', 'cgpa', 'marks'];
    const matched = kws.filter(k => t.includes(k));
    if (matched.length < 2) return { status: 'flagged', summary: '⚠️ Does not appear to be an educational certificate.' };
    return { status: 'valid', summary: `✅ Education certificate verified. Terms: ${matched.slice(0, 3).join(', ')}.` };
  },
  nda: (text) => {
    const t = text.toLowerCase();
    const hasHeader = ['non-disclosure', 'confidentiality', 'agreement'].some(k => t.includes(k));
    if (!hasHeader) return { status: 'flagged', summary: '⚠️ NDA header not found.' };
    return { status: 'valid', summary: '✅ NDA structure verified.' };
  },
  bank_details: (text) => {
    const hasIFSC = /[A-Z]{4}0[A-Z0-9]{6}/.test(text.toUpperCase());
    const hasAccount = /\b\d{9,18}\b/.test(text);
    if (!hasIFSC && !hasAccount) return { status: 'flagged', summary: '⚠️ No bank account or IFSC detected.' };
    if (!hasIFSC) return { status: 'flagged', summary: '⚠️ Account number found but IFSC missing.' };
    return { status: 'valid', summary: '✅ Bank details verified.' };
  },
  offer_letter: (text) => {
    const t = text.toLowerCase();
    const groups = [
      ['offer', 'appointment', 'employment'],
      ['salary', 'ctc', 'compensation'],
      ['designation', 'position', 'role'],
      ['joining date', 'start date']
    ];
    const found = groups.filter(g => g.some(k => t.includes(k)));
    if (found.length < 2) return { status: 'flagged', summary: '⚠️ Not recognized as an Offer Letter.' };
    return { status: 'valid', summary: '✅ Offer Letter verified with key employment terms.' };
  }
};

/**
 * Main entry point: Analyzes a document using a two-layer pipeline.
 * 
 * Layer 1: Azure Document Intelligence (OCR) — extracts text
 * Layer 2: Azure OpenAI GPT-4o-mini (GenAI) — validates and summarizes
 * Fallback: Rule-based validation if GenAI is unavailable
 *
 * @param {string} documentUrl - A publicly accessible (signed) URL to the document.
 * @param {string} docType - The expected document type.
 * @returns {Object} - { status, summary, extractedFields, confidence, source }
 */
async function analyzeDocument(documentUrl, docType) {
  // Layer 1: OCR
  const ocrText = await extractTextWithOCR(documentUrl);

  if (!ocrText || ocrText.length < 10) {
    return {
      status: 'flagged',
      summary: '⚠️ Document could not be read. Please re-upload a clearer scan.',
      extractedFields: {},
      confidence: 0,
      source: 'ocr_failure'
    };
  }

  // Layer 2: GenAI (preferred)
  const genaiResult = await analyzeWithGenAI(ocrText, docType);

  if (genaiResult) {
    return {
      status: genaiResult.status,
      summary: genaiResult.summary,
      extractedFields: genaiResult.fields,
      confidence: genaiResult.confidence,
      source: 'genai'
    };
  }

  // Fallback: Rule-based validation
  console.log('[AI] GenAI unavailable, using rule-based fallback.');
  const validator = RULE_VALIDATORS[docType];
  if (!validator) {
    return {
      status: 'valid',
      summary: `Document processed. No specific validator for type "${docType}".`,
      extractedFields: { charCount: ocrText.length },
      confidence: 0.5,
      source: 'fallback'
    };
  }

  const ruleResult = validator(ocrText);
  return {
    ...ruleResult,
    extractedFields: {},
    confidence: ruleResult.status === 'valid' ? 0.7 : 0.4,
    source: 'rule_based'
  };
}

/**
 * Processes a document record: analyzes the file via the AI pipeline,
 * then updates the database with the results.
 *
 * @param {number} docId - The document row ID in the database.
 * @param {string} blobUrl - A signed URL to read the document.
 * @param {string} docType - The expected document type.
 */
async function processDocumentWithAI(docId, blobUrl, docType) {
  console.log(`[AI] Processing document ID ${docId}, type: ${docType}`);

  // Step 1: Analyze document with Azure Document Intelligence
  const result = await analyzeDocument(blobUrl, docType);

  // Step 2: Cross-verify extracted text against user profile
  let crossVerification = null;
  try {
    // Fetch the user_id for this document
    const pool = await getPool();
    const docRow = await pool.request()
      .input('doc_id', sql.Int, docId)
      .query('SELECT user_id FROM documents WHERE id = @doc_id');

    if (docRow.recordset.length > 0) {
      const userId = docRow.recordset[0].user_id;

      // Run cross-verification against the user's profile
      crossVerification = await crossVerifyWithProfile(
        userId,
        result.extractedText || '',
        docType
      );

      console.log(`[AI] Cross-verification complete: verified=${crossVerification.verified}, flags=${crossVerification.flags.length}`);

      // If cross-verification found issues, downgrade the status
      if (!crossVerification.verified && result.status === 'valid') {
        result.status = 'flagged';
        result.summary += ' | Cross-verification: ' + crossVerification.flags.filter(f => f.startsWith('⚠️')).join('; ');
      } else if (crossVerification.flags.length > 0) {
        result.summary += ' | Cross-check: ' + crossVerification.flags[0];
      }

      // Try Azure OpenAI for deeper analysis (if configured)
      try {
        const userRow = await pool.request()
          .input('user_id', sql.Int, userId)
          .query('SELECT name, email, department, joining_date FROM users WHERE id = @user_id');

        if (userRow.recordset.length > 0) {
          const openAIResult = await crossVerifyWithOpenAI(
            result.extractedText || '',
            userRow.recordset[0],
            docType
          );

          if (openAIResult) {
            result.openaiAnalysis = openAIResult;
            if (!openAIResult.verified && result.status === 'valid') {
              result.status = 'flagged';
              result.summary += ' | AI Review: ' + (openAIResult.flags || []).join('; ');
            }
          }
        }
      } catch (openaiErr) {
        console.log('[AI] OpenAI cross-verify skipped:', openaiErr.message);
      }
    }
  } catch (cvErr) {
    console.error('[AI] Cross-verification error (non-fatal):', cvErr.message);
  }

  // Step 3: Map final AI status to a document status
  let dbStatus;
  if (result.status === 'valid') {
    dbStatus = 'verified';
  } else if (result.status === 'flagged') {
    dbStatus = 'flagged';
  } else {
    // If the file is unreadable/error, reset to 'pending' as requested
    dbStatus = 'pending';
  }

  // Step 4: Update the database with all results
  try {
    const pool = await getPool();
    const summaryWithCV = crossVerification
      ? JSON.stringify({
          aiSummary: result.summary,
          crossVerification: {
            verified: crossVerification.verified,
            confidence: crossVerification.confidence,
            flags: crossVerification.flags,
            details: crossVerification.details
          }
        })
      : result.summary;

    await pool.request()
      .input('id', sql.Int, docId)
      .input('status', sql.NVarChar, dbStatus)
      .input('ai_status', sql.NVarChar, result.status)
      .input('ai_summary', sql.NVarChar, summaryWithCV)
      .query(`
        UPDATE documents 
        SET status = @status, 
            ai_validation_status = @ai_status,
            ai_summary = @ai_summary,
            validated_at = GETDATE()
        WHERE id = @id
      `);

    console.log(`[AI] Document ${docId} updated: status=${dbStatus}, ai=${result.status}, confidence=${result.confidence}, source=${result.source}`);
  } catch (dbErr) {
    console.error(`[AI] Failed to update DB for doc ${docId}:`, dbErr.message);
  }

  return result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { processDocumentWithAI, analyzeDocument };

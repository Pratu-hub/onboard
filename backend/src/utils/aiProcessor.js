const DocumentIntelligence = require('@azure-rest/ai-document-intelligence').default;
const { AzureKeyCredential } = require('@azure/core-auth');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getPool, sql } = require('../db/init');

const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

/**
 * Validation Logic for each document type.
 */
const DOCUMENT_VALIDATORS = {
  government_id: (text) => {
    const findings = [];
    const missing = [];
    
    // Identifier patterns
    const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/;
    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/;
    const passportRegex = /\b[A-Z][0-9]{7}\b/;
    const dobRegex = /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/;

    const isAadhaar = aadhaarRegex.test(text);
    const isPAN = panRegex.test(text);
    const isPassport = passportRegex.test(text);
    const hasDOB = dobRegex.test(text);
    
    if (isAadhaar) findings.push("Aadhaar Number");
    if (isPAN) findings.push("PAN Number");
    if (isPassport) findings.push("Passport Number");
    if (hasDOB) findings.push("Date of Birth");

    // Keywords
    const keywords = ['government', 'identity', 'india', 'card', 'license', 'election', 'address'];
    const matchedKeywords = keywords.filter(kw => text.includes(kw));

    if (findings.length === 0 && matchedKeywords.length === 0) {
      return { status: 'flagged', summary: '⚠️ No valid ID patterns (Aadhaar/PAN/Passport) or government keywords found.' };
    }

    if (findings.length === 0) {
      return { status: 'flagged', summary: '⚠️ Government keywords found but no specific ID number (Aadhaar/PAN/License) detected.' };
    }

    return { 
      status: 'valid', 
      summary: `✅ Valid Government ID. Detected: ${findings.join(', ')}.`,
      extractedFields: { typeFound: findings[0], hasDOB }
    };
  },

  education_cert: (text) => {
    const requiredKws = ['university', 'degree', 'certificate', 'awarded'];
    const optionalKws = ['bachelor', 'technology', 'science', 'arts', 'master', 'cgpa', 'marks', 'provisional', 'examination'];
    
    const matchedRequired = requiredKws.filter(kw => text.includes(kw));
    const matchedOptional = optionalKws.filter(kw => text.includes(kw));

    if (matchedRequired.length < 1 && matchedOptional.length < 2) {
      return { status: 'flagged', summary: '⚠️ Does not appear to be an educational certificate (missing keywords like University/Degree/CGPA).' };
    }

    const hasCGPA = text.includes('cgpa') || text.includes('marks') || text.includes('percentage');
    
    return { 
      status: 'valid', 
      summary: `✅ Education Certificate verified. ${hasCGPA ? 'CGPA/Marks detected.' : 'Academic record found.'} Key terms: ${matchedOptional.slice(0, 3).join(', ')}.`,
      extractedFields: { hasCGPA, terms: matchedOptional }
    };
  },

  nda: (text) => {
    const headerKws = ['non-disclosure', 'confidentiality', 'agreement'];
    const clauseKws = ['party', 'parties', 'effective date', 'term', 'duration', 'disclosure', 'signed', 'signature'];
    
    const hasHeader = headerKws.some(kw => text.includes(kw));
    const matchedClauses = clauseKws.filter(kw => text.includes(kw));

    if (!hasHeader) {
      return { status: 'flagged', summary: '⚠️ Document title "Non-Disclosure" or "Confidentiality Agreement" not found.' };
    }

    if (matchedClauses.length < 4) {
      return { status: 'flagged', summary: `⚠️ Found NDA header, but missing critical clauses (Found: ${matchedClauses.join(', ')}).` };
    }

    return { 
      status: 'valid', 
      summary: '✅ NDA structure verified. Critical legal clauses and signature sections detected.',
      extractedFields: { clauses: matchedClauses }
    };
  },

  bank_details: (text) => {
    const ifscRegex = /[A-Z]{4}0[A-Z0-9]{6}/;
    const accountRegex = /\b\d{9,18}\b/;
    const bankKws = ['bank', 'account', 'ifsc', 'branch', 'savings', 'current'];

    const hasIFSC = ifscRegex.test(text.toUpperCase());
    const hasAccount = accountRegex.test(text);
    const matchedKws = bankKws.filter(kw => text.includes(kw));

    if (!hasIFSC && !hasAccount) {
      return { status: 'flagged', summary: '⚠️ Could not detect Bank Account Number or IFSC Code format.' };
    }

    if (!hasIFSC) return { status: 'flagged', summary: '⚠️ Account number found, but missing valid IFSC code format (e.g. SBIN0001234).' };
    if (!hasAccount) return { status: 'flagged', summary: '⚠️ IFSC found, but no clear 9-18 digit account number detected.' };

    return { 
      status: 'valid', 
      summary: '✅ Bank details verified. Account number and IFSC code patterns detected.',
      extractedFields: { hasIFSC, hasAccount }
    };
  },

  offer_letter: (text) => {
    const requiredGroups = [
      { name: 'Header', kws: ['offer', 'appointment', 'employment'] },
      { name: 'Details', kws: ['salary', 'ctc', 'compensation', 'package', 'remuneration'] },
      { name: 'Role', kws: ['designation', 'position', 'role', 'title'] },
      { name: 'Joining', kws: ['joining date', 'start date', 'date of joining'] }
    ];

    const findings = requiredGroups.filter(g => g.kws.some(kw => text.includes(kw)));
    const missing = requiredGroups.filter(g => !g.kws.some(kw => text.includes(kw))).map(g => g.name);

    if (findings.length < 2) {
      return { status: 'flagged', summary: '⚠️ Not recognized as an Offer Letter. Missing basic employment terms.' };
    }

    if (missing.length > 0) {
      return { status: 'flagged', summary: `⚠️ Offer Letter missing critical sections: ${missing.join(', ')}.` };
    }

    return { 
      status: 'valid', 
      summary: '✅ Offer Letter verified. Role, Salary, and Joining details are all present.',
      extractedFields: { sectionsFound: findings.map(f => f.name) }
    };
  }
};

/**
 * Analyzes a document using Azure Document Intelligence and validates
 * its content against keyword rules.
 *
 * @param {string} documentUrl - A publicly accessible (signed) URL to the document.
 * @param {string} docType - The expected document type (e.g. 'offer_letter', 'gov_id').
 * @returns {Object} - { status, summary, extractedFields, confidence }
 */
async function analyzeDocument(documentUrl, docType) {
  if (!endpoint || !key) {
    return {
      status: 'error',
      summary: 'Azure Document Intelligence credentials not configured.',
      extractedFields: {}
    };
  }

  try {
    const client = DocumentIntelligence(endpoint, new AzureKeyCredential(key));

    console.log(`[AI] Starting analysis for doc type: ${docType}`);
    console.log(`[AI] Document URL: ${documentUrl.substring(0, 80)}...`);

    // Start the analysis using the prebuilt-layout model
    const initialResponse = await client
      .path('/documentModels/{modelId}:analyze', 'prebuilt-layout')
      .post({
        contentType: 'application/json',
        body: { urlSource: documentUrl }
      });

    // The analyze endpoint returns a 202 with an Operation-Location header
    const operationUrl = initialResponse.headers['operation-location'];
    
    if (!operationUrl) {
      console.error('[AI] No operation-location header returned. Response status:', initialResponse.status);
      console.error('[AI] Response body:', JSON.stringify(initialResponse.body));
      return {
        status: 'error',
        summary: `Analysis failed to start. Status: ${initialResponse.status}`,
        extractedFields: {}
      };
    }

    // Poll for completion
    let result;
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60 seconds max wait
    
    while (attempts < maxAttempts) {
      await sleep(2000);
      attempts++;
      
      const pollResponse = await client.pathUnchecked(operationUrl).get();
      const pollBody = pollResponse.body;
      
      if (pollBody.status === 'succeeded') {
        result = pollBody.analyzeResult;
        break;
      } else if (pollBody.status === 'failed') {
        console.error('[AI] Analysis failed:', JSON.stringify(pollBody.error || {}));
        return {
          status: 'error',
          summary: `Document analysis failed: ${pollBody.error?.message || 'Unknown error'}`,
          extractedFields: {}
        };
      }
      // else 'running' — keep polling
      console.log(`[AI] Polling attempt ${attempts}... status: ${pollBody.status}`);
    }

    if (!result) {
      return {
        status: 'error',
        summary: 'Document analysis timed out.',
        extractedFields: {}
      };
    }

    // Extract all text content from the result
    const extractedContent = (result.content || '').toLowerCase();
    const pageCount = result.pages ? result.pages.length : 0;

    console.log(`[AI] Extracted ${extractedContent.length} chars from ${pageCount} page(s)`);

    // Call specialized validator
    const validator = DOCUMENT_VALIDATORS[docType];
    
    if (!validator) {
      return {
        status: 'valid',
        summary: `Document analyzed successfully. No specific validation logic for type "${docType}". ${pageCount} page(s) processed.`,
        extractedFields: { pageCount, charCount: extractedContent.length }
      };
    }

    const validationResult = validator(extractedContent);
    
    // Add page metadata
    validationResult.summary += ` (Pages: ${pageCount})`;
    validationResult.extractedFields = {
      ...validationResult.extractedFields,
      pageCount,
      charCount: extractedContent.length
    };

    return validationResult;

  } catch (err) {
    console.error('[AI] Analysis error:', err.message || err);
    return {
      status: 'error',
      summary: `Analysis error: ${err.message}`,
      extractedFields: {}
    };
  }
}

/**
 * Processes a document record: analyzes the file via Azure Doc Intelligence,
 * then updates the database with the results.
 *
 * @param {number} docId - The document row ID in the database.
 * @param {string} blobUrl - A signed URL to read the document.
 * @param {string} docType - The expected document type.
 */
async function processDocumentWithAI(docId, blobUrl, docType) {
  console.log(`[AI] Processing document ID ${docId}, type: ${docType}`);

  const result = await analyzeDocument(blobUrl, docType);

  // Map AI status to a document status
  let dbStatus;
  if (result.status === 'valid') {
    dbStatus = 'verified';
  } else if (result.status === 'flagged') {
    dbStatus = 'flagged'; 
  } else {
    // If the file is unreadable/error, reset to 'pending' as requested
    dbStatus = 'pending'; 
  }

  try {
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.Int, docId)
      .input('status', sql.NVarChar, dbStatus)
      .input('ai_status', sql.NVarChar, result.status)
      .input('ai_summary', sql.NVarChar, result.summary)
      .query(`
        UPDATE documents 
        SET status = @status, 
            ai_validation_status = @ai_status,
            ai_summary = @ai_summary,
            validated_at = GETDATE()
        WHERE id = @id
      `);

    console.log(`[AI] Document ${docId} updated: status=${dbStatus}, ai_status=${result.status}`);
  } catch (dbErr) {
    console.error(`[AI] Failed to update DB for doc ${docId}:`, dbErr.message);
  }

  return result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { processDocumentWithAI, analyzeDocument };

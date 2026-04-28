/**
 * Cross-Verification Module
 * 
 * Compares data extracted from uploaded documents against the user's
 * profile stored in the database. This catches mismatches like:
 *   - Name on document doesn't match registered name
 *   - Joining date on offer letter doesn't match profile
 *   - Document appears to belong to someone else
 * 
 * Uses Azure OpenAI (GPT-4o) when configured, otherwise falls back
 * to deterministic string-matching heuristics.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getPool, sql } = require('../db/init');

// Azure OpenAI config (optional)
const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openaiKey = process.env.AZURE_OPENAI_KEY;
const openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

/**
 * Normalize a name for fuzzy comparison.
 * Strips whitespace, lowercases, removes titles and punctuation.
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|prof|shri|smt)\.?\b/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two names are a reasonable match.
 * Handles partial matches (first name only, reordered names, etc.)
 */
function namesMatch(docName, profileName) {
  const normDoc = normalizeName(docName);
  const normProfile = normalizeName(profileName);

  if (!normDoc || !normProfile) return { match: false, confidence: 0 };

  // Exact match
  if (normDoc === normProfile) return { match: true, confidence: 1.0 };

  // One contains the other (e.g. "Prathyush" vs "Prathyush Reddy")
  if (normDoc.includes(normProfile) || normProfile.includes(normDoc)) {
    return { match: true, confidence: 0.85 };
  }

  // Token overlap (handles reordered names)
  const docTokens = normDoc.split(' ');
  const profileTokens = normProfile.split(' ');
  const overlap = docTokens.filter(t => profileTokens.includes(t));
  const overlapRatio = overlap.length / Math.max(docTokens.length, profileTokens.length);

  if (overlapRatio >= 0.5) {
    return { match: true, confidence: 0.7 };
  }

  return { match: false, confidence: overlapRatio };
}

/**
 * Extract a probable name from OCR text using common patterns.
 */
function extractNameFromText(text) {
  const patterns = [
    /name\s*[:]\s*([a-z\s.]+)/i,
    /holder\s*[:]\s*([a-z\s.]+)/i,
    /issued\s+to\s*[:]\s*([a-z\s.]+)/i,
    /this\s+is\s+to\s+certify\s+that\s+([a-z\s.]+)/i,
    /dear\s+([a-z\s.]+),/i,
    /employee\s+name\s*[:]\s*([a-z\s.]+)/i,
    /candidate\s+name\s*[:]\s*([a-z\s.]+)/i,
    /mr\.?\s+([a-z\s]+)/i,
    /mrs\.?\s+([a-z\s]+)/i,
    /ms\.?\s+([a-z\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      // Clean up: take first 4 words max (avoids grabbing trailing sentence)
      const cleaned = match[1].trim().split(/\s+/).slice(0, 4).join(' ');
      return cleaned;
    }
  }
  return null;
}

/**
 * Extract a date from OCR text (DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD).
 */
function extractDatesFromText(text) {
  const datePatterns = [
    /joining\s+date\s*[:]\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /date\s+of\s+joining\s*[:]\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /start\s+date\s*[:]\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /effective\s+date\s*[:]\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
  ];

  const dates = [];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      dates.push({ label: pattern.source.split('\\s')[0], value: match[1] });
    }
  }
  return dates;
}

/**
 * Cross-verify extracted document text against user profile in the database.
 * 
 * @param {number} userId - The user ID who uploaded the document.
 * @param {string} extractedText - Lowercased OCR text from Document Intelligence.
 * @param {string} docType - The document type (e.g. 'offer_letter', 'government_id').
 * @returns {Object} - { verified, flags[], confidence, details }
 */
async function crossVerifyWithProfile(userId, extractedText, docType) {
  const result = {
    verified: true,
    flags: [],
    confidence: 0,
    details: {}
  };

  try {
    // Fetch user profile from database
    const pool = await getPool();
    const userResult = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT name, email, department, joining_date, manager_name FROM users WHERE id = @user_id');

    if (userResult.recordset.length === 0) {
      result.flags.push('User profile not found in database — cannot cross-verify.');
      result.verified = false;
      return result;
    }

    const user = userResult.recordset[0];
    console.log(`[CROSS-VERIFY] Checking doc type "${docType}" for user "${user.name}"`);

    // --- Name Cross-Verification ---
    const extractedName = extractNameFromText(extractedText);
    if (extractedName) {
      const nameCheck = namesMatch(extractedName, user.name);
      result.details.extractedName = extractedName;
      result.details.profileName = user.name;
      result.details.nameConfidence = nameCheck.confidence;

      if (!nameCheck.match) {
        result.flags.push(
          `⚠️ Name mismatch: Document says "${extractedName}" but profile says "${user.name}".`
        );
        result.verified = false;
      } else if (nameCheck.confidence < 0.9) {
        result.flags.push(
          `ℹ️ Partial name match (${Math.round(nameCheck.confidence * 100)}%): "${extractedName}" vs "${user.name}".`
        );
      }
      result.confidence = nameCheck.confidence;
    } else {
      result.details.extractedName = null;
      result.flags.push('ℹ️ Could not extract a name from the document for cross-verification.');
      result.confidence = 0.5; // Uncertain
    }

    // --- Document-Type-Specific Checks ---
    if (docType === 'offer_letter') {
      // Check joining date
      const dates = extractDatesFromText(extractedText);
      if (dates.length > 0 && user.joining_date) {
        result.details.extractedDates = dates.map(d => d.value);
        result.details.profileJoiningDate = user.joining_date;
      }

      // Check for company/org name (basic)
      const orgKeywords = ['onboardiq', 'private limited', 'pvt ltd', 'corporation', 'inc', 'llp'];
      const hasOrgName = orgKeywords.some(kw => extractedText.includes(kw));
      if (!hasOrgName) {
        result.flags.push('ℹ️ No recognizable company name found in offer letter.');
      }
    }

    if (docType === 'government_id') {
      // Check if the email domain or department appears (unlikely on gov ID, but worth checking)
      if (user.name && !extractedText.includes(user.name.split(' ')[0].toLowerCase())) {
        result.flags.push(
          `⚠️ First name "${user.name.split(' ')[0]}" not found anywhere in the government ID text.`
        );
        result.verified = false;
      }
    }

    if (docType === 'nda') {
      // Check for user's name in the agreement
      if (user.name) {
        const firstName = user.name.split(' ')[0].toLowerCase();
        if (!extractedText.includes(firstName)) {
          result.flags.push(`⚠️ Signee name "${user.name}" not found in NDA text.`);
        }
      }
    }

    // If no flags were raised, mark high confidence
    if (result.flags.length === 0) {
      result.confidence = Math.max(result.confidence, 0.9);
      result.flags.push('✅ All cross-verification checks passed.');
    }

    console.log(`[CROSS-VERIFY] Result: verified=${result.verified}, flags=${result.flags.length}, confidence=${result.confidence}`);

  } catch (err) {
    console.error('[CROSS-VERIFY] Error:', err.message);
    result.flags.push(`Cross-verification error: ${err.message}`);
    result.confidence = 0;
  }

  return result;
}

/**
 * Use Azure OpenAI (GPT-4o) for deeper semantic cross-verification.
 * This is called ONLY when AZURE_OPENAI_ENDPOINT is configured.
 * 
 * @param {string} extractedText - OCR text from the document.
 * @param {Object} userProfile - { name, email, department, joining_date }
 * @param {string} docType - The document type.
 * @returns {Object|null} - AI analysis result, or null if unavailable.
 */
async function crossVerifyWithOpenAI(extractedText, userProfile, docType) {
  if (!openaiEndpoint || !openaiKey) {
    console.log('[CROSS-VERIFY] Azure OpenAI not configured — skipping AI cross-verification.');
    return null;
  }

  try {
    const { AzureOpenAI } = require('openai');

    const client = new AzureOpenAI({
      endpoint: openaiEndpoint,
      apiKey: openaiKey,
      apiVersion: '2024-08-01-preview',
      deployment: openaiDeployment,
    });

    const prompt = `You are a document verification assistant for an employee onboarding system.

TASK: Cross-verify the following document text against the employee's profile. Flag any mismatches or concerns.

EMPLOYEE PROFILE:
- Name: ${userProfile.name}
- Email: ${userProfile.email}
- Department: ${userProfile.department || 'Not specified'}
- Joining Date: ${userProfile.joining_date || 'Not specified'}

DOCUMENT TYPE: ${docType}

EXTRACTED DOCUMENT TEXT (first 2000 chars):
${extractedText.substring(0, 2000)}

Respond in JSON format:
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "flags": ["list of concerns or confirmations"],
  "extractedFields": { "name": "...", "dates": [...], "keyInfo": "..." }
}`;

    const response = await client.chat.completions.create({
      model: openaiDeployment,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      console.log('[CROSS-VERIFY] OpenAI response:', JSON.stringify(parsed).substring(0, 200));
      return parsed;
    }
  } catch (err) {
    console.error('[CROSS-VERIFY] OpenAI error (non-fatal):', err.message);
  }

  return null;
}

module.exports = {
  crossVerifyWithProfile,
  crossVerifyWithOpenAI,
  namesMatch,
  normalizeName,
  extractNameFromText,
};

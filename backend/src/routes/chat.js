const express = require('express');
const router = express.Router();
const { AzureOpenAI } = require('openai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { authenticate } = require('../middleware/auth');
const { COMPANY_HANDBOOK } = require('../utils/companyHandbook');

// === Azure OpenAI Config (reuses existing credentials) ===
const aoaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const aoaiKey = process.env.AZURE_OPENAI_KEY;
const aoaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

/**
 * System prompt for the HR Copilot.
 * Strict safety rails prevent hallucination and off-topic answers.
 */
const COPILOT_SYSTEM_PROMPT = `You are the OnboardIQ HR Copilot — a friendly, professional AI assistant for newly onboarded employees.

RULES (follow strictly):
1. Answer questions using ONLY the Company Handbook text provided below.
2. If the answer is NOT in the handbook, say: "I don't have that information in the handbook. Please contact HR directly at hr@onboardiq.com for assistance."
3. Keep answers concise (2-4 sentences max) and conversational.
4. Never make up policies, numbers, or contact details.
5. Never discuss salary, compensation negotiations, or confidential HR matters.
6. If the user asks something unrelated to work (e.g., jokes, coding), politely redirect: "I'm here to help with company policies and onboarding questions! What would you like to know?"

COMPANY HANDBOOK:
${COMPANY_HANDBOOK}`;

// Simple in-memory rate limiter: { userId: { count, resetTime } }
const rateLimits = new Map();
const MAX_MESSAGES_PER_HOUR = 30;

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + 3600000 }); // 1 hour window
    return true;
  }

  if (userLimit.count >= MAX_MESSAGES_PER_HOUR) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * POST /api/chat
 * Sends a user message to Azure OpenAI with the company handbook context.
 *
 * Body: { message: string }
 * Response: { reply: string }
 */
router.post('/', authenticate, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long. Please keep it under 500 characters.' });
  }

  // Rate limit check
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({
      error: 'You have reached the message limit. Please try again later.',
      reply: 'You\'ve sent a lot of messages! To keep things running smoothly, please wait a bit before sending more. If you need urgent help, contact hr@onboardiq.com.'
    });
  }

  // Check if Azure OpenAI is configured
  if (!aoaiEndpoint || !aoaiKey) {
    console.warn('[Copilot] Azure OpenAI not configured. Returning fallback.');
    return res.json({
      reply: 'The AI assistant is currently being set up. In the meantime, please contact HR at hr@onboardiq.com or IT at it-support@onboardiq.com for help.',
      source: 'fallback'
    });
  }

  try {
    const client = new AzureOpenAI({
      endpoint: aoaiEndpoint,
      apiKey: aoaiKey,
      apiVersion: '2024-08-01-preview',
      deployment: aoaiDeployment
    });

    console.log(`[Copilot] User ${req.user.id} asked: "${message.substring(0, 80)}..."`);

    const response = await client.chat.completions.create({
      model: aoaiDeployment,
      messages: [
        { role: 'system', content: COPILOT_SYSTEM_PROMPT },
        { role: 'user', content: message.trim() }
      ],
      max_tokens: 200,
      temperature: 0.3, // Slightly creative but still grounded
    });

    const usage = response.usage;
    console.log(`[Copilot] Tokens — prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens}, total: ${usage?.total_tokens}`);

    const reply = response.choices[0]?.message?.content?.trim();

    if (!reply) {
      return res.json({
        reply: 'I wasn\'t able to process that. Could you try rephrasing your question?',
        source: 'empty_response'
      });
    }

    res.json({ reply, source: 'openai' });

  } catch (err) {
    console.error('[Copilot] Azure OpenAI error:', err.message);
    res.json({
      reply: 'I\'m having a little trouble right now. Please try again in a moment, or reach out to HR at hr@onboardiq.com.',
      source: 'error'
    });
  }
});

module.exports = router;

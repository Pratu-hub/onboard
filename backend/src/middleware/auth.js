const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Azure AD B2C / CIAM Configuration
const B2C_TENANT = process.env.B2C_TENANT; // e.g., 'onboardiq' or 'onboardiq.onmicrosoft.com'
const B2C_POLICY = process.env.B2C_POLICY || 'B2C_1_susi';
const B2C_CLIENT_ID = process.env.B2C_CLIENT_ID;

// For CIAM (Microsoft Entra External ID), the URL structure is usually:
// https://<tenant-name>.ciamlogin.com/<tenant-id>/discovery/v2.0/keys
// For classic B2C, it is:
// https://<tenant-name>.b2clogin.com/<tenant-name>.onmicrosoft.com/<policy>/discovery/v2.0/keys

const isCIAM = process.env.AUTH_TYPE === 'CIAM' || !B2C_POLICY.startsWith('B2C_1_');

const jwksUri = isCIAM 
  ? `https://${B2C_TENANT}.ciamlogin.com/${B2C_TENANT}.onmicrosoft.com/discovery/v2.0/keys`
  : `https://${B2C_TENANT}.b2clogin.com/${B2C_TENANT}.onmicrosoft.com/${B2C_POLICY}/discovery/v2.0/keys`;

const client = jwksClient({
  jwksUri,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Validates an Azure AD B2C / CIAM token.
 */
function validateB2CToken(idToken) {
  return new Promise((resolve, reject) => {
    const issuer = isCIAM
      ? `https://${B2C_TENANT}.ciamlogin.com/${B2C_TENANT}.onmicrosoft.com/v2.0`
      : `https://${B2C_TENANT}.b2clogin.com/${B2C_TENANT}.onmicrosoft.com/${B2C_POLICY}/v2.0/`;

    jwt.verify(
      idToken,
      getSigningKey,
      {
        audience: B2C_CLIENT_ID,
        issuer: issuer,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}

/**
 * Authentication middleware.
 * Validates the Bearer token from the Authorization header.
 * Now supports direct B2C/CIAM token validation as per Step 6 of the architecture plan.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Try validating as a B2C/CIAM token first (Production Flow)
    if (B2C_TENANT && B2C_CLIENT_ID) {
      try {
        const decoded = await validateB2CToken(token);
        req.user = {
          id: decoded.oid || decoded.sub,
          email: decoded.emails ? decoded.emails[0] : decoded.email,
          name: decoded.name,
          role: decoded.extension_Role || 'USER', // Example custom claim
        };
        return next();
      } catch (b2cErr) {
        // If B2C validation fails, fallback to local JWT check (for dev/local testing)
        // console.warn('B2C validation failed, trying local JWT:', b2cErr.message);
      }
    }

    // 2. Fallback to local JWT (Dev Flow / Migration)
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Generate a JWT token for a user (Local Dev only).
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticate, generateToken, validateB2CToken };


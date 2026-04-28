const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Azure AD B2C JWKS client (for validating B2C-issued tokens)
const B2C_TENANT = process.env.B2C_TENANT || 'yourtenant';
const B2C_POLICY = process.env.B2C_POLICY || 'B2C_1_susi';
const B2C_CLIENT_ID = process.env.B2C_CLIENT_ID || '';

const jwksUri = `https://${process.env.B2C_DIRECTORY_ID}.ciamlogin.com/${process.env.B2C_DIRECTORY_ID}/discovery/v2.0/keys`;

const client = jwksClient({
  jwksUri,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Validates an Azure AD CIAM (Microsoft Entra External ID) id_token.
 * Returns a promise that resolves to the decoded token payload.
 */
function validateB2CToken(idToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getSigningKey,
      {
        audience: B2C_CLIENT_ID,
        issuer: [
          `https://${process.env.B2C_DIRECTORY_ID}.ciamlogin.com/${process.env.B2C_DIRECTORY_ID}/v2.0`,
          `https://${B2C_TENANT}.ciamlogin.com/${B2C_TENANT}.onmicrosoft.com/v2.0`,
          `https://a0164170-e70e-42fe-98a6-e469d1a73851.ciamlogin.com/a0164170-e70e-42fe-98a6-e469d1a73851/v2.0`
        ],
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
 * Supports our self-signed JWTs (dev login) only.
 * B2C token exchange happens at the /api/auth/b2c endpoint — after that,
 * users carry our own JWT for all subsequent requests.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
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
 * Generate a JWT token for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticate, generateToken, validateB2CToken };

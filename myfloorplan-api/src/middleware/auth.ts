import { Context, Next } from 'hono';

// Simplified Edge-compatible JWT verification.
// In actual implementation, we would use `jose` to verify against Firebase Public JWKs.
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // TODO: Verify Firebase JWT properly here using `jose` or edge-compatible verifier
    // For now, assume format "token_for_<uid>" for local testing
    let userId = 'unverified_user';
    if (token.startsWith('token_for_')) {
      userId = token.replace('token_for_', '');
    }

    c.set('userId', userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid Token' }, 401);
  }
};

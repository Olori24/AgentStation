import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, UserRecord } from './db';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'agentstation-super-secret-key-32b-length!!';
const IV_LENGTH = 16;

// AES-256-GCM encryption for stored API keys and tokens
export function encryptSecret(text: string): string {
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  } catch (err: any) {
    return text;
  }
}

export function decryptSecret(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    const [ivHex, tagHex, contentHex] = parts;
    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}

// In-memory active session tokens map (Token -> User ID)
const activeSessions: Map<string, { userId: string; expiresAt: number }> = new Map();

// Default initial active user
let currentActiveUserId = 'user-bolaji-01';

export function getActiveUser(): UserRecord {
  const user = db.getUserById(currentActiveUserId) || db.getUsers()[0];
  return user;
}

export function setActiveUser(userId: string): UserRecord | null {
  const user = db.getUserById(userId);
  if (user) {
    currentActiveUserId = user.id;
    return user;
  }
  return null;
}

export function issueSessionToken(userId: string): string {
  const token = `as_sess_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  activeSessions.set(token, { userId, expiresAt });
  return token;
}

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = activeSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      const u = db.getUserById(session.userId);
      if (u) {
        req.user = u;
        return next();
      }
    }
  }

  // Fallback to active current user context
  req.user = getActiveUser();
  next();
}

export function requireRole(allowedRoles: Array<'admin' | 'engineer' | 'reviewer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user || getActiveUser();
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${user.role}' lacks permissions. Required one of: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

import { Request, Response, NextFunction } from 'express';
import { loadEnv } from '../utils/env';

const env = loadEnv();

export function basicAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.BASIC_AUTH_USER || !env.BASIC_AUTH_PASS) {
    return next();
  }
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  const base64 = header.substring('Basic '.length);

  console.log(`[BASIC AUTH] ${req.method} ${req.originalUrl} - User: ${env.BASIC_AUTH_USER}`);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const [user, pass] = decoded.split(':');
  if (user === env.BASIC_AUTH_USER && pass === env.BASIC_AUTH_PASS) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid credentials' });
}

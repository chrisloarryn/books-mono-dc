import { Errors as MoleculerErrors } from 'moleculer';

export type BasicAuthEnv = {
  BASIC_AUTH_USER?: string;
  BASIC_AUTH_PASS?: string;
};

// Builds a reusable moleculer-web onBeforeCall hook for HTTP Basic Auth
// If BASIC_AUTH_USER/PASS are not provided, the hook is a no-op (open endpoints)
export function buildBasicAuthHook(env: BasicAuthEnv) {
  return function onBeforeCall(ctx: any, route: any, req: any, res: any) {
    const user = env.BASIC_AUTH_USER;
    const pass = env.BASIC_AUTH_PASS;
    if (!user || !pass) return;

    const header = req?.headers?.['authorization'] || '';
    if (!header || !String(header).startsWith('Basic ')) {
      if (res?.setHeader) res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
      throw new MoleculerErrors.MoleculerError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    const base64 = String(header).substring('Basic '.length);
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [u, p] = decoded.split(':');

    if (!(u === user && p === pass)) {
      throw new MoleculerErrors.MoleculerError('Invalid credentials', 401, 'AUTH_INVALID');
    }
  };
}

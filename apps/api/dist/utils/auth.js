"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBasicAuthHook = buildBasicAuthHook;
const moleculer_1 = require("moleculer");
// Builds a reusable moleculer-web onBeforeCall hook for HTTP Basic Auth
// If BASIC_AUTH_USER/PASS are not provided, the hook is a no-op (open endpoints)
function buildBasicAuthHook(env) {
    return function onBeforeCall(ctx, route, req, res) {
        const user = env.BASIC_AUTH_USER;
        const pass = env.BASIC_AUTH_PASS;
        if (!user || !pass)
            return;
        const header = req?.headers?.['authorization'] || '';
        if (!header || !String(header).startsWith('Basic ')) {
            if (res?.setHeader)
                res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
            throw new moleculer_1.Errors.MoleculerError('Authentication required', 401, 'AUTH_REQUIRED');
        }
        const base64 = String(header).substring('Basic '.length);
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const [u, p] = decoded.split(':');
        if (!(u === user && p === pass)) {
            throw new moleculer_1.Errors.MoleculerError('Invalid credentials', 401, 'AUTH_INVALID');
        }
    };
}

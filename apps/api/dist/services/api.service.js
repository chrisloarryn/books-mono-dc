"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moleculer_web_1 = __importDefault(require("moleculer-web"));
const dotenv_1 = __importDefault(require("dotenv"));
const env_1 = require("../utils/env");
const auth_1 = require("../utils/auth");
dotenv_1.default.config();
const env = (0, env_1.loadEnv)();
const onBeforeCallAuth = (0, auth_1.buildBasicAuthHook)(env);
/**
 * API Gateway service.
 *
 * Exposes HTTP endpoints under "/" and "/api" mapping to Moleculer actions.
 */
const ApiService = {
    name: 'api',
    mixins: [moleculer_web_1.default],
    settings: {
        ip: '0.0.0.0',
        port: env.PORT,
        routes: [
            {
                path: '/',
                aliases: {
                    'GET health': 'health.check',
                },
                bodyParsers: {
                    json: { strict: true, limit: '2mb' },
                    urlencoded: { extended: true, limit: '2mb' },
                },
                cors: {
                    origin: '*',
                    methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders: ['Content-Type', 'Authorization'],
                    exposedHeaders: [],
                    credentials: false,
                    maxAge: 3600,
                },
                onBeforeCall: (ctx, route, req, res) => {
                    // No authentication for health check
                    if (req.url === '/health')
                        return;
                    // Use the basic auth hook for all other routes
                    onBeforeCallAuth(ctx, route, req, res);
                }
            },
            {
                path: '/api',
                aliases: {
                    'GET books/search': 'books.search',
                    'GET books/last-search': 'books.lastSearch',
                    'POST books/my-library': 'books.create',
                    'GET books/my-library': 'books.list',
                    'GET books/my-library/:id': 'books.get',
                    'PUT books/my-library/:id': 'books.update',
                    'DELETE books/my-library/:id': 'books.remove',
                    'GET books/library/front-cover/:id': 'books.frontCover',
                },
                bodyParsers: {
                    json: { strict: true, limit: '2mb' },
                    urlencoded: { extended: true, limit: '2mb' },
                },
                cors: {
                    origin: '*',
                    methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders: ['Content-Type', 'Authorization'],
                    exposedHeaders: [],
                    credentials: false,
                    maxAge: 3600,
                },
                onBeforeCall: onBeforeCallAuth,
            },
        ],
    },
};
exports.default = ApiService;

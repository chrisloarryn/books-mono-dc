"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
function loadEnv() {
    const PORT = Number(process.env.PORT || 3001);
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookreviews';
    const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'demo';
    const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || '123456';
    const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
    return { PORT, MONGO_URI, BASIC_AUTH_USER, BASIC_AUTH_PASS, API_BASE_URL };
}

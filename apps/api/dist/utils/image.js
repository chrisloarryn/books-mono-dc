"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchImageAsBase64 = fetchImageAsBase64;
const axios_1 = __importDefault(require("axios"));
async function fetchImageAsBase64(url) {
    const response = await axios_1.default.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');
    return { base64, mimeType: contentType };
}

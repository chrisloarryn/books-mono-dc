"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBooksRaw = searchBooksRaw;
exports.mapDocsToItems = mapDocsToItems;
const axios_1 = __importDefault(require("axios"));
async function searchBooksRaw(q) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`;
    const { data } = await axios_1.default.get(url, { timeout: 10000 });
    console.log(`[OpenLibrary] Search results for "${q}":`, data?.numFound || 0, 'items');
    return (data?.docs || []).slice(0, 10);
}
function mapDocsToItems(docs) {
    return docs.map((d) => {
        const coverUrl = d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined;
        return {
            workKey: d.key,
            title: d.title,
            authors: Array.isArray(d.author_name) ? d.author_name : [],
            year: d.first_publish_year,
            openLibraryCoverUrl: coverUrl,
        };
    });
}

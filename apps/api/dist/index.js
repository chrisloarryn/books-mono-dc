"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const moleculer_1 = require("moleculer");
const books_service_1 = __importDefault(require("./services/books.service"));
const health_service_1 = __importDefault(require("./services/health.service"));
const api_service_1 = __importDefault(require("./services/api.service"));
const env_1 = require("./utils/env");
// Load environment variables once at bootstrap
dotenv_1.default.config();
const env = (0, env_1.loadEnv)();
/**
 * Bootstrap Moleculer broker and start API services.
 *
 * - Connects to MongoDB using MONGO_URI
 * - Registers feature services (health, books) and API Gateway
 * - Starts the broker listening on configured PORT
 */
async function start() {
    const broker = new moleculer_1.ServiceBroker({
        logger: true,
        logLevel: 'info',
    });
    // Register services
    broker.createService(health_service_1.default);
    broker.createService(books_service_1.default);
    broker.createService(api_service_1.default);
    try {
        await mongoose_1.default.connect(env.MONGO_URI);
        broker.logger.info('[API] Connected to MongoDB');
        await broker.start();
        broker.logger.info(`[API] Moleculer listening on http://0.0.0.0:${env.PORT}`);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to start API', err);
        process.exit(1);
    }
}
start();

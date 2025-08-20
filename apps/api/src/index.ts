import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ServiceBroker } from 'moleculer';
import BooksService from './services/books.service';
import HealthService from './services/health.service';
import ApiService from './services/api.service';
import { loadEnv } from './utils/env';

// Load environment variables once at bootstrap
dotenv.config();
const env = loadEnv();

/**
 * Bootstrap Moleculer broker and start API services.
 *
 * - Connects to MongoDB using MONGO_URI
 * - Registers feature services (health, books) and API Gateway
 * - Starts the broker listening on configured PORT
 */
async function start(): Promise<void> {
  const broker = new ServiceBroker({
    logger: true,
    logLevel: 'info',
  });

  // Register services
  broker.createService(HealthService as any);
  broker.createService(BooksService as any);
  broker.createService(ApiService as any);

  try {
    await mongoose.connect(env.MONGO_URI);
    broker.logger.info('[API] Connected to MongoDB');

    await broker.start();
    broker.logger.info(`[API] Moleculer listening on http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start API', err);
    process.exit(1);
  }
}

start();

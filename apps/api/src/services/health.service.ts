/**
 * Health service.
 *
 * Provides a simple liveness endpoint.
 */
const HealthService = {
  name: 'health',
  actions: {
    /**
     * Returns service liveness info.
     */
    check() {
      return { status: 'ok', time: new Date().toISOString() };
    },
  },
};

export default HealthService;

/**
 * Lightweight API composable with Basic Auth support using Nuxt runtimeConfig.
 *
 * Reads server-only apiBase on server and public apiBase on client.
 */
export function useApi() {
  const config = useRuntimeConfig();
  const base: string = process.server ? config.apiBase : config.public.apiBase;
  const user: string = config.public.basicAuthUser || '';
  const pass: string = config.public.basicAuthPass || '';

  function authHeader(): Record<string, string> {
    if (!user || !pass) return {};
    const raw = `${user}:${pass}`;
    const token = typeof btoa === 'function' ? btoa(raw) : Buffer.from(raw, 'utf-8').toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
    headers?: Record<string, string>;
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
  }

  /**
   * Fetches an API endpoint relative to configured base URL.
   *
   * Example:
   * const { apiFetch } = useApi();
   * const data = await apiFetch<User>('/users/1');
   */
  async function apiFetch<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...(opts.headers || {}), ...authHeader() };
    return await $fetch<T>(`${base}${path}`, { ...opts, headers });
  }

  return { apiFetch };
}

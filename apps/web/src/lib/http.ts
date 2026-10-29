import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _retryAfterRefreshFailure?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export const http = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config) => {
  config.headers.set('X-Timezone', getTimezone());
  return config;
});

function shouldSkipRefresh(url?: string): boolean {
  if (!url) {
    return false;
  }
  return (
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/register') ||
    url.includes('/api/v1/auth/refresh') ||
    url.includes('/api/v1/auth/logout')
  );
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = http
      .post('/api/v1/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  await refreshPromise;
}

function shouldSkipLoginRedirect(url?: string): boolean {
  // /auth/me is used for session bootstrap; anonymous visitors must stay on public pages like /sheet.
  return Boolean(url?.includes('/api/v1/auth/me'));
}

function redirectToLogin(): void {
  const path = window.location.pathname;
  if (path === '/login' || path === '/register' || path === '/401') {
    return;
  }
  const next = `${path}${window.location.search}`;
  window.location.assign(`/login?from=${encodeURIComponent(next)}`);
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (!config || status !== 401 || shouldSkipRefresh(config.url)) {
      return Promise.reject(error);
    }

    if (!config._retry) {
      config._retry = true;
      try {
        await refreshSession();
        return http.request(config);
      } catch {
        // Another tab may have already rotated the refresh cookie (R5).
        if (!config._retryAfterRefreshFailure) {
          config._retryAfterRefreshFailure = true;
          try {
            return await http.request(config);
          } catch (retryError) {
            if (!shouldSkipLoginRedirect(config.url)) {
              redirectToLogin();
            }
            return Promise.reject(retryError);
          }
        }
        if (!shouldSkipLoginRedirect(config.url)) {
          redirectToLogin();
        }
        return Promise.reject(error);
      }
    }

    if (!shouldSkipLoginRedirect(config.url)) {
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

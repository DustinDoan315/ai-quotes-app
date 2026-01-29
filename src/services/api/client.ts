import { APIError, NetworkError, TimeoutError } from './errors';

const GPT_API_URL = process.env.EXPO_PUBLIC_GPT_API_URL || "";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
const TIMEOUT = 10000;

const getBaseUrl = (endpoint: string): string => {
  if (endpoint.startsWith("/ai/")) {
    return GPT_API_URL;
  }
  return API_URL;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
};

const createTimeoutPromise = (timeout: number) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError()), timeout);
  });
};

const fetchWithTimeout = async (
  url: string,
  options: RequestOptions,
): Promise<Response> => {
  const timeout = options.timeout || TIMEOUT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await Promise.race([
      fetch(url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      }),
      createTimeoutPromise(timeout),
    ]);

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof TimeoutError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError();
    }
    throw new NetworkError(
      error instanceof Error ? error.message : "Network error",
    );
  }
};

const safeRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 1,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (
      retries > 0 &&
      (error instanceof NetworkError || error instanceof TimeoutError)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return safeRetry(fn, retries - 1);
    }
    throw error;
  }
};

export const apiClient = {
  get: async <T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> => {
    return safeRetry(async () => {
      const baseUrl = getBaseUrl(endpoint);
      const url = `${baseUrl}${endpoint}`;
      const response = await fetchWithTimeout(url, {
        ...options,
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code,
        );
      }

      return response.json();
    });
  },

  post: async <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method">,
  ): Promise<T> => {
    const baseUrl = getBaseUrl(endpoint);
    const url = `${baseUrl}${endpoint}`;
    const response = await fetchWithTimeout(url, {
      ...options,
      method: "POST",
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code,
      );
    }

    return response.json();
  },
};

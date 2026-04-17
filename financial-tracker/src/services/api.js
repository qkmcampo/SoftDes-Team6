const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/$/,
  "",
);
const responseCache = new Map();
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function cloneData(data) {
  if (data == null) {
    return data;
  }

  return JSON.parse(JSON.stringify(data));
}

function getCacheKey(endpoint, method) {
  return `${method}:${endpoint}`;
}

function clearResponseCache() {
  responseCache.clear();
}

async function request(endpoint, options = {}) {
  const {
    cacheTTL = 0,
    skipCache = false,
    headers = {},
    method = "GET",
    ...fetchOptions
  } = options;

  const normalizedMethod = method.toUpperCase();
  const cacheKey = getCacheKey(endpoint, normalizedMethod);

  if (normalizedMethod === "GET" && cacheTTL > 0 && !skipCache) {
    const cachedEntry = responseCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < cacheTTL) {
      return cloneData(cachedEntry.data);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: normalizedMethod,
      headers: { "Content-Type": "application/json", ...headers },
      ...fetchOptions,
    });

    const rawText = await response.text();
    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    }

    if (!response.ok) {
      const message =
        (typeof data === "object" && data?.error) ||
        (typeof data === "object" && data?.message) ||
        "Something went wrong";
      const error = new Error(message);
      error.data = typeof data === "object" ? data : null;
      error.status = response.status;
      throw error;
    }

    if (normalizedMethod === "GET" && cacheTTL > 0) {
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: cloneData(data),
      });
    } else if (normalizedMethod !== "GET") {
      clearResponseCache();
    }

    return data;
  } catch (error) {
    if (
      normalizedMethod === "GET" &&
      !fetchOptions.__retried &&
      (!("status" in error) || RETRYABLE_STATUS_CODES.has(error.status))
    ) {
      await wait(500);
      return request(endpoint, {
        ...options,
        __retried: true,
      });
    }

    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const transactionsAPI = {
  getAll: (page = 1, limit = 8, options = {}) =>
    request(`/transactions?page=${page}&limit=${limit}`, {
      cacheTTL: 10000,
      ...options,
    }),

  getBalance: (options = {}) =>
    request("/transactions/balance", {
      cacheTTL: 12000,
      ...options,
    }),

  add: (data) =>
    request("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/transactions/${id}`, {
      method: "DELETE",
    }),
};

export const storageAPI = {
  getAll: (options = {}) =>
    request("/storage", {
      cacheTTL: 15000,
      ...options,
    }),

  add: (data) =>
    request("/storage", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStock: (id, current_stock) =>
    request(`/storage/${id}`, {
      method: "PUT",
      body: JSON.stringify({ current_stock }),
    }),
};

export const salesAPI = {
  getAll: (options = {}) =>
    request("/sales", {
      cacheTTL: 15000,
      ...options,
    }),

  getSummary: (options = {}) =>
    request("/sales/summary", {
      cacheTTL: 15000,
      ...options,
    }),

  add: (data) =>
    request("/sales", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const forecastAPI = {
  getForecast: (options = {}) =>
    request("/forecast", {
      cacheTTL: 30000,
      ...options,
    }),

  getBudget: (options = {}) =>
    request("/forecast/budget", {
      cacheTTL: 30000,
      ...options,
    }),
};

export { clearResponseCache };

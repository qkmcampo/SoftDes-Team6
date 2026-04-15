// Base URL of your Flask backend
const BASE_URL = 'http://localhost:5000/api'

// ── Generic fetch helper ───────────────────────────────────────────────
async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong')
    }

    return data
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message)
    throw error
  }
}

// ── Transactions ───────────────────────────────────────────────────────
export const transactionsAPI = {
  
  // ✅ UPDATED: supports pagination
  getAll: (page = 1, limit = 8) =>
    request(`/transactions?page=${page}&limit=${limit}`),

  getBalance: () =>
    request('/transactions/balance'),

  add: (data) =>
    request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/transactions/${id}`, {
      method: 'DELETE',
    }),
}

// ── Storage / Inventory ────────────────────────────────────────────────
export const storageAPI = {
  getAll: () =>
    request('/storage'),

  add: (data) =>
    request('/storage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStock: (id, current_stock) =>
    request(`/storage/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ current_stock }),
    }),
}

// ── Sales ──────────────────────────────────────────────────────────────
export const salesAPI = {
  getAll: () =>
    request('/sales'),

  getSummary: () =>
    request('/sales/summary'),

  add: (data) =>
    request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Forecast API ──────────────────────────────────────────
export const forecastAPI = {

  // Full forecast + recent sales history (for chart)
  getForecast: () =>
    request('/forecast'),

  // Budget number only
  getBudget: () =>
    request('/forecast/budget'),
}
const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

export const API_BASE_URL = backendUrl
export const API_URL = `${backendUrl}/api`

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      retryDelay: (attempt) => Math.min(2000 * (attempt + 1), 10000),
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

// Ping backend on load so Render free tier wakes up before user needs an API
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080/api'
fetch(`${BACKEND_BASE}/products?size=1`, { method: 'GET', cache: 'no-store' }).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 3, retryDelay: 2000, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

// Ping backend on load so Render free tier wakes up before user hits an API
const BACKEND = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'
fetch(`${BACKEND}/actuator/health`, { method: 'GET', cache: 'no-store' }).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

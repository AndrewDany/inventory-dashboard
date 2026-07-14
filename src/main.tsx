import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' && event.reason?.message?.includes('media resource')) {
    event.preventDefault()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <App />
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
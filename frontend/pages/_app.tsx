import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { ToastProvider } from '../components/ui/toast'

/**
 * Main App Component
 * 
 * Note: This app uses custom OTP authentication, not NextAuth
 * Auth state is managed via the useAuth hook (lib/useAuth.ts)
 */

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider maxToasts={3} defaultDuration={4000} position="top-right">
      <Component {...pageProps} />
    </ToastProvider>
  )
}

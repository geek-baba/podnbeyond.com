import type { AppProps } from 'next/app'
import '../styles/globals.css'

/**
 * Main App Component
 * 
 * Note: This app uses custom OTP authentication, not NextAuth
 * Auth state is managed via the useAuth hook (lib/useAuth.ts)
 */

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

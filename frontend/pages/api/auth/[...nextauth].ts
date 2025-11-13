import NextAuth, { NextAuthOptions } from 'next-auth';

/**
 * NextAuth Configuration (DEPRECATED - kept for backwards compatibility)
 * 
 * The application now uses custom OTP authentication via /api/otp routes
 * This NextAuth config is minimal and not actively used for admin login
 * 
 * Active Authentication: Custom OTP system with pod-session cookies
 * See: backend/routes/otp.js and backend/routes/auth.js
 */

export const authOptions: NextAuthOptions = {
  providers: [
    // No providers configured - using custom OTP auth instead
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      return token;
    },
    async session({ session, token }) {
      return session;
    },
  },
};

export default NextAuth(authOptions);

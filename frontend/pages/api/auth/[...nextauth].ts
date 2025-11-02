import NextAuth, { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@podnbeyond.com',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/login',
    signOut: '/admin/logout',
    error: '/admin/login',
    verifyRequest: '/admin/verify-email',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        
        // Fetch user roles and scopes
        const userWithRoles = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: {
            userRoles: {
              include: {
                role: true
              }
            },
            loyaltyAccount: true
          }
        });

        if (userWithRoles) {
          (session as any).user.roles = userWithRoles.userRoles.map(ur => ({
            key: ur.roleKey,
            scopeType: ur.scopeType,
            scopeId: ur.scopeId,
            permissions: ur.role.permissions
          }));
          (session as any).user.loyaltyAccountId = userWithRoles.loyaltyAccount?.id;
          (session as any).user.loyaltyTier = userWithRoles.loyaltyAccount?.tier;
          (session as any).user.loyaltyPoints = userWithRoles.loyaltyAccount?.points;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      // On sign in, user object is available
      if (user) {
        token.sub = user.id;
      }
      
      // Rotate token on privilege changes
      if (trigger === 'update') {
        // Force re-fetch of user data
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: { userRoles: { include: { role: true } } }
        });
        if (updatedUser) {
          token.roles = updatedUser.userRoles;
        }
      }
      
      return token;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Auto-assign MEMBER role to new users
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleKey: 'MEMBER',
            scopeType: 'ORG',
            scopeId: 1 // POD N BEYOND GROUP org ID
          }
        });

        // Create loyalty account for new member
        await prisma.loyaltyAccount.create({
          data: {
            userId: user.id,
            points: 0,
            tier: 'SILVER'
          }
        });

        console.log(`✨ New member registered: ${user.email}`);
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);


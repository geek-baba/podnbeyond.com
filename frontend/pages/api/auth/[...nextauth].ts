import NextAuth, { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';

export const authOptions: NextAuthOptions = {
  // Use adapter ONLY for creating users, but let JWT handle sessions
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.postmarkapp.com',
        port: 587,
        auth: {
          user: process.env.POSTMARK_SERVER_TOKEN || '',
          pass: process.env.POSTMARK_SERVER_TOKEN || '',
        },
      },
      from: process.env.EMAIL_FROM || 'support@capsulepodhotel.com',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
    verifyRequest: '/admin/verify-email',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        
        const userWithRoles = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: {
            userRoles: { include: { role: true } },
            loyaltyAccount: true
          }
        });

        if (userWithRoles) {
          (session as any).user.roles = userWithRoles.userRoles.map((ur: any) => ({
            key: ur.roleKey,
            scopeType: ur.scopeType,
            scopeId: ur.scopeId,
            permissions: ur.role.permissions
          }));
          (session as any).user.loyaltyAccount = userWithRoles.loyaltyAccount;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleKey: 'MEMBER',
            scopeType: 'ORG',
            scopeId: 1
          }
        });

        await prisma.loyaltyAccount.create({
          data: {
            userId: user.id,
            points: 0,
            tier: 'SILVER'
          }
        });
      }
    },
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: true,
};

export default NextAuth(authOptions);

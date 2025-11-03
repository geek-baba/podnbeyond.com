import NextAuth, { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '1025'),
      },
      from: process.env.EMAIL_FROM || 'noreply@podnbeyond.com',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          // Send magic link via Postmark Email API
          const response = await fetch('http://localhost:4000/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: 'Sign in to POD N BEYOND Admin',
              htmlBody: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">POD N BEYOND</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Admin Portal</p>
                  </div>
                  
                  <div style="background: #f8fafc; border-radius: 12px; padding: 32px; text-align: center;">
                    <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">Sign in to your account</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Click the button below to securely access the admin portal</p>
                    
                    <a href="${url}" style="display: inline-block; background: #1e293b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Sign In to Admin Portal
                    </a>
                    
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This link expires in 24 hours for security.</p>
                  </div>
                  
                  <div style="margin-top: 32px; text-align: center; color: #94a3b8; font-size: 12px;">
                    <p>If you didn't request this email, you can safely ignore it.</p>
                    <p style="margin-top: 8px;">POD N BEYOND GROUP · India's First Multi-Brand Pod Hotel</p>
                  </div>
                </div>
              `,
              textBody: `Sign in to POD N BEYOND Admin\n\nClick this link to sign in:\n${url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.\n\n---\nPOD N BEYOND GROUP\nIndia's First Multi-Brand Pod Hotel`,
              tag: 'magic-link-auth',
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            console.log(`✅ Magic link sent via Postmark to: ${email}`);
          } else {
            console.error(`❌ Failed to send magic link:`, data.error);
            // Fallback: log to console
            console.log(`\n🔗 FALLBACK Magic Link for ${email}:\n${url}\n`);
          }
        } catch (error) {
          console.error('❌ Email send error:', error);
          // Fallback: log to console
          console.log(`\n🔗 FALLBACK Magic Link for ${email}:\n${url}\n`);
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
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
          (session as any).user.roles = userWithRoles.userRoles.map(ur => ({
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


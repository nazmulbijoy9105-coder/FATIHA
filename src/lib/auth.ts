// FATIHA Auth Configuration
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';

export interface FatihAUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user';
  plan: 'free' | 'pro' | 'enterprise';
  avatar?: string;
  createdAt: string;
}

// Extended session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string;
      role: 'admin' | 'user';
      plan: 'free' | 'pro' | 'enterprise';
      avatar?: string;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'admin' | 'user';
    plan: 'free' | 'pro' | 'enterprise';
    avatar?: string;
  }
}

// Seeded admin — Adv Md Nazmul Islam BIJOY (Developer = Admin)
// Both email variants map to admin
const ADMIN_EMAILS = ['adv.nazmul.bijoy@gmail.com', 'nazmulbijoy9105@gmail.com'];

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  // Only credentials provider — Google OAuth requires real credentials
  // To enable Google: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const users = await db.user.findMany({});
        const user = users.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.passwordHash === credentials.password
        );

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          plan: user.plan,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const users = await db.user.findMany({});
        const dbUser = users.find((u) => u.id === token.sub);
        if (dbUser) {
          session.user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            phone: dbUser.phone,
            role: dbUser.role as 'admin' | 'user',
            plan: dbUser.plan as 'free' | 'pro' | 'enterprise',
            avatar: dbUser.avatar,
          };
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
  },
  pages: {
    // No custom sign-in page — handled client-side in SPA
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fatiha-dev-secret-change-in-production-2024',
};

// Check if Google OAuth is configured
export function isGoogleAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

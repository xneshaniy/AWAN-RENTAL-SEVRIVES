import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { clientIpFromHeaders } from '@/lib/rate-limit';
import { rateLimitShared } from '@/lib/rate-limit-db';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Durable counterpart to the in-memory limiter in middleware.ts.
        // Middleware runs on the edge runtime, where Prisma is unavailable, so
        // its counter is process-local: it resets on a cold start and only ever
        // counts the attempts that happened to land on one serverless instance.
        // A brute-force run is therefore throttled at roughly limit x number of
        // instances. Counting the same traffic against the shared table here
        // closes that gap.
        //
        // The bucket key deliberately differs from middleware's `login:<ip>`:
        // this code runs *after* middleware has already recorded the attempt,
        // and reusing the key would count every attempt twice, halving the
        // effective limit.
        //
        // If there is no request scope (headers() throws) or no proxy IP, the
        // check is skipped rather than falling back to one shared `unknown`
        // bucket - that fallback would lock every sign-in out globally after a
        // handful of attempts.
        let ip: string | null = null;
        try {
          ip = clientIpFromHeaders(headers());
        } catch {
          ip = null;
        }
        if (ip && ip !== 'unknown') {
          const allowed = await rateLimitShared(`login-attempt:${ip}`, {
            limit: 10,
            windowMs: 15 * 60 * 1000,
          });
          if (!allowed) {
            throw new Error('Too many sign-in attempts. Please wait a few minutes and try again.');
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Only admin roles may enter: ADMIN (full access) and STAFF
        // (back-office access). Passwords are verified with bcrypt above and
        // are never returned to the client.
        if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
          throw new Error('Access denied. Admin area only.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // OAuth accounts may only enter when an existing DB user already has
        // an admin role - never for new or customer accounts.
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser || (existingUser.role !== 'ADMIN' && existingUser.role !== 'STAFF')) {
          return false;
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
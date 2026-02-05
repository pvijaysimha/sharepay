import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@repo/db";
import type { Adapter, AdapterAccount } from "next-auth/adapters";

const useSecureCookies = process.env.NODE_ENV === 'production';
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

// Known fields in our Account schema - add any new fields here
const KNOWN_ACCOUNT_FIELDS = new Set([
    'id',
    'userId',
    'type',
    'provider',
    'providerAccountId',
    'refresh_token',
    'access_token',
    'expires_at',
    'ext_expires_in',
    'token_type',
    'scope',
    'id_token',
    'session_state',
]);

// Custom adapter wrapper that filters out unknown fields from OAuth providers
// This prevents database errors when providers return new/unexpected fields
function SafePrismaAdapter(prismaClient: typeof prisma): Adapter {
    const baseAdapter = PrismaAdapter(prismaClient);

    return {
        ...baseAdapter,
        linkAccount: async (account: AdapterAccount) => {
            // Filter out unknown fields to prevent Prisma errors
            const filteredAccount: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(account)) {
                if (KNOWN_ACCOUNT_FIELDS.has(key)) {
                    filteredAccount[key] = value;
                } else {
                    console.warn(`[NextAuth] Ignoring unknown account field from OAuth provider: ${key}`);
                }
            }

            return baseAdapter.linkAccount?.(filteredAccount as AdapterAccount);
        },
    };
}

export const authOptions: NextAuthOptions = {
    adapter: SafePrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    // @ts-ignore
    trustHost: true,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID || "",
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
            tenantId: process.env.AZURE_AD_TENANT_ID,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session: async ({ session, token }) => {
            if (session?.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
};

import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens, credentials } from "@/db";
import { verifieerWachtwoord } from "@/lib/wachtwoord";
import type { Aanspreekvorm, Rol } from "@/db/schema";

/**
 * §3 auth: magic link (Resend) plus credentials.
 *
 * The session carries `rol` and `aanspreekvorm` because both are needed on
 * nearly every render — role to pick the right navigation, aanspreekvorm to
 * choose je/u. Neither is ever trusted for authorisation on its own: the
 * data layer re-checks the role against the database (see db/queries.ts).
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      naam?: string | null;
      rol: Rol;
      aanspreekvorm: Aanspreekvorm;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account",
    verifyRequest: "/account/controleer-je-mail",
    error: "/account",
  },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.MAIL_VAN,
    }),
    Credentials({
      credentials: {
        email: { label: "E-mailadres", type: "email" },
        wachtwoord: { label: "Wachtwoord", type: "password" },
      },
      async authorize(input) {
        const email = String(input?.email ?? "")
          .trim()
          .toLowerCase();
        const wachtwoord = String(input?.wachtwoord ?? "");
        if (!email || !wachtwoord) return null;

        const [gebruiker] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!gebruiker) return null;

        const [rij] = await db
          .select()
          .from(credentials)
          .where(eq(credentials.userId, gebruiker.id))
          .limit(1);
        if (!rij) return null;

        const klopt = await verifieerWachtwoord(
          wachtwoord,
          rij.wachtwoordHash,
        );
        if (!klopt) return null;

        return {
          id: gebruiker.id,
          email: gebruiker.email,
          name: gebruiker.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, and on every refresh, read role from the database
      // rather than trusting whatever is already in the token.
      const id = (user?.id ?? token.sub) as string | undefined;
      if (!id) return token;

      const [rij] = await db
        .select({
          rol: users.rol,
          aanspreekvorm: users.aanspreekvorm,
          naam: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (rij) {
        token.sub = id;
        token.rol = rij.rol;
        token.aanspreekvorm = rij.aanspreekvorm;
        token.naam = rij.naam;
        token.email = rij.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Spread rather than replace: the adapter's own user fields
      // (emailVerified, image) must survive.
      session.user = {
        ...session.user,
        id: token.sub as string,
        email: token.email as string,
        naam: (token.naam as string | null) ?? null,
        rol: (token.rol as Rol) ?? "klant",
        aanspreekvorm: (token.aanspreekvorm as Aanspreekvorm) ?? "je",
      };
      return session;
    },
  },
});

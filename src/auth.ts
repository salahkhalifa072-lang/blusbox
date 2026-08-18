import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens, credentials } from "@/db";
import { verifieerWachtwoord } from "@/lib/wachtwoord";
import type { Aanspreekvorm, Rol } from "@/db/schema";

/**
 * §3 auth: magic link (MailerSend) plus credentials.
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
    /**
     * Magic link via MailerSend.
     *
     * Auth.js heeft geen kant-en-klare MailerSend-provider, dus dit is de
     * generieke e-mailprovider met een eigen verzendfunctie. Dat is
     * bovendien netter: één verzendweg voor álle mail, zodat een probleem
     * met het afzenderdomein zich niet op één plek anders gedraagt.
     */
    {
      id: "mailersend",
      type: "email",
      name: "E-mail",
      from: process.env.MAIL_VAN ?? "Blusbox <info@blusbox.nl>",
      // Auth.js-standaard; een link die een dag geldig is, is lang genoeg
      // om een mailtje later op de dag alsnog te openen.
      maxAge: 24 * 60 * 60,
      options: {},
      async sendVerificationRequest({ identifier, url }) {
        const { stuurInloglink } = await import("@/lib/mail");
        const resultaat = await stuurInloglink(identifier, url);
        if (!resultaat.verstuurd) {
          // Gooien is hier wél juist: de gebruiker staat te wachten op een
          // mail die niet komt, en moet dat te zien krijgen.
          throw new Error(`Inloglink niet verstuurd: ${resultaat.reden}`);
        }
      },
    },
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

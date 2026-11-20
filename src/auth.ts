import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db";
import { controleerWachtwoordLogin, gebruikerOpId } from "@/lib/inloggen";
import { leesTussenstap } from "@/lib/totp";
import { controleerInlogcode, tweestapsActief } from "@/lib/tweestaps";
import { accountAfgekoeld, huidigIp, ipGeblokkeerd, registreerPoging } from "@/lib/inlogbewaking";
import type { Aanspreekvorm, Rol } from "@/db/schema";

/**
 * §3 auth: wachtwoord, met optioneel een code uit een authenticator-app.
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
    // Geen `verifyRequest`: die pagina hoort bij een e-mailprovider, en die
    // is er niet meer. Hij wees bovendien naar /account/controleer-je-mail,
    // wat nooit bestaan heeft — de magic link liep dus sowieso op een 404.
    error: "/account",
  },
  /**
   * Alleen wachtwoordlogin.
   *
   * Er zat hier een magic link via MailerSend. Die is er op 7 september 2026
   * uit gehaald: Chrome zette er een "Gevaarlijke site"-waarschuwing voor.
   * Niet omdat er iets mis was — Search Console meldde niets en het domein
   * staat op geen enkele lijst — maar omdat de URL die Auth.js opbouwt het
   * profiel van phishing heeft: een redirect-parameter, een geheim van 64
   * tekens en het e-mailadres van de ontvanger, alle drie in de querystring,
   * aangeklikt vanuit een e-mail.
   *
   * Accounts zijn er alleen voor beheerders en installateurs; klanten
   * bestellen als gast. Wachtwoordlogin dekt dat volledig, dus een tweede
   * inlogweg die browsers wantrouwen is puur risico zonder opbrengst.
   *
   * Wie de magic link terug wil: hij mag dan niet meer als kale GET-link de
   * mail in. De werkwijze die dat oplost is een korte, schone URL naar een
   * tussenpagina met één knop, die pas bij de klik server-side inlogt. Dat
   * lost meteen op dat virusscanners links in mails vooraf openen en het
   * token verbruiken voordat de ontvanger erbij is.
   */
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mailadres", type: "email" },
        wachtwoord: { label: "Wachtwoord", type: "password" },
        tussenstap: { type: "text" },
        code: { type: "text" },
      },
      /**
       * Twee manieren om binnen te komen:
       *
       * 1. E-mail en wachtwoord, alleen als tweestapsverificatie uit staat.
       * 2. Het tussenstap-briefje (bewijs dat het wachtwoord klopte, zie
       *    lib/totp.ts) plus een geldige code uit de app of een herstelcode.
       *
       * De controle zit hier en niet alleen op de inlogpagina: Auth.js zet
       * ook /api/auth/callback/credentials open, en wie daar rechtstreeks
       * e-mail en wachtwoord heen stuurt, mag de code niet kunnen overslaan.
       */
      async authorize(input) {
        // Geblokkeerd adres: niets controleren, niets prijsgeven.
        const ip = await huidigIp();
        if (await ipGeblokkeerd(ip)) return null;

        const tussenstap = String(input?.tussenstap ?? "");
        if (tussenstap) {
          // Het briefje bestaat alleen als het wachtwoord al klopte; die
          // poging is op de inlogpagina vastgelegd.
          const userId = leesTussenstap(tussenstap);
          if (!userId) return null;
          const gebruiker = await gebruikerOpId(userId);
          if (!gebruiker) return null;
          if (await tweestapsActief(userId)) {
            const uitkomst = await controleerInlogcode(userId, String(input?.code ?? ""));
            await registreerPoging({ ip, email: gebruiker.email, soort: "code", gelukt: uitkomst === "goed" });
            if (uitkomst !== "goed") return null;
          }
          return gebruiker;
        }

        // Rechtstreeks naar /api/auth/callback/credentials, zonder de
        // inlogpagina. Gewone bezoekers komen hier niet; scripts wel. Zelfde
        // bewaking, en met tweestapsverificatie aan sowieso geen toegang.
        const email = String(input?.email ?? "");
        if (await accountAfgekoeld(email)) return null;
        const gebruiker = await controleerWachtwoordLogin(email, String(input?.wachtwoord ?? ""));
        await registreerPoging({ ip, email, soort: "wachtwoord", gelukt: Boolean(gebruiker) });
        if (!gebruiker) return null;
        if (await tweestapsActief(gebruiker.id)) return null;
        return gebruiker;
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

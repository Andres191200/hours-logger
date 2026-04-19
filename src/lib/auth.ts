import NextAuth from 'next-auth'
import Zitadel from 'next-auth/providers/zitadel'

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID!
const ZITADEL_PROJECT_ID = process.env.ZITADEL_PROJECT_ID!

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Zitadel({
      clientId: ZITADEL_CLIENT_ID,
      issuer: ZITADEL_ISSUER,
      authorization: {
        params: {
          scope: `openid profile email urn:zitadel:iam:org:projects:roles urn:zitadel:iam:org:project:id:${ZITADEL_PROJECT_ID}:aud`,
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          zitadelId: profile.sub,
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 12 * 60 * 60 },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at
        token.zitadelId = profile?.sub ?? undefined
      }
      if (token.expiresAt && Date.now() > (token.expiresAt as number) * 1000) {
        return null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.user.zitadelId = token.zitadelId as string
      }
      return session
    },
  },
  pages: { signIn: '/login' },
})

import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || account?.provider !== "google") return false;
      await connectToDatabase();
      await User.findOneAndUpdate(
        { email: user.email.toLowerCase() },
        { $set: { name: user.name, email: user.email.toLowerCase(), image: user.image, googleId: account.providerAccountId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.providerAccountId) token.googleId = account.providerAccountId;
      if (profile?.email) token.email = profile.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.googleId = typeof token.googleId === "string" ? token.googleId : undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email.toLowerCase() });
  return user;
}
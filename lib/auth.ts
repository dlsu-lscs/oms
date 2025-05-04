import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "./db";

interface MemberData {
  id: number;
  full_name: string;
  nickname: string | null;
  email: string;
  telegram: string | null;
  position_id: number | null;
  committee_id: number | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      memberId?: number | null;
      fullName?: string | null;
      nickname?: string | null;
      telegram?: string | null;
      positionId?: number | null;
      committeeId?: number | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        
        // Fetch additional member data from MySQL
        try {
          const [rows] = await pool.execute(
            "SELECT id, full_name, nickname, email, telegram, position_id, committee_id FROM members WHERE email = ?",
            [session.user.email]
          );
          
          const memberData = (rows as MemberData[])[0];
          if (memberData) {
            session.user.memberId = memberData.id;
            session.user.fullName = memberData.full_name;
            session.user.nickname = memberData.nickname;
            session.user.telegram = memberData.telegram;
            session.user.positionId = memberData.position_id;
            session.user.committeeId = memberData.committee_id;
          }
        } catch (error) {
          console.error("Error fetching member data:", error);
        }
      }
      return session;
    },
  },
}; 
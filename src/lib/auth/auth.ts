/**
 * Full auth instance — runs in the Node.js runtime (API routes, server actions).
 * Includes the Credentials provider with DB access and bcrypt.
 * Do NOT import this in middleware.ts (Edge Runtime incompatible).
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth-config";
import { dbConnect } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email("Invalid email format"),
            password: z.string().min(6, "Password must be at least 6 characters"),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        await dbConnect();

        const user = await User.findOne({ email }).exec();
        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Invalid password");
        }

        if (user.status !== "ACTIVE") {
          throw new Error(`Your account status is ${user.status.toLowerCase()}`);
        }

        // Update last login timestamp asynchronously
        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});


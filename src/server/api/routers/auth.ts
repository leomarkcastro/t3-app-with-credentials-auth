import { z } from "zod";

import { hashSync } from "bcrypt";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";

const saltRounds = 10;

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // create user account
      const password = input.password;
      const hashedPass = hashSync(password, saltRounds);
      const user = await db.user.create({
        data: {
          name: input.name,
          email: input.email,
          CredentialPassword: {
            create: {
              password: hashedPass,
            },
          },
        },
      });

      // return user
      return {
        name: user.name,
        email: user.email,
      };
    }),
});

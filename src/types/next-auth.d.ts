import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

// `next-auth/jwt` solo reexporta `@auth/core/jwt`, y una reexportación no admite
// aumento de módulo: hay que declarar sobre el módulo que define la interfaz.
declare module "@auth/core/jwt" {
  interface JWT {
    uid: string;
    role: UserRole;
  }
}

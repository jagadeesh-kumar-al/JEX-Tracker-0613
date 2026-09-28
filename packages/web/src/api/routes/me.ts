import { authed } from "../middleware/auth";
import { ensureProvisioned } from "../lib/provision";

export const me = {
  /** The signed-in account, with its workspace guaranteed to exist. */
  profile: authed.handler(async ({ context }) => {
    await ensureProvisioned(context.userId);
    return {
      id: context.user.id,
      name: context.user.name,
      email: context.user.email,
      image: context.user.image ?? null,
    };
  }),
};

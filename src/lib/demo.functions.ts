import { createServerFn } from "@tanstack/react-start";

export const DEMO_ACCOUNTS: {
  email: string;
  password: string;
  role: "health_worker" | "blood_bank";
  name: string;
  facility: string;
}[] = [];

export const ensureDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  return { created: [] };
});

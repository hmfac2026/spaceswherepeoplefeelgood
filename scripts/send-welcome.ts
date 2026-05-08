import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { sendWelcomeEmail } from "../lib/email";

const to = process.argv[2];
if (!to) {
  console.error("Usage: tsx scripts/send-welcome.ts <email>");
  process.exit(1);
}

sendWelcomeEmail(to).then(() => {
  console.log("Welcome email send attempted to", to);
});

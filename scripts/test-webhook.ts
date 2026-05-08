import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { Webhook } from "svix";

const url =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") + "/api/webhooks/clerk";

const secret = process.env.CLERK_WEBHOOK_SECRET;
if (!secret) throw new Error("CLERK_WEBHOOK_SECRET missing");

const fakeUserId = `user_TEST_${Date.now()}`;
const payload = {
  type: "user.created",
  object: "event",
  timestamp: Date.now(),
  data: {
    id: fakeUserId,
    primary_email_address_id: "idn_TEST",
    email_addresses: [
      {
        id: "idn_TEST",
        email_address: `webhook-test+${Date.now()}@example.com`,
      },
    ],
    first_name: "Webhook",
    last_name: "Test",
  },
};

async function main() {
  const body = JSON.stringify(payload);
  const msgId = `msg_test_${Date.now()}`;
  const ts = new Date();
  const tsSeconds = Math.floor(ts.getTime() / 1000).toString();

  const wh = new Webhook(secret!);
  const signature = wh.sign(msgId, ts, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": msgId,
      "svix-timestamp": tsSeconds,
      "svix-signature": signature,
    },
    body,
  });

  console.log("URL:", url);
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
  console.log("\nSynthetic user id sent:", fakeUserId);
}
main();

import { Webhook } from "svix";

const secret = "whsec_zTbkKjCF6pwaDwYpEPsQMaB3+1zIbMom";
const wh = new Webhook(secret);
const body = JSON.stringify({ type: "user.created", data: { id: "x" } });
const msgId = "msg_test_1";
const ts = new Date();

const signature = wh.sign(msgId, ts, body);
console.log("signature:", signature);

const tsSeconds = Math.floor(ts.getTime() / 1000).toString();
const headers = {
  "svix-id": msgId,
  "svix-timestamp": tsSeconds,
  "svix-signature": signature,
};

try {
  const verified = wh.verify(body, headers);
  console.log("verify OK:", verified);
} catch (e) {
  console.error("verify FAIL:", (e as Error).message);
}

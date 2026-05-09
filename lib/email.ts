import { Resend } from "resend";

let resend: Resend | null = null;
function client() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

function fromAddress() {
  return process.env.EMAIL_FROM ?? "hello@frequencyspaces.com";
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function sendWelcomeEmail(to: string) {
  const r = client();
  if (!r) {
    console.warn("RESEND_API_KEY not set; skipping welcome email");
    return;
  }

  const { error } = await r.emails.send({
    from: `Spaces Where People Feel Good <${fromAddress()}>`,
    to,
    subject: "Welcome — and thanks for being here",
    text: welcomeText(),
    html: welcomeHtml(),
  });
  if (error) {
    console.error("Welcome email failed", error);
  }
}

type SubmissionDetails = {
  placeName: string;
  specialToYou: string;
  energy: string;
  whatToDo: string;
};

export async function sendSubmissionReceivedEmail(
  to: string,
  details: SubmissionDetails,
) {
  const r = client();
  if (!r) {
    console.warn("RESEND_API_KEY not set; skipping submission email");
    return;
  }

  const { error } = await r.emails.send({
    from: `Spaces Where People Feel Good <${fromAddress()}>`,
    to,
    subject: "We got it — thanks.",
    text: submissionText(details),
    html: submissionHtml(details),
  });
  if (error) {
    console.error("Submission-received email failed", error);
  }
}

function submissionText(d: SubmissionDetails) {
  return [
    `Thanks for telling us about ${d.placeName}.`,
    "",
    "Here's what you wrote:",
    "",
    "What makes this place special to you?",
    d.specialToYou,
    "",
    "What gives this place its energy?",
    d.energy,
    "",
    "What's one thing a visitor should do or experience here?",
    d.whatToDo,
    "",
    "We'll take a look in the next day or so. When it's live, we'll send you a link.",
  ].join("\n");
}

function submissionHtml(d: SubmissionDetails) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const block = (label: string, body: string) => `
    <p style="font-size:12px;line-height:1.4;letter-spacing:0.04em;text-transform:uppercase;color:#5b574f;margin:0 0 6px 0;">
      ${label}
    </p>
    <p style="font-size:15px;line-height:1.65;margin:0 0 22px 0;color:#1f1d1a;">
      ${escape(body)}
    </p>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf7f2;color:#1f1d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
            <tr>
              <td style="padding:0 8px;">
                <p style="font-family:Georgia,serif;font-size:22px;line-height:1.4;margin:0 0 24px 0;color:#1f1d1a;">
                  Thanks for telling us about ${escape(d.placeName)}.
                </p>
                <p style="font-size:15px;line-height:1.65;margin:0 0 28px 0;color:#5b574f;">
                  Here's what you wrote:
                </p>
                ${block("What makes this place special to you?", d.specialToYou)}
                ${block("What gives this place its energy?", d.energy)}
                ${block("What's one thing a visitor should do or experience here?", d.whatToDo)}
                <p style="font-size:14px;line-height:1.65;margin:24px 0 0 0;color:#5b574f;border-top:1px solid #e7e0d3;padding-top:20px;">
                  We'll take a look in the next day or so. When it's live, we'll send you a link.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPlaceLiveEmail(
  to: string,
  placeName: string,
  placeId: string,
) {
  const r = client();
  if (!r) {
    console.warn("RESEND_API_KEY not set; skipping place-live email");
    return;
  }

  const link = `${appUrl()}/place/${placeId}`;
  const { error } = await r.emails.send({
    from: `Spaces Where People Feel Good <${fromAddress()}>`,
    to,
    subject: `${placeName} is on the map.`,
    text: [
      `${placeName} is now on the map. Thanks for adding it.`,
      "",
      `See it here: ${link}`,
    ].join("\n"),
    html: liveHtml(placeName, link),
  });
  if (error) console.error("Place-live email failed", error);
}

function liveHtml(placeName: string, link: string) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf7f2;color:#1f1d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;">
      <tr><td align="center" style="padding:48px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
          <tr><td style="padding:0 8px;">
            <p style="font-family:Georgia,serif;font-size:22px;line-height:1.4;margin:0 0 24px 0;">
              ${escape(placeName)} is on the map.
            </p>
            <p style="font-size:16px;line-height:1.65;margin:0 0 28px 0;">
              Thanks for adding it.
            </p>
            <p style="margin:0;">
              <a href="${link}" style="display:inline-block;padding:12px 20px;background:#5f7a5b;color:#faf7f2;text-decoration:none;border-radius:6px;font-size:15px;">
                See it on the map
              </a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export type AdminNotifyKind =
  | { kind: "new_place"; placeName: string; submitter: string }
  | { kind: "new_entry"; placeName: string; submitter: string };

export async function sendAdminNotification(notice: AdminNotifyKind) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set; skipping admin notification");
    return;
  }
  const r = client();
  if (!r) {
    console.warn("RESEND_API_KEY not set; skipping admin notification");
    return;
  }

  const adminLink = `${appUrl()}/admin`;
  const subject =
    notice.kind === "new_place"
      ? `New place pending: ${notice.placeName}`
      : `New entry pending: ${notice.placeName}`;
  const body = [
    notice.kind === "new_place"
      ? `${notice.submitter} submitted a new place: ${notice.placeName}.`
      : `${notice.submitter} added a new entry to ${notice.placeName}.`,
    "",
    `Review it: ${adminLink}`,
  ].join("\n");

  const { error } = await r.emails.send({
    from: `Spaces Where People Feel Good <${fromAddress()}>`,
    to: adminEmail,
    subject,
    text: body,
  });
  if (error) console.error("Admin notification failed", error);
}

function welcomeText() {
  return [
    "Welcome to the community of people helping others find places where they can feel good.",
    "",
    "If somewhere comes to mind — a park bench, a particular café, a hotel you can't forget — come and tell us about it. Three short questions, and we'll add it to the map.",
    "",
    `Add a place: ${appUrl()}/add`,
    "",
    "Thanks for being here.",
  ].join("\n");
}

function welcomeHtml() {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf7f2;color:#1f1d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
            <tr>
              <td style="padding:0 8px;">
                <p style="font-family:Georgia,serif;font-size:22px;line-height:1.4;margin:0 0 24px 0;color:#1f1d1a;">
                  Welcome to the community of people helping others find places where they can feel good.
                </p>
                <p style="font-size:16px;line-height:1.65;margin:0 0 24px 0;color:#1f1d1a;">
                  If somewhere comes to mind — a park bench, a particular café, a hotel you can't forget — come and tell us about it. Three short questions, and we'll add it to the map.
                </p>
                <p style="margin:0 0 32px 0;">
                  <a href="${appUrl()}/add" style="display:inline-block;padding:12px 20px;background:#5f7a5b;color:#faf7f2;text-decoration:none;border-radius:6px;font-size:15px;">
                    Add a place
                  </a>
                </p>
                <p style="font-size:14px;line-height:1.6;margin:0;color:#5b574f;">
                  Thanks for being here.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

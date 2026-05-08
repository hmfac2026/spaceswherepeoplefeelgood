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

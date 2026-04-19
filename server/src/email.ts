import { Resend } from 'resend';
import { RESEND_API_KEY, CLIENT_URL } from './config';

function getResend() {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(RESEND_API_KEY);
}
const FROM = 'Thrones <noreply@thronesonline.com>';

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`;
  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: 'Verify your Thrones account',
    html: `
      <div style="background:#0a0a0f;color:#f0ece4;font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
        <h1 style="color:#c9a84c;letter-spacing:0.2em;font-size:1.4rem;margin-bottom:8px;">THRONES</h1>
        <p style="color:#6b6760;margin-bottom:32px;font-size:0.85rem;">thronesonline.com</p>
        <h2 style="font-size:1.1rem;margin-bottom:16px;">Hello ${username},</h2>
        <p style="color:#a0a0a0;line-height:1.6;">Please verify your email address by clicking the button below.</p>
        <a href="${link}" style="display:inline-block;margin:28px 0;padding:12px 32px;background:#c9a84c;color:#0a0a0f;text-decoration:none;font-weight:700;letter-spacing:0.15em;font-size:0.85rem;">
          VERIFY MY ACCOUNT
        </a>
        <p style="color:#6b6760;font-size:0.75rem;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendContactEmail(fromEmail: string, subject: string, message: string) {
  await getResend().emails.send({
    from:     FROM,
    to:       'thronesonlinegame@gmail.com',
    replyTo:  fromEmail,
    subject:  `[Contact] ${subject}`,
    html: `
      <div style="background:#0a0a0f;color:#f0ece4;font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;">
        <h1 style="color:#c9a84c;letter-spacing:0.2em;font-size:1.4rem;margin-bottom:8px;">THRONES</h1>
        <p style="color:#6b6760;margin-bottom:32px;font-size:0.85rem;">thronesonline.com — message de contact</p>
        <p style="color:#a8b4c0;font-size:0.82rem;margin-bottom:4px;">De : <strong style="color:#f0ece4;">${fromEmail}</strong></p>
        <p style="color:#a8b4c0;font-size:0.82rem;margin-bottom:24px;">Objet : <strong style="color:#f0ece4;">${subject}</strong></p>
        <div style="border-left:2px solid #c9a84c;padding-left:16px;color:#d0ccc4;line-height:1.7;white-space:pre-wrap;">${message}</div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  await getResend().emails.send({
    from:    FROM,
    to:      email,
    subject: 'Reset your Thrones password',
    html: `
      <div style="background:#0a0a0f;color:#f0ece4;font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
        <h1 style="color:#c9a84c;letter-spacing:0.2em;font-size:1.4rem;margin-bottom:8px;">THRONES</h1>
        <p style="color:#6b6760;margin-bottom:32px;font-size:0.85rem;">thronesonline.com</p>
        <h2 style="font-size:1.1rem;margin-bottom:16px;">Hello ${username},</h2>
        <p style="color:#a0a0a0;line-height:1.6;">A password reset was requested for your account. Click the button below to choose a new password.</p>
        <a href="${link}" style="display:inline-block;margin:28px 0;padding:12px 32px;background:#c9a84c;color:#0a0a0f;text-decoration:none;font-weight:700;letter-spacing:0.15em;font-size:0.85rem;">
          RESET MY PASSWORD
        </a>
        <p style="color:#6b6760;font-size:0.75rem;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
      </div>
    `,
  });
}

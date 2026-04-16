import { Resend } from 'resend';
import { RESEND_API_KEY, CLIENT_URL } from './config';

const resend = new Resend(RESEND_API_KEY);
const FROM   = 'Thrones <noreply@thronesonline.com>';

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`;
  await resend.emails.send({
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

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  await resend.emails.send({
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

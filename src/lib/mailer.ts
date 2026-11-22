interface SendPasswordResetEmailParams {
  to: string;
  recipientName: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  recipientName,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{ sent: boolean; provider: string }> {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const mailFrom = (process.env.MAIL_FROM || 'Yovela Dental Clinic <no-reply@yoveladental.id>').trim();

  if (!resendApiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[MAILER_WARN] RESEND_API_KEY belum dikonfigurasi pada environment production; email reset tidak terkirim.'
      );
    }
    return { sent: false, provider: 'none' };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #FAF7F0; color: #1B4332; border-radius: 12px; border: 1px solid #E5DFD2;">
      <h2 style="margin: 0 0 12px; color: #1B4332;">Reset Kata Sandi Staf</h2>
      <p style="margin: 0 0 16px; line-height: 1.6;">Halo <strong>${recipientName}</strong>,</p>
      <p style="margin: 0 0 20px; line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di <strong>Yovela Dental Clinic</strong>. Tautan ini berlaku selama <strong>30 menit</strong> dan hanya dapat digunakan satu kali.</p>
      <p style="margin: 0 0 24px;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background-color: #1B4332; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600;">Atur Ulang Kata Sandi</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #4A5D52;">Jika Anda tidak meminta pengaturan ulang ini, abaikan email ini. Kata sandi Anda tetap aman.</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [to],
      subject: 'Reset Kata Sandi — Yovela Dental Clinic',
      html,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'unknown');
    console.error('[MAILER_ERROR] Gagal mengirim email via Resend:', response.status, errText);
    return { sent: false, provider: 'resend' };
  }

  return { sent: true, provider: 'resend' };
}

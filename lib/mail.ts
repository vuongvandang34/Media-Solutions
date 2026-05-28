export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  const from = process.env.EMAIL_FROM || 'noreply@example.com';

  if (provider === 'console') {
    console.log('\n=================== [EMAIL SENT] ===================');
    console.log(`From:    ${from}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------------------');
    console.log(text || html.replace(/<[^>]*>?/gm, ''));
    console.log('----------------------------------------------------');
    console.log(`HTML Version Preview:`);
    console.log(html);
    console.log('====================================================\n');
    return { success: true, message: 'Email logged to console' };
  }

  // Ready for swap-in e.g. Resend or Nodemailer
  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('Resend API key missing. Falling back to stub.');
    } else {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to,
            subject,
            html,
          }),
        });
        if (res.ok) {
          return { success: true, message: 'Email sent via Resend' };
        } else {
          const errData = await res.json();
          console.error('Resend error:', errData);
        }
      } catch (error) {
        console.error('Failed to send email via Resend:', error);
      }
    }
  }

  console.log(`[STUB-EMAIL] To: ${to} | Subject: ${subject}`);
  return { success: true, message: 'Email stub logged' };
}

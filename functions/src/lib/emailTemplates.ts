// ---------------------------------------------------------------------------
// Branded email template system for Crystalline Max
// All emails (transactional + marketing) share the same branded wrapper.
// ---------------------------------------------------------------------------

export function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------

export function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0">
      <tr>
        <td style="background-color:#00F5D4;border-radius:6px;padding:14px 36px">
          <a href="${escHtml(url)}" target="_blank" style="color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">${escHtml(text)}</a>
        </td>
      </tr>
    </table>`;
}

interface BrandedWrapperOptions {
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

export function brandedEmailWrapper(
  content: string,
  options: BrandedWrapperOptions = {},
): string {
  const unsubscribeBlock = options.showUnsubscribe && options.unsubscribeUrl
    ? `<p style="margin:20px 0 0;font-size:11px;color:#999999"><a href="${escHtml(options.unsubscribeUrl)}" style="color:#999999;text-decoration:underline">Unsubscribe</a> from marketing emails.</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Crystalline Max</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

          <!-- Teal accent bar -->
          <tr>
            <td style="background-color:#00F5D4;height:4px;border-radius:8px 8px 0 0;font-size:0;line-height:0">&nbsp;</td>
          </tr>

          <!-- White card body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 36px;border-radius:0 0 8px 8px">

              <!-- Company header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:20px;font-weight:bold;color:#0a0a0a;letter-spacing:0.08em;text-transform:uppercase;padding-bottom:28px;border-bottom:1px solid #eee">
                    CRYSTALLINE MAX
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-top:28px;font-size:15px;line-height:1.7;color:#333333">
                    ${content}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 36px;text-align:center;font-size:12px;color:#999999;line-height:1.6">
              <p style="margin:0;font-weight:bold;color:#666666">Crystalline Max Ltd</p>
              <p style="margin:4px 0 0">Email: admin@ctmds.co.uk</p>
              <p style="margin:2px 0 0">Phone: 07438 299610</p>
              <p style="margin:2px 0 0">London, UK</p>
              ${unsubscribeBlock}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template: Welcome email (first booking)
// ---------------------------------------------------------------------------

export function getWelcomeEmailTemplate(input: {
  customerName: string;
  bookingUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">Welcome, ${escHtml(input.customerName)}!</h2>
    <p style="margin:0 0 20px">Thank you for choosing Crystalline Max. We are committed to delivering a premium experience every time.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">
      <tr><td style="padding:6px 0;color:#333">&#10003;&nbsp; Professional, vetted team</td></tr>
      <tr><td style="padding:6px 0;color:#333">&#10003;&nbsp; Premium products &amp; equipment</td></tr>
      <tr><td style="padding:6px 0;color:#333">&#10003;&nbsp; 100% satisfaction guarantee</td></tr>
    </table>
    ${ctaButton('View Your Booking', input.bookingUrl)}`;

  return {
    subject: `Welcome to Crystalline Max, ${input.customerName}!`,
    html: brandedEmailWrapper(content, {
      showUnsubscribe: true,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// Template: Post-service follow-up (2 days after completion)
// ---------------------------------------------------------------------------

export function getFollowUpEmailTemplate(input: {
  customerName: string;
  serviceName: string;
  bookAgainUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">How was your ${escHtml(input.serviceName)}?</h2>
    <p style="margin:0 0 12px">Hi ${escHtml(input.customerName)},</p>
    <p style="margin:0 0 20px">We hope everything met your expectations. Your feedback helps us maintain the highest standard. If anything was less than perfect, reply to this email and we will make it right.</p>
    <p style="margin:0 0 8px;color:#666">Ready for another clean?</p>
    ${ctaButton('Book Again', input.bookAgainUrl)}`;

  return {
    subject: `How was your ${input.serviceName}? — Crystalline Max`,
    html: brandedEmailWrapper(content, {
      showUnsubscribe: true,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// Template: Re-engagement (no booking in 30+ days)
// ---------------------------------------------------------------------------

export function getReEngagementEmailTemplate(input: {
  customerName: string;
  bookNowUrl: string;
  services: Array<{ name: string; price: string }>;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const serviceRows = input.services
    .map(
      (s) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333">${escHtml(s.name)}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold;color:#0a0a0a">${escHtml(s.price)}</td></tr>`,
    )
    .join('');

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">We miss you, ${escHtml(input.customerName)}!</h2>
    <p style="margin:0 0 20px">It has been a while since your last visit. Whether it is a full car detail or a deep home clean, we are ready when you are.</p>
    ${serviceRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">${serviceRows}</table>` : ''}
    ${ctaButton('Book Now', input.bookNowUrl)}`;

  return {
    subject: `We miss you, ${input.customerName} — Crystalline Max`,
    html: brandedEmailWrapper(content, {
      showUnsubscribe: true,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// Template: Quote reminder (3 days after open quote)
// ---------------------------------------------------------------------------

export function getQuoteReminderEmailTemplate(input: {
  customerName: string;
  serviceName: string;
  bookUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">Your quote is waiting</h2>
    <p style="margin:0 0 12px">Hi ${escHtml(input.customerName)},</p>
    <p style="margin:0 0 20px">Just a friendly reminder — you requested a quote for <strong>${escHtml(input.serviceName)}</strong> and we would love to get you booked in.</p>
    ${ctaButton('Book This Service', input.bookUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:#999">No obligation — your quote remains valid for 30 days.</p>`;

  return {
    subject: `Your quote is waiting — ${input.serviceName}`,
    html: brandedEmailWrapper(content, {
      showUnsubscribe: true,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// Template: Admin broadcast (manual campaign)
// ---------------------------------------------------------------------------

export function getAdminBroadcastEmailTemplate(input: {
  customerName: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const ctaBlock =
    input.ctaText && input.ctaUrl ? ctaButton(input.ctaText, input.ctaUrl) : '';

  const content = `
    <p style="margin:0 0 20px">Hi ${escHtml(input.customerName)},</p>
    ${input.bodyHtml}
    ${ctaBlock}`;

  // Subject is set by the caller, not by this template
  return {
    subject: '',
    html: brandedEmailWrapper(content, {
      showUnsubscribe: true,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// Template: Seasonal campaign
// ---------------------------------------------------------------------------

export function getSeasonalEmailTemplate(input: {
  customerName: string;
  heading: string;
  message: string;
  offerDetails?: string;
  ctaText: string;
  ctaUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const offerBlock = input.offerDetails
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#f8fffe;border-left:3px solid #00F5D4;padding:0"><tr><td style="padding:16px 20px;font-size:14px;color:#333">${escHtml(input.offerDetails)}</td></tr></table>`
    : '';

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">${escHtml(input.heading)}</h2>
    <p style="margin:0 0 12px">Hi ${escHtml(input.customerName)},</p>
    <p style="margin:0 0 20px">${escHtml(input.message)}</p>
    ${offerBlock}
    ${ctaButton(input.ctaText, input.ctaUrl)}`;

  return {
    subject: input.heading,
    html: brandedEmailWrapper(content, {
      showUnsubscribe: true,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// Template: Client passwordless sign-in
// ---------------------------------------------------------------------------

export function getClientSignInEmailTemplate(input: {
  signInUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">Sign in to your client portal</h2>
    <p style="margin:0 0 20px">Use the secure link below to access your Crystalline Max client portal. This link verifies your email address and signs you in without a password.</p>
    ${ctaButton('Sign In Securely', input.signInUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:#777777">If you did not request this email, you can safely ignore it.</p>
    <p style="margin:8px 0 0;font-size:13px;color:#777777">For security, this link can only be used once and may expire.</p>`;

  return {
    subject: 'Your Crystalline Max sign-in link',
    html: brandedEmailWrapper(content),
  };
}

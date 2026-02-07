export interface EmailTemplateContext {
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown> | null;
}

function wrapHtml(subject: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border: 1px solid #eee; border-radius: 8px; padding: 24px;">
    ${bodyHtml}
  </div>
  <p style="color: #888; font-size: 12px; margin-top: 24px;">This is an automated message from Hyperlocal.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns { subject, html } for the given notification type.
 * Used for booking confirmation, cancellation, refund, service person coming, OTP verification.
 */
export function getEmailSubjectAndHtml(ctx: EmailTemplateContext): {
  subject: string;
  html: string;
} {
  const meta = ctx.metadata ?? {};
  switch (ctx.type) {
    case 'booking_confirmation':
      return {
        subject: 'Booking confirmed',
        html: wrapHtml(
          'Booking confirmed',
          `
          <h2 style="margin-top: 0;">Booking confirmed</h2>
          <p>${escapeHtml(ctx.body)}</p>
          <p>Thank you for your booking.</p>
        `,
        ),
      };
    case 'booking_cancellation':
      return {
        subject: 'Booking cancelled',
        html: wrapHtml(
          'Booking cancelled',
          `
          <h2 style="margin-top: 0;">Booking cancelled</h2>
          <p>${escapeHtml(ctx.body)}</p>
        `,
        ),
      };
    case 'booking_refund':
      return {
        subject: 'Refund processed',
        html: wrapHtml(
          'Refund processed',
          `
          <h2 style="margin-top: 0;">Refund processed</h2>
          <p>${escapeHtml(ctx.body)}</p>
        `,
        ),
      };
    case 'service_person_coming':
      return {
        subject: 'Service person assigned',
        html: wrapHtml(
          'Service person assigned',
          `
          <h2 style="margin-top: 0;">Service person assigned</h2>
          <p>${escapeHtml(ctx.body)}</p>
        `,
        ),
      };
    case 'otp_verification':
      return {
        subject: ctx.title,
        html: wrapHtml(
          ctx.title,
          `
          <h2 style="margin-top: 0;">${escapeHtml(ctx.title)}</h2>
          <p>${escapeHtml(ctx.body)}</p>
          <p style="color: #666;">Do not share this OTP with anyone except the service person (for arrival) or use only in the app (for completion).</p>
        `,
        ),
      };
    default:
      return {
        subject: ctx.title,
        html: wrapHtml(ctx.title, `<h2 style="margin-top: 0;">${escapeHtml(ctx.title)}</h2><p>${escapeHtml(ctx.body)}</p>`),
      };
  }
}

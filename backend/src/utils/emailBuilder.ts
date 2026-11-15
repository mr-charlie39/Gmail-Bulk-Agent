/**
 * Deliverability-Optimized RFC 5322 MIME Email Builder
 * Formats headers and payloads to ensure primary inbox delivery:
 * 1. Valid RFC 5322 Date header (Missing date is +3.5 to +5.0 SpamAssassin penalty)
 * 2. Valid Message-ID header (Missing MID triggers automated spam classifier)
 * 3. Human display name formatting (RFC 2047 encoded-word)
 * 4. RFC-compliant Base64 body encoding (avoids 7bit UTF-8 corruption)
 * 5. Multipart alternative with clean plain text and clean readable HTML
 */
export function buildRawEmail(params: {
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  messageId?: string;
  threadId?: string;
}): string {
  // Generate valid domain for Message-ID based on sender domain
  const senderDomain = params.from.includes('@') ? params.from.split('@')[1] : 'gmail.com';
  const customMessageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 11)}@${senderDomain}>`;
  
  // RFC 5322 Date header
  const rfcDate = new Date().toUTCString();

  // Clean and encode display name
  let formattedFrom = params.from;
  if (params.fromName) {
    const encodedName = `=?utf-8?B?${Buffer.from(params.fromName, 'utf-8').toString('base64')}?=`;
    formattedFrom = `"${encodedName}" <${params.from}>`;
  }

  // Format RFC 2047 encoded-word for UTF-8 subject
  const utf8Subject = `=?utf-8?B?${Buffer.from(params.subject, 'utf-8').toString('base64')}?=`;

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const headers = [
    `Date: ${rfcDate}`,
    `From: ${formattedFrom}`,
    `Reply-To: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${utf8Subject}`,
    `Message-ID: ${customMessageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (params.messageId) {
    headers.push(`In-Reply-To: ${params.messageId}`);
    headers.push(`References: ${params.messageId}`);
  }

  // Clean HTML fallback with natural typography
  const cleanHtml =
    params.bodyHtml ||
    `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222222;">
      ${params.bodyText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}
    </div>`;

  // Encode text and HTML in Base64 for 100% clean delivery without character breaks
  const base64Text = Buffer.from(params.bodyText, 'utf-8').toString('base64');
  const base64Html = Buffer.from(cleanHtml, 'utf-8').toString('base64');

  const lines = [
    ...headers,
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    base64Text,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    base64Html,
    '',
    `--${boundary}--`,
  ];

  const rawMime = lines.join('\r\n');

  // URL-safe base64 for Gmail API
  return Buffer.from(rawMime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

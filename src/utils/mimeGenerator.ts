import { Attachment } from '../types';

export interface EmailPayload {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  attachments?: Attachment[];
}

/**
 * Generates an RFC 822 formatted .eml raw string
 */
export const generateMimeMessage = ({
  fromName,
  fromEmail,
  toEmail,
  subject,
  bodyHtml,
  attachments = [],
}: EmailPayload): string => {
  const boundaryMixed = `----=_Part_Mixed_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const boundaryAlt = `----=_Part_Alt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  // Strip html tags for plain text alternate
  const textBody = bodyHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  let mime = '';
  mime += `From: "${fromName}" <${fromEmail}>\r\n`;
  mime += `To: <${toEmail}>\r\n`;
  mime += `Subject: ${subject}\r\n`;
  mime += `Date: ${new Date().toUTCString()}\r\n`;
  mime += `MIME-Version: 1.0\r\n`;

  if (attachments.length === 0) {
    // Multipart alternative only
    mime += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\r\n\r\n`;

    mime += `--${boundaryAlt}\r\n`;
    mime += `Content-Type: text/plain; charset=utf-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${textBody}\r\n\r\n`;

    mime += `--${boundaryAlt}\r\n`;
    mime += `Content-Type: text/html; charset=utf-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${bodyHtml}\r\n\r\n`;

    mime += `--${boundaryAlt}--\r\n`;
  } else {
    // Multipart mixed containing alternative + attachments
    mime += `Content-Type: multipart/mixed; boundary="${boundaryMixed}"\r\n\r\n`;

    mime += `--${boundaryMixed}\r\n`;
    mime += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\r\n\r\n`;

    mime += `--${boundaryAlt}\r\n`;
    mime += `Content-Type: text/plain; charset=utf-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${textBody}\r\n\r\n`;

    mime += `--${boundaryAlt}\r\n`;
    mime += `Content-Type: text/html; charset=utf-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${bodyHtml}\r\n\r\n`;

    mime += `--${boundaryAlt}--\r\n\r\n`;

    // Add attachments
    attachments.forEach((att) => {
      mime += `--${boundaryMixed}\r\n`;
      mime += `Content-Type: ${att.type || 'application/octet-stream'}; name="${att.name}"\r\n`;
      mime += `Content-Disposition: attachment; filename="${att.name}"\r\n`;
      mime += `Content-Transfer-Encoding: base64\r\n\r\n`;

      // Clean base64 string
      const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
      // Format into 76 character lines
      const chunked = cleanBase64.match(/.{1,76}/g)?.join('\r\n') || cleanBase64;
      mime += `${chunked}\r\n\r\n`;
    });

    mime += `--${boundaryMixed}--\r\n`;
  }

  return mime;
};

/**
 * Triggers a download of a .eml file in the browser
 */
export const downloadEmlFile = (payload: EmailPayload, filename?: string) => {
  const raw = generateMimeMessage(payload);
  const blob = new Blob([raw], { type: 'message/rfc822;charset=utf-8;' });
  const safeName = filename || `email-${payload.toEmail.replace(/[^a-zA-Z0-9]/g, '_')}.eml`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

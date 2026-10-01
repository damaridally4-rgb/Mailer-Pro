import { Attachment } from '../types';
import { generateMimeMessage } from '../utils/mimeGenerator';
import { getAccessToken } from './auth';

export interface SendGmailParams {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  attachments?: Attachment[];
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Base64URL encode string with UTF-8 support
 */
export const base64UrlEncode = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Send an email using the Gmail REST API (users.messages.send)
 */
export const sendGmailMessage = async ({
  fromName,
  fromEmail,
  toEmail,
  subject,
  bodyHtml,
  attachments = [],
}: SendGmailParams): Promise<GmailSendResult> => {
  const token = await getAccessToken();

  if (!token) {
    return {
      success: false,
      error: 'Gmail account not connected. Please click "Sign in with Google" first.',
    };
  }

  try {
    // Generate standard RFC 822 MIME message
    const rawMime = generateMimeMessage({
      fromName,
      fromEmail,
      toEmail,
      subject,
      bodyHtml,
      attachments,
    });

    const encodedMessage = base64UrlEncode(rawMime);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errorMsg =
        errorJson?.error?.message ||
        `Gmail API returned status ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errorMsg,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown network error sending via Gmail API',
    };
  }
};

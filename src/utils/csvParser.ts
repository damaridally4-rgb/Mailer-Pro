import Papa from 'papaparse';
import { Recipient } from '../types';

export interface ParseResult {
  recipients: Recipient[];
  headers: string[];
  emailColumn: string;
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  errors: string[];
}

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const parseCSVText = (csvText: string): ParseResult => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields || [];
  const errors: string[] = [];

  // Find candidate email column
  const emailColCandidate = headers.find((h) => {
    const lower = h.toLowerCase().replace(/[^a-z]/g, '');
    return lower === 'email' || lower === 'emailaddress' || lower === 'mail' || lower === 'recipient' || lower === 'to';
  }) || headers[0] || '';

  const recipients: Recipient[] = [];
  let validCount = 0;
  let invalidCount = 0;

  (result.data as Record<string, string>[]).forEach((row, idx) => {
    const rawEmail = (row[emailColCandidate] || '').trim();
    const isValid = EMAIL_REGEX.test(rawEmail);

    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
      if (rawEmail) {
        errors.push(`Row #${idx + 2}: Invalid email format "${rawEmail}"`);
      } else {
        errors.push(`Row #${idx + 2}: Missing email address`);
      }
    }

    const fields: Record<string, string> = {};
    headers.forEach((header) => {
      const val = row[header];
      if (val !== undefined && val !== null) {
        fields[header] = String(val).trim();
      }
    });

    recipients.push({
      id: `rcp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      email: rawEmail,
      isValid,
      fields,
      status: 'pending',
    });
  });

  return {
    recipients,
    headers,
    emailColumn: emailColCandidate,
    totalParsed: recipients.length,
    validCount,
    invalidCount,
    errors,
  };
};

export const exportToCSV = (data: Record<string, any>[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

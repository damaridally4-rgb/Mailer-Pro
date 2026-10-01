import { Recipient } from '../types';

/**
 * Replaces tags like {{FirstName}} or {{FirstName|DefaultValue}} with recipient field values.
 * Case-insensitive matching for common keys (firstname, first_name, first name, company, etc.)
 */
export const renderTemplate = (
  text: string,
  recipient?: Recipient | null
): { rendered: string; usedTags: string[]; missingTags: string[] } => {
  if (!text) return { rendered: '', usedTags: [], missingTags: [] };
  if (!recipient) return { rendered: text, usedTags: [], missingTags: [] };

  const usedTags = new Set<string>();
  const missingTags = new Set<string>();

  // Normalize recipient fields keys to lowercase for flexible lookup
  const normalizedFields: Record<string, string> = {};
  Object.entries(recipient.fields || {}).forEach(([k, v]) => {
    normalizedFields[k.toLowerCase().replace(/[\s_-]/g, '')] = v;
    normalizedFields[k] = v;
  });

  // Also map email
  if (recipient.email) {
    normalizedFields['email'] = recipient.email;
  }

  // Regex to match {{ TagName }} or {{ TagName | Fallback }}
  const rendered = text.replace(/\{\{\s*([a-zA-Z0-9_\s-]+)(?:\|([^}]*))?\s*\}\}/g, (_, tagKey, fallback) => {
    const rawTag = tagKey.trim();
    usedTags.add(rawTag);
    const lookupKey = rawTag.toLowerCase().replace(/[\s_-]/g, '');

    const foundValue = normalizedFields[rawTag] ?? normalizedFields[lookupKey];

    if (foundValue !== undefined && foundValue !== null && foundValue !== '') {
      return foundValue;
    }

    if (fallback !== undefined) {
      return fallback.trim();
    }

    missingTags.add(rawTag);
    return `[${rawTag}]`; // Visually highlight missing tag if no fallback
  });

  return {
    rendered,
    usedTags: Array.from(usedTags),
    missingTags: Array.from(missingTags),
  };
};

/**
 * Extracts all unique placeholder tags found in a string
 */
export const extractTags = (text: string): string[] => {
  if (!text) return [];
  const tags = new Set<string>();
  const matches = text.matchAll(/\{\{\s*([a-zA-Z0-9_\s-]+)(?:\|[^}]*)?\s*\}\}/g);
  for (const match of matches) {
    if (match[1]) {
      tags.add(match[1].trim());
    }
  }
  return Array.from(tags);
};

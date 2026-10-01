import { BatchConfig, CampaignHistoryItem, EmailTemplate } from '../types';
import { DEFAULT_BATCH_CONFIG, DEFAULT_TEMPLATES } from '../data/defaults';

const TEMPLATES_KEY = 'mailbatch_templates_v1';
const HISTORY_KEY = 'mailbatch_history_v1';
const CONFIG_KEY = 'mailbatch_config_v1';

export const loadSavedTemplates = (): EmailTemplate[] => {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load templates from localStorage:', err);
  }
  return DEFAULT_TEMPLATES;
};

export const saveTemplates = (templates: EmailTemplate[]): void => {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates to localStorage:', err);
  }
};

export const loadCampaignHistory = (): CampaignHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load history from localStorage:', err);
  }
  return [];
};

export const saveCampaignHistory = (history: CampaignHistoryItem[]): void => {
  try {
    // Keep last 50 campaigns
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
};

export const loadBatchConfig = (): BatchConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_BATCH_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load batch config:', err);
  }
  return DEFAULT_BATCH_CONFIG;
};

export const saveBatchConfig = (config: BatchConfig): void => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save batch config:', err);
  }
};

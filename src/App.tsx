/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Attachment,
  BatchConfig,
  CampaignHistoryItem,
  EmailTemplate,
  Recipient,
} from './types';
import { DEFAULT_TEMPLATES, SAMPLE_DATASETS } from './data/defaults';
import {
  loadBatchConfig,
  loadCampaignHistory,
  loadSavedTemplates,
  saveBatchConfig,
  saveCampaignHistory,
  saveTemplates,
} from './utils/storage';
import { parseCSVText } from './utils/csvParser';
import { googleSignIn, initAuth, logout } from './services/auth';

import { TopBar, TabType } from './components/TopBar';
import { RecipientImporter } from './components/RecipientImporter';
import { EmailComposer } from './components/EmailComposer';
import { BatchDispatcher } from './components/BatchDispatcher';
import { TemplateManager } from './components/TemplateManager';
import { CampaignHistory } from './components/CampaignHistory';
import { LivePreviewModal } from './components/LivePreviewModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('composer');

  // Firebase / Gmail Auth
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Recipient Mailing List
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Email Composer
  const [senderName, setSenderName] = useState('Alex Morgan');
  const [senderEmail, setSenderEmail] = useState('alex.morgan@company.com');
  const [replyTo, setReplyTo] = useState('alex.morgan@company.com');
  const [subject, setSubject] = useState(
    'Exclusive preview for {{Company}}: Accelerate your email workflows'
  );
  const [body, setBody] = useState(DEFAULT_TEMPLATES[0].body);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Batch Delivery & Engine
  const [batchConfig, setBatchConfig] = useState<BatchConfig>(loadBatchConfig());
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryItem[]>([]);

  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize auth listener and saved local state on load
  useEffect(() => {
    // Load initial storage
    setTemplates(loadSavedTemplates());
    setCampaignHistory(loadCampaignHistory());
    setBatchConfig(loadBatchConfig());

    // Pre-populate with first sample dataset if empty
    const defaultSample = SAMPLE_DATASETS[0];
    const parsed = parseCSVText(defaultSample.csv);
    setRecipients(parsed.recipients);
    setAvailableTags(
      parsed.headers.filter((h) => h.toLowerCase() !== parsed.emailColumn.toLowerCase())
    );

    // Initialize Firebase Auth listener
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (currentUser.email) {
          setSenderEmail(currentUser.email);
          setReplyTo(currentUser.email);
          if (currentUser.displayName) {
            setSenderName(currentUser.displayName);
          }
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync templates to localStorage
  useEffect(() => {
    if (templates.length > 0) {
      saveTemplates(templates);
    }
  }, [templates]);

  // Sync history to localStorage
  useEffect(() => {
    saveCampaignHistory(campaignHistory);
  }, [campaignHistory]);

  // Sync batch config
  useEffect(() => {
    saveBatchConfig(batchConfig);
  }, [batchConfig]);

  // Handle Google / Gmail Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        if (res.user.email) {
          setSenderEmail(res.user.email);
          setReplyTo(res.user.email);
          if (res.user.displayName) {
            setSenderName(res.user.displayName);
          }
          // Enable direct Gmail mode once user authenticates
          setBatchConfig((prev) => ({ ...prev, sendMode: 'custom_relay' }));
        }
      }
    } catch (err: any) {
      console.error('Failed to log in:', err);
      alert(`Sign in could not be completed: ${err.message || err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setBatchConfig((prev) => ({ ...prev, sendMode: 'sandbox' }));
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLoadSampleList = () => {
    const sample = SAMPLE_DATASETS[0];
    const parsed = parseCSVText(sample.csv);
    setRecipients(parsed.recipients);
    setAvailableTags(
      parsed.headers.filter((h) => h.toLowerCase() !== parsed.emailColumn.toLowerCase())
    );
    setActiveTab('composer');
  };

  const handleSelectTemplate = (tpl: EmailTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const handleSaveAsTemplate = (name: string, category: EmailTemplate['category']) => {
    const newTpl: EmailTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      description: `Saved from composer on ${new Date().toLocaleDateString()}`,
      category,
      subject,
      body,
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [newTpl, ...prev]);
  };

  const handleApplyTemplateFromLibrary = (tpl: EmailTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
    setActiveTab('composer');
  };

  const handleCampaignComplete = (historyItem: CampaignHistoryItem) => {
    setCampaignHistory((prev) => [historyItem, ...prev]);
  };

  const handleClearAllData = () => {
    if (window.confirm('Reset all applet templates, history, and recipients?')) {
      localStorage.clear();
      setTemplates(DEFAULT_TEMPLATES);
      setCampaignHistory([]);
      setRecipients([]);
      setAvailableTags([]);
      setIsSettingsOpen(false);
    }
  };

  const hasGmailAuth = !!user && !!accessToken;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Bar Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadSample={handleLoadSampleList}
        recipientCount={recipients.length}
        isDispatching={false}
        user={user}
        hasToken={hasGmailAuth}
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'composer' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left 5 Cols: Recipient Mailing List */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RecipientImporter
                recipients={recipients}
                setRecipients={setRecipients}
                availableTags={availableTags}
                setAvailableTags={setAvailableTags}
              />
            </div>

            {/* Right 7 Cols: Email Composer */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <EmailComposer
                senderName={senderName}
                setSenderName={setSenderName}
                senderEmail={senderEmail}
                setSenderEmail={setSenderEmail}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                subject={subject}
                setSubject={setSubject}
                body={body}
                setBody={setBody}
                attachments={attachments}
                setAttachments={setAttachments}
                availableTags={availableTags}
                templates={templates}
                onSelectTemplate={handleSelectTemplate}
                onSaveAsTemplate={handleSaveAsTemplate}
                onOpenPreview={() => setIsPreviewOpen(true)}
                onProceedToDispatch={() => setActiveTab('dispatcher')}
                recipientCount={recipients.length}
              />
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            setTemplates={setTemplates}
            onApplyTemplate={handleApplyTemplateFromLibrary}
          />
        )}

        {activeTab === 'dispatcher' && (
          <BatchDispatcher
            recipients={recipients}
            setRecipients={setRecipients}
            subject={subject}
            body={body}
            attachments={attachments}
            senderName={senderName}
            senderEmail={senderEmail}
            replyTo={replyTo}
            batchConfig={batchConfig}
            setBatchConfig={setBatchConfig}
            onCampaignComplete={handleCampaignComplete}
            onOpenSettings={() => setIsSettingsOpen(true)}
            hasGmailAuth={hasGmailAuth}
            onTriggerGmailLogin={handleLogin}
          />
        )}

        {activeTab === 'history' && (
          <CampaignHistory
            history={campaignHistory}
            setHistory={setCampaignHistory}
          />
        )}
      </main>

      {/* Live Preview Modal */}
      <LivePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        senderName={senderName}
        senderEmail={senderEmail}
        replyTo={replyTo}
        subject={subject}
        body={body}
        attachments={attachments}
        recipients={recipients}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        hasToken={hasGmailAuth}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        batchConfig={batchConfig}
        setBatchConfig={setBatchConfig}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}

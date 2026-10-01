import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Download,
  Code,
  Paperclip,
  AlertTriangle,
  User,
  Check,
} from 'lucide-react';
import { Attachment, Recipient } from '../types';
import { renderTemplate } from '../utils/templateEngine';
import { downloadEmlFile, generateMimeMessage } from '../utils/mimeGenerator';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  subject: string;
  body: string;
  attachments: Attachment[];
  recipients: Recipient[];
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  senderName,
  senderEmail,
  replyTo,
  subject,
  body,
  attachments,
  recipients,
}) => {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    recipients[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showRawMime, setShowRawMime] = useState(false);

  if (!isOpen) return null;

  const currentRecipient =
    recipients.find((r) => r.id === selectedRecipientId) ||
    recipients[0] ||
    ({
      id: 'demo',
      email: 'alex.test@example.com',
      isValid: true,
      fields: {
        FirstName: 'Alex',
        LastName: 'Rivera',
        Company: 'Vanguard Systems',
        Role: 'VP of Technology',
        City: 'San Francisco',
        DiscountCode: 'VIP-PREVIEW',
      },
      status: 'pending',
    } as Recipient);

  const renderedSubjectResult = renderTemplate(subject, currentRecipient);
  const renderedBodyResult = renderTemplate(body, currentRecipient);

  const missingTags = Array.from(
    new Set([...renderedSubjectResult.missingTags, ...renderedBodyResult.missingTags])
  );

  const rawMimeString = generateMimeMessage({
    fromName: senderName || 'MailBatch Sender',
    fromEmail: senderEmail || 'sender@example.com',
    toEmail: currentRecipient.email,
    subject: renderedSubjectResult.rendered,
    bodyHtml: renderedBodyResult.rendered,
    attachments,
  });

  const handleDownloadEml = () => {
    downloadEmlFile(
      {
        fromName: senderName || 'MailBatch Sender',
        fromEmail: senderEmail || 'sender@example.com',
        toEmail: currentRecipient.email,
        subject: renderedSubjectResult.rendered,
        bodyHtml: renderedBodyResult.rendered,
        attachments,
      },
      `preview-${currentRecipient.email.replace(/[^a-zA-Z0-9]/g, '_')}.eml`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Personalized Email Preview
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({recipients.length} recipients loaded)
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Viewport Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode('desktop')}
                className={`rounded p-1 transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`rounded p-1 transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => setShowRawMime(!showRawMime)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                showRawMime
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>{showRawMime ? 'Visual Preview' : 'RFC822 MIME'}</span>
            </button>

            <button
              onClick={handleDownloadEml}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Download standard .eml file to inspect in desktop email client"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Download .eml</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Recipient Picker Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-700">Previewing for:</span>
            <select
              value={currentRecipient.id}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 focus:border-slate-800 focus:outline-hidden"
            >
              {recipients.map((r, i) => (
                <option key={r.id} value={r.id}>
                  #{i + 1}: {r.email} {r.fields.FirstName ? `(${r.fields.FirstName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {missingTags.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Missing fields for this recipient: {missingTags.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          {showRawMime ? (
            <div className="rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
              {rawMimeString}
            </div>
          ) : (
            <div
              className={`mx-auto transition-all ${
                viewMode === 'mobile' ? 'max-w-sm shadow-xl' : 'max-w-2xl shadow-sm'
              }`}
            >
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {/* Email Meta Envelope Header */}
                <div className="border-b border-slate-200 bg-slate-50/90 p-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline">
                      <span className="w-16 font-semibold text-slate-500">From:</span>
                      <span className="font-medium text-slate-900">
                        {senderName || 'Alex Morgan'}{' '}
                        <span className="text-slate-500 font-normal">
                          &lt;{senderEmail || 'alex@company.com'}&gt;
                        </span>
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="w-16 font-semibold text-slate-500">To:</span>
                      <span className="font-medium text-slate-900">
                        {currentRecipient.email}
                      </span>
                    </div>

                    {replyTo && (
                      <div className="flex items-baseline">
                        <span className="w-16 font-semibold text-slate-500">Reply-To:</span>
                        <span className="text-slate-600">{replyTo}</span>
                      </div>
                    )}

                    <div className="flex items-baseline pt-1">
                      <span className="w-16 font-semibold text-slate-500">Subject:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {renderedSubjectResult.rendered || '(No subject provided)'}
                      </span>
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 mt-1">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {attachments.length} attachment(s):
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {attachments.map((a) => (
                            <span
                              key={a.id}
                              className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700"
                            >
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Body rendered HTML */}
                <div className="p-6 text-slate-800 text-sm leading-relaxed prose prose-slate max-w-none">
                  {renderedBodyResult.rendered ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderedBodyResult.rendered,
                      }}
                    />
                  ) : (
                    <p className="text-slate-400 italic">No message body written yet.</p>
                  )}
                </div>

                {/* Simulated Email Client Footer */}
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-center text-[11px] text-slate-400">
                  <span>Rendered via MailBatch Template Engine</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <div className="text-xs text-slate-500">
            Verify placeholders before dispatching campaign.
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

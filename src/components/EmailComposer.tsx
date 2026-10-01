import React, { useState, useRef } from 'react';
import {
  Paperclip,
  Eye,
  FileCode,
  FileText,
  Save,
  Bold,
  Italic,
  List,
  Heading2,
  Link as LinkIcon,
  Tag,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Attachment, EmailTemplate } from '../types';

interface EmailComposerProps {
  senderName: string;
  setSenderName: (val: string) => void;
  senderEmail: string;
  setSenderEmail: (val: string) => void;
  replyTo: string;
  setReplyTo: (val: string) => void;
  subject: string;
  setSubject: React.Dispatch<React.SetStateAction<string>>;
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  availableTags: string[];
  templates: EmailTemplate[];
  onSelectTemplate: (tpl: EmailTemplate) => void;
  onSaveAsTemplate: (name: string, category: EmailTemplate['category']) => void;
  onOpenPreview: () => void;
  onProceedToDispatch: () => void;
  recipientCount: number;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  senderName,
  setSenderName,
  senderEmail,
  setSenderEmail,
  replyTo,
  setReplyTo,
  subject,
  setSubject,
  body,
  setBody,
  attachments,
  setAttachments,
  availableTags,
  templates,
  onSelectTemplate,
  onSaveAsTemplate,
  onOpenPreview,
  onProceedToDispatch,
  recipientCount,
}) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateCategoryInput, setTemplateCategoryInput] = useState<EmailTemplate['category']>('outreach');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          base64: dataUrl,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const insertTagIntoSubject = (tag: string) => {
    setSubject((prev) => `${prev} {{${tag}}}`);
  };

  const insertTagIntoBody = (tag: string) => {
    const tagString = `{{${tag}}}`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const updated = body.substring(0, start) + tagString + body.substring(end);
      setBody(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagString.length, start + tagString.length);
      }, 10);
    } else {
      setBody((prev) => `${prev} ${tagString}`);
    }
  };

  const formatSelection = (wrapperBefore: string, wrapperAfter: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end) || 'text';
    const updated =
      body.substring(0, start) + wrapperBefore + selectedText + wrapperAfter + body.substring(end);
    setBody(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + wrapperBefore.length,
        start + wrapperBefore.length + selectedText.length
      );
    }, 10);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Compile full list of usable tags (including common defaults)
  const allUsableTags = Array.from(
    new Set(['FirstName', 'LastName', 'Company', 'Role', 'email', ...availableTags])
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Sender Identity & Template Loader Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Email Campaign Setup
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Compose message content, map dynamic tags, and attach relevant files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Template Selector */}
            <select
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) onSelectTemplate(found);
              }}
              defaultValue=""
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-xs focus:border-slate-800 focus:outline-hidden"
            >
              <option value="" disabled>
                Load from Templates...
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap"
              title="Save current message as a new template"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              <span>Save Template</span>
            </button>
          </div>
        </div>

        {/* Sender details inputs */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sender Name (From)
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sender Email Address
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="e.g. alex@company.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reply-To Email
            </label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="e.g. replies@company.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Email Subject & Personalization Chips */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-900">
              Subject Line *
            </label>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-medium text-slate-500">Insert tag into subject:</span>
              <button
                type="button"
                onClick={() => insertTagIntoSubject('FirstName')}
                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 hover:bg-slate-100 transition-colors"
              >
                + FirstName
              </button>
              <button
                type="button"
                onClick={() => insertTagIntoSubject('Company')}
                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 hover:bg-slate-100 transition-colors"
              >
                + Company
              </button>
            </div>
          </div>

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Exclusive invitation for {{Company}}: Accelerate your email workflows"
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 focus:border-slate-800 focus:outline-hidden"
          />
        </div>

        {/* Dynamic Personalization Shelf */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mr-2 shrink-0">
            <Tag className="h-3.5 w-3.5 text-slate-500" />
            <span>Click to Insert Variable:</span>
          </div>

          {allUsableTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => insertTagIntoBody(t)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-800 shadow-2xs hover:border-slate-400 hover:bg-slate-50 transition-colors"
              title={`Insert {{${t}}} at cursor`}
            >
              {`{{${t}}}`}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 ml-2 hidden lg:inline">
            (Supports fallbacks like <code className="font-mono bg-slate-200/60 px-1 rounded">{"{{FirstName|there}}"}</code>)
          </span>
        </div>

        {/* Editor Toolbar & Message Body */}
        <div className="mt-4 flex flex-col rounded-lg border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => formatSelection('<strong>', '</strong>')}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Bold (<strong>)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('<em>', '</em>')}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Italic (<em>)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('<h3>', '</h3>')}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Heading 3"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('<ul>\n  <li>', '</li>\n</ul>')}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Bullet List (<ul>)"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('<a href="https://example.com">', '</a>')}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Insert Link (<a>)"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('<code style="background:#f1f5f9;padding:2px 4px;border-radius:4px;">', '</code>')}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Code inline"
              >
                <FileCode className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHtmlMode(!isHtmlMode)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  isHtmlMode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{isHtmlMode ? 'WYSIWYG View' : 'Source HTML'}</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your email message or paste HTML..."
            className="w-full resize-y p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        {/* Attachments Section */}
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-900">
                Attachments ({attachments.length})
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach Files</span>
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800"
                >
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    ({formatFileSize(att.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="ml-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove attachment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            {recipientCount === 0 ? (
              <span className="text-amber-600 font-medium">⚠️ No recipients loaded yet.</span>
            ) : (
              <span>Ready for <strong className="text-slate-800 font-mono tabular-nums">{recipientCount}</strong> recipients.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenPreview}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview Live Email</span>
            </button>

            <button
              type="button"
              onClick={onProceedToDispatch}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <span>Proceed to Dispatcher</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Save Current Message as Template
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Store this subject, body, and placeholders in your reusable template library.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="e.g. Q4 Executive Outreach"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={templateCategoryInput}
                  onChange={(e) => setTemplateCategoryInput(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                >
                  <option value="outreach">Outreach & Sales</option>
                  <option value="announcement">Product Announcement</option>
                  <option value="event">Event Invitation</option>
                  <option value="transactional">Transactional</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (templateNameInput.trim()) {
                      onSaveAsTemplate(templateNameInput.trim(), templateCategoryInput);
                      setShowSaveTemplateModal(false);
                      setTemplateNameInput('');
                    }
                  }}
                  disabled={!templateNameInput.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

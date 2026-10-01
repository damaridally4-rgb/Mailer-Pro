import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Check,
  Search,
  Tag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { EmailTemplate } from '../types';

interface TemplateManagerProps {
  templates: EmailTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  onApplyTemplate: (tpl: EmailTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  setTemplates,
  onApplyTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    templates[0] || null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<EmailTemplate['category']>('outreach');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');

  const filtered = templates.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSubject.trim()) return;

    const created: EmailTemplate = {
      id: `tpl-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom user created template',
      category: newCategory,
      subject: newSubject.trim(),
      body: newBody.trim() || '<p>Hi {{FirstName}},</p><p>Write your message here...</p>',
      updatedAt: new Date().toISOString(),
    };

    setTemplates((prev) => [created, ...prev]);
    setPreviewTemplate(created);
    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
    setNewSubject('');
    setNewBody('');
  };

  const handleDuplicate = (tpl: EmailTemplate) => {
    const cloned: EmailTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [cloned, ...prev]);
    setPreviewTemplate(cloned);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this template?')) {
      const remaining = templates.filter((t) => t.id !== id);
      setTemplates(remaining);
      if (previewTemplate?.id === id) {
        setPreviewTemplate(remaining[0] || null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Email Template Library
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Pre-built campaign layouts with dynamic tag slots and high-converting formatting.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Main Grid: Template List + Template Details Pane */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Template List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Filters & Search */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:outline-hidden"
            />

            <div className="flex flex-wrap items-center gap-1 pt-1">
              {['all', 'announcement', 'outreach', 'event'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors capitalize ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'All Templates' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setPreviewTemplate(tpl)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  previewTemplate?.id === tpl.id
                    ? 'border-slate-800 bg-slate-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    {tpl.name}
                  </h4>
                  <span className="font-mono text-[10px] text-slate-400 capitalize shrink-0">
                    {tpl.category}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {tpl.description}
                </p>

                <p className="mt-2 text-[11px] font-medium text-slate-700 truncate bg-slate-100/70 px-2 py-1 rounded">
                  <span className="text-slate-400 font-normal">Subj:</span> {tpl.subject}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Template Inspector */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          {previewTemplate ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {previewTemplate.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {previewTemplate.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(previewTemplate)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Duplicate template"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Clone</span>
                  </button>

                  <button
                    onClick={() => handleDelete(previewTemplate.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onApplyTemplate(previewTemplate)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <span>Use in Composer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Subject box */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Subject Line Template
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs font-medium text-slate-900">
                  {previewTemplate.subject}
                </div>
              </div>

              {/* Body preview */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Email Body Template (HTML Rendered)
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-800 leading-relaxed max-h-[300px] overflow-y-auto prose prose-slate">
                  <div dangerouslySetInnerHTML={{ __html: previewTemplate.body }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a template to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Create New Email Template
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Design a template for repetitive batch outreach campaigns.
            </p>

            <form onSubmit={handleCreateTemplate} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Enterprise Q3 Follow-up"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  >
                    <option value="outreach">Outreach</option>
                    <option value="announcement">Announcement</option>
                    <option value="event">Event</option>
                    <option value="transactional">Transactional</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short summary..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Hello {{FirstName}}, an update regarding {{Company}}"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Message Body (HTML)
                </label>
                <textarea
                  rows={6}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="<p>Hi {{FirstName|there}},</p><p>We wanted to follow up...</p>"
                  className="w-full font-mono rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

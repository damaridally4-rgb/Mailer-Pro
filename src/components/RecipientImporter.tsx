import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  Plus,
  Download,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';
import { Recipient } from '../types';
import { parseCSVText, exportToCSV } from '../utils/csvParser';
import { SAMPLE_DATASETS } from '../data/defaults';

interface RecipientImporterProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  availableTags: string[];
  setAvailableTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export const RecipientImporter: React.FC<RecipientImporterProps> = ({
  recipients,
  setRecipients,
  availableTags,
  setAvailableTags,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [parsingError, setParsingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessCSV = (rawText: string) => {
    try {
      setParsingError(null);
      const parsed = parseCSVText(rawText);

      if (parsed.recipients.length === 0) {
        setParsingError('No recipient records found. Please ensure the CSV contains an email header.');
        return;
      }

      setRecipients(parsed.recipients);

      // Collect available tags (excluding the primary email column name)
      const tags = parsed.headers.filter(
        (h) => h.toLowerCase() !== parsed.emailColumn.toLowerCase()
      );
      setAvailableTags(tags);
    } catch (err: any) {
      setParsingError(err.message || 'Failed to parse CSV file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleProcessCSV(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleProcessCSV(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (sample) {
      handleProcessCSV(sample.csv);
    }
  };

  const handleAddManualRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newEmail.trim());

    const fields: Record<string, string> = {};
    if (newFirstName.trim()) fields['FirstName'] = newFirstName.trim();
    if (newCompany.trim()) fields['Company'] = newCompany.trim();
    if (newRole.trim()) fields['Role'] = newRole.trim();

    // Ensure tags are in availableTags
    const currentTags = new Set(availableTags);
    Object.keys(fields).forEach((k) => currentTags.add(k));
    setAvailableTags(Array.from(currentTags));

    const newRec: Recipient = {
      id: `rcp-manual-${Date.now()}`,
      email: newEmail.trim(),
      isValid,
      fields,
      status: 'pending',
    };

    setRecipients((prev) => [newRec, ...prev]);
    setNewEmail('');
    setNewFirstName('');
    setNewCompany('');
    setNewRole('');
    setShowAddModal(false);
  };

  const handleDeleteRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    if (recipients.length === 0) return;
    if (window.confirm(`Are you sure you want to remove all ${recipients.length} recipients?`)) {
      setRecipients([]);
      setAvailableTags([]);
    }
  };

  const handleExportCSV = () => {
    if (recipients.length === 0) return;
    const exportData = recipients.map((r) => ({
      email: r.email,
      status: r.status,
      isValid: r.isValid ? 'YES' : 'NO',
      ...r.fields,
      errorMessage: r.errorMessage || '',
      sentAt: r.sentAt || '',
    }));
    exportToCSV(exportData, `recipients-export-${Date.now()}.csv`);
  };

  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch =
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(r.fields).some((v) => v.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'valid') return r.isValid;
    if (statusFilter === 'invalid') return !r.isValid;
    return true;
  });

  const validCount = recipients.filter((r) => r.isValid).length;
  const invalidCount = recipients.length - validCount;

  return (
    <div className="flex flex-col gap-5">
      {/* Upload Zone & Quick Sample Triggers */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? 'border-slate-800 bg-slate-100/80 scale-[0.99]'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 mb-3">
          <FileSpreadsheet className="h-6 w-6" />
        </div>

        <h3 className="text-sm font-semibold text-slate-900">
          Import Recipient Mailing List
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md">
          Drag and drop a CSV or TSV file with columns like <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">email</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">FirstName</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">Company</code>
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Select CSV File</span>
          </button>

          <button
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <ClipboardPaste className="h-3.5 w-3.5 text-slate-500" />
            <span>Paste Table / Text</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {SAMPLE_DATASETS.map((ds) => (
            <button
              key={ds.id}
              onClick={() => handleLoadSample(ds.id)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>{ds.name}</span>
            </button>
          ))}
        </div>

        {parsingError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{parsingError}</span>
          </div>
        )}
      </div>

      {/* Recipient Roster Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Header bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Recipient List
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span>{recipients.length} total</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">{validCount} valid</span>
              {invalidCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-600 font-medium">{invalidCount} invalid</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipients..."
                className="h-8 w-44 sm:w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('valid')}
                className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === 'valid'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valid
              </button>
              {invalidCount > 0 && (
                <button
                  onClick={() => setStatusFilter('invalid')}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                    statusFilter === 'invalid'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Invalid ({invalidCount})
                </button>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              title="Add single recipient"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Add Contact</span>
            </button>

            {recipients.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Export current recipient list"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Clear all recipients"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Available Personalization Tags Bar */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/70 text-xs text-slate-600 overflow-x-auto">
            <span className="font-semibold text-slate-700 shrink-0">Detected Tags:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                {"{{email}}"}
              </span>
              {availableTags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[11px] text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded"
                >
                  {`{{${tag}}}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recipient Table */}
        <div className="overflow-x-auto max-h-[340px] divide-y divide-slate-100">
          {filteredRecipients.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {recipients.length === 0 ? (
                <div>
                  <p className="font-medium text-slate-700">No recipients loaded</p>
                  <p className="mt-1">Import a CSV file or click "Load Sample List" to begin.</p>
                </div>
              ) : (
                <p>No recipients match your search query or filter.</p>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-10">#</th>
                  <th className="px-4 py-2.5">Email Address</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Personalization Fields</th>
                  <th className="px-4 py-2.5 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecipients.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {rec.isValid ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className={rec.isValid ? 'text-slate-900' : 'text-rose-600 underline'}>
                          {rec.email || '(Empty Email)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center text-[11px] font-medium ${
                          rec.status === 'sent'
                            ? 'text-emerald-700'
                            : rec.status === 'failed'
                            ? 'text-rose-600'
                            : rec.status === 'sending'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {rec.status === 'sent' && '✓ Sent'}
                        {rec.status === 'failed' && '✕ Failed'}
                        {rec.status === 'sending' && '● Sending...'}
                        {rec.status === 'queued' && 'Queued'}
                        {rec.status === 'pending' && 'Ready'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <div className="flex flex-wrap items-center gap-1">
                        {Object.entries(rec.fields).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]"
                            title={`${k}: ${v}`}
                          >
                            <span className="text-slate-400 font-mono">{k}:</span> {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteRecipient(rec.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Remove recipient"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Paste Table Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Paste Recipients Data
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Paste comma-separated (CSV) or tab-separated (TSV) values directly from Excel or Google Sheets. The first row must include an <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">email</code> header.
            </p>

            <textarea
              rows={8}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="email,FirstName,Company,Role&#10;john@example.com,John,Acme Corp,Product Lead&#10;sarah@example.com,Sarah,Starlight,Director"
              className="mt-3 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-hidden"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteContent('');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pasteContent.trim()) {
                    handleProcessCSV(pasteContent.trim());
                    setShowPasteModal(false);
                    setPasteContent('');
                  }
                }}
                disabled={!pasteContent.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Add New Recipient
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Manually add a contact to the current campaign cohort.
            </p>

            <form onSubmit={handleAddManualRecipient} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="recipient@company.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Jordan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Acme Inc"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Operations Director"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Add Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  History,
  Calendar,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CampaignHistoryItem } from '../types';
import { exportToCSV } from '../utils/csvParser';

interface CampaignHistoryProps {
  history: CampaignHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<CampaignHistoryItem[]>>;
  onRerunCampaign?: (item: CampaignHistoryItem) => void;
}

export const CampaignHistory: React.FC<CampaignHistoryProps> = ({
  history,
  setHistory,
  onRerunCampaign,
}) => {
  const [selectedItem, setSelectedItem] = useState<CampaignHistoryItem | null>(
    history[0] || null
  );

  const handleExportAudit = (item: CampaignHistoryItem) => {
    const exportData = item.recipients.map((r, i) => ({
      index: i + 1,
      email: r.email,
      status: r.status,
      sentAt: r.sentAt || '',
      latencyMs: r.latencyMs || '',
      errorMessage: r.errorMessage || '',
      ...r.fields,
    }));
    exportToCSV(exportData, `audit-${item.title.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.csv`);
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm('Clear all campaign history records?')) {
      setHistory([]);
      setSelectedItem(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Campaign Delivery History & Logs
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Historical records of dispatched batches, delivery acknowledgments, and failure logs.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900">No campaigns dispatched yet</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Once you run a batch campaign from the Dispatcher tab, the results, timestamps, and recipient audit logs will be permanently logged here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* History List */}
          <div className="lg:col-span-5 flex flex-col gap-2 max-h-[560px] overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-slate-800 bg-slate-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      item.status === 'completed'
                        ? 'text-emerald-700'
                        : item.status === 'stopped'
                        ? 'text-amber-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {item.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                    {item.status === 'failed' && <XCircle className="h-3 w-3" />}
                    <span className="capitalize">{item.status}</span>
                  </span>

                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(item.startedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="mt-2 text-xs font-bold text-slate-900 truncate">
                  {item.title}
                </h4>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                  <span>{item.totalCount} recipients</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">{item.sentCount} sent</span>
                    {item.failedCount > 0 && (
                      <span className="text-rose-600 font-semibold">{item.failedCount} failed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Audit Inspector */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
            {selectedItem ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedItem.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Started: {new Date(selectedItem.startedAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleExportAudit(selectedItem)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Download CSV Audit</span>
                  </button>
                </div>

                {/* Score strip */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500">Total</span>
                    <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                      {selectedItem.totalCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100">
                    <span className="text-[11px] text-emerald-800">Delivered</span>
                    <p className="font-mono text-base font-bold text-emerald-700 tabular-nums">
                      {selectedItem.sentCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-50/50 p-2.5 border border-rose-100">
                    <span className="text-[11px] text-rose-800">Bounced / Failed</span>
                    <p className="font-mono text-base font-bold text-rose-600 tabular-nums">
                      {selectedItem.failedCount}
                    </p>
                  </div>
                </div>

                {/* Recipient Rows */}
                <div className="mt-2 flex flex-col">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">
                    Delivery Log Details
                  </h4>
                  <div className="overflow-y-auto max-h-[340px] divide-y divide-slate-100 border rounded-lg border-slate-200">
                    {selectedItem.recipients.map((rec, idx) => (
                      <div
                        key={rec.id || idx}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="font-medium text-slate-900 truncate">
                            {rec.email}
                          </span>
                          {rec.errorMessage ? (
                            <span className="text-[11px] text-rose-600">
                              {rec.errorMessage}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Delivered successfully {rec.latencyMs ? `(${rec.latencyMs}ms)` : ''}
                            </span>
                          )}
                        </div>

                        <span
                          className={`font-mono text-[11px] font-semibold shrink-0 ${
                            rec.status === 'sent'
                              ? 'text-emerald-700'
                              : rec.status === 'failed'
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {rec.status === 'sent' ? '✓ SENT' : rec.status === 'failed' ? '✕ FAILED' : rec.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select a campaign to inspect delivery logs
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

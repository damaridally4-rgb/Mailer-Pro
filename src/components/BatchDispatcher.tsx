import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  Send,
  Download,
  Terminal,
  RefreshCw,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { Attachment, BatchConfig, CampaignHistoryItem, Recipient, ActivityLog } from '../types';
import { renderTemplate } from '../utils/templateEngine';
import { exportToCSV } from '../utils/csvParser';
import { sendGmailMessage } from '../services/gmail';
import { getAccessToken } from '../services/auth';

interface BatchDispatcherProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  subject: string;
  body: string;
  attachments: Attachment[];
  senderName: string;
  senderEmail: string;
  replyTo: string;
  batchConfig: BatchConfig;
  setBatchConfig: React.Dispatch<React.SetStateAction<BatchConfig>>;
  onCampaignComplete: (historyItem: CampaignHistoryItem) => void;
  onOpenSettings: () => void;
  hasGmailAuth: boolean;
  onTriggerGmailLogin: () => void;
}

export const BatchDispatcher: React.FC<BatchDispatcherProps> = ({
  recipients,
  setRecipients,
  subject,
  body,
  attachments,
  senderName,
  senderEmail,
  replyTo,
  batchConfig,
  setBatchConfig,
  onCampaignComplete,
  onOpenSettings,
  hasGmailAuth,
  onTriggerGmailLogin,
}) => {
  // Campaign dispatch status
  const [dispatchStatus, setDispatchStatus] = useState<
    'idle' | 'running' | 'paused' | 'stopped' | 'completed'
  >('idle');

  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [campaignStartTime, setCampaignStartTime] = useState<string>('');

  // Refs for tracking async cancellation and pause states reliably
  const statusRef = useRef<'idle' | 'running' | 'paused' | 'stopped' | 'completed'>('idle');
  statusRef.current = dispatchStatus;

  const recipientsRef = useRef(recipients);
  recipientsRef.current = recipients;

  const isCancelledRef = useRef(false);
  const isPausedRef = useRef(false);

  const addLog = (
    level: ActivityLog['level'],
    message: string,
    recipientEmail?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
      recipientEmail,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  // Counters
  const totalCount = recipients.length;
  const sentCount = recipients.filter((r) => r.status === 'sent').length;
  const failedCount = recipients.filter((r) => r.status === 'failed').length;
  const pendingCount = recipients.filter(
    (r) => r.status === 'pending' || r.status === 'queued' || r.status === 'sending'
  ).length;

  const percentComplete =
    totalCount > 0 ? Math.round(((sentCount + failedCount) / totalCount) * 100) : 0;

  // Trigger campaign send with confirmation modal
  const handleInitiateSend = () => {
    if (recipients.length === 0) {
      alert('Please import recipients before dispatching.');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter an email subject line before dispatching.');
      return;
    }
    if (!body.trim()) {
      alert('Please compose an email message body before dispatching.');
      return;
    }

    if (batchConfig.sendMode === 'custom_relay' && !hasGmailAuth) {
      alert('Gmail is selected as dispatch mode, but your account is not connected yet. Please connect Gmail first or switch to Sandbox mode.');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSendLoop = async (targetRecipients: Recipient[]) => {
    isCancelledRef.current = false;
    isPausedRef.current = false;
    setDispatchStatus('running');
    const startIso = new Date().toISOString();
    setCampaignStartTime(startIso);

    const isLiveGmail = batchConfig.sendMode === 'custom_relay';

    addLog(
      'info',
      `Campaign initiated with ${targetRecipients.length} recipients. Mode: ${
        isLiveGmail ? 'Live Gmail API' : 'Sandbox Simulation'
      }. Batch size: ${batchConfig.batchSize}, Delay: ${batchConfig.delaySeconds}s.`
    );

    // Split target recipients into batches
    const batches: Recipient[][] = [];
    for (let i = 0; i < targetRecipients.length; i += batchConfig.batchSize) {
      batches.push(targetRecipients.slice(i, i + batchConfig.batchSize));
    }

    for (let b = 0; b < batches.length; b++) {
      if (isCancelledRef.current) {
        addLog('warn', 'Campaign was stopped by user.');
        setDispatchStatus('stopped');
        break;
      }

      // Check for pause
      while (isPausedRef.current) {
        await new Promise((res) => setTimeout(res, 300));
        if (isCancelledRef.current) break;
      }

      if (isCancelledRef.current) break;

      setCurrentBatchIndex(b + 1);
      const currentBatch = batches[b];

      addLog('info', `Dispatching Batch ${b + 1} of ${batches.length} (${currentBatch.length} recipients)...`);

      // Mark batch recipients as 'sending'
      setRecipients((prev) =>
        prev.map((r) =>
          currentBatch.some((cb) => cb.id === r.id) ? { ...r, status: 'sending' } : r
        )
      );

      // Process batch items
      for (const recipient of currentBatch) {
        if (isCancelledRef.current) break;

        const renderedSubject = renderTemplate(subject, recipient).rendered;
        const renderedBody = renderTemplate(body, recipient).rendered;

        const startTime = Date.now();
        let isSuccess = true;
        let errMsg = '';

        if (!recipient.isValid) {
          isSuccess = false;
          errMsg = 'Invalid email syntax / recipient address malformed';
        } else if (isLiveGmail) {
          // Send via real Gmail REST API
          const sendResult = await sendGmailMessage({
            fromName: senderName || 'MailBatch Sender',
            fromEmail: senderEmail,
            toEmail: recipient.email,
            subject: renderedSubject,
            bodyHtml: renderedBody,
            attachments,
          });

          if (!sendResult.success) {
            isSuccess = false;
            errMsg = sendResult.error || 'Gmail API transmission failed';
          }
        } else {
          // Sandbox Mode: Realistic transmission latency & optional simulated bounce test
          const latency = Math.floor(Math.random() * 200) + 150;
          await new Promise((res) => setTimeout(res, latency));

          if (
            batchConfig.failureSimulationRate > 0 &&
            Math.random() * 100 < batchConfig.failureSimulationRate
          ) {
            isSuccess = false;
            const sampleErrors = [
              'Simulated 550 Mailbox unavailable',
              'Simulated 421 Rate limit exceeded',
              'Simulated Network timeout connecting to gateway',
            ];
            errMsg = sampleErrors[Math.floor(Math.random() * sampleErrors.length)];
          }
        }

        const totalLatency = Date.now() - startTime;
        const now = new Date().toLocaleTimeString();

        setRecipients((prev) =>
          prev.map((r) => {
            if (r.id === recipient.id) {
              return {
                ...r,
                status: isSuccess ? 'sent' : 'failed',
                errorMessage: isSuccess ? undefined : errMsg,
                sentAt: isSuccess ? now : undefined,
                latencyMs: totalLatency,
              };
            }
            return r;
          })
        );

        if (isSuccess) {
          addLog('success', `Sent to ${recipient.email} (${totalLatency}ms)`, recipient.email);
        } else {
          addLog('error', `Failed sending to ${recipient.email}: ${errMsg}`, recipient.email);
        }
      }

      // Delay between batches (unless it's the last batch or cancelled)
      if (b < batches.length - 1 && !isCancelledRef.current) {
        addLog('info', `Pacing delay: waiting ${batchConfig.delaySeconds}s before next batch...`);
        for (let sec = batchConfig.delaySeconds; sec > 0; sec--) {
          setCountdownSeconds(sec);
          if (isCancelledRef.current) break;
          while (isPausedRef.current) {
            await new Promise((res) => setTimeout(res, 300));
            if (isCancelledRef.current) break;
          }
          await new Promise((res) => setTimeout(res, 1000));
        }
        setCountdownSeconds(0);
      }
    }

    if (!isCancelledRef.current) {
      setDispatchStatus('completed');
      addLog('success', `Campaign finished! Sent: ${sentCount}, Failed: ${failedCount}.`);

      // Record to history
      const historyItem: CampaignHistoryItem = {
        id: `camp-${Date.now()}`,
        title: subject.substring(0, 45) || 'Untitled Campaign',
        startedAt: startIso,
        completedAt: new Date().toISOString(),
        status: failedCount > 0 ? (sentCount > 0 ? 'completed' : 'failed') : 'completed',
        totalCount: recipientsRef.current.length,
        sentCount: recipientsRef.current.filter((r) => r.status === 'sent').length,
        failedCount: recipientsRef.current.filter((r) => r.status === 'failed').length,
        recipients: [...recipientsRef.current],
        templateSubject: subject,
        attachmentsCount: attachments.length,
      };
      onCampaignComplete(historyItem);
    }
  };

  const handleConfirmStart = () => {
    setShowConfirmModal(false);
    const pendingList = recipients.filter((r) => r.status !== 'sent');
    executeSendLoop(pendingList);
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setDispatchStatus('paused');
    addLog('warn', 'Campaign paused by user. Remaining items held.');
  };

  const handleResume = () => {
    isPausedRef.current = false;
    setDispatchStatus('running');
    addLog('info', 'Campaign resumed.');
  };

  const handleStop = () => {
    if (window.confirm('Are you sure you want to stop sending? Current batch will finish and remaining recipients will not be sent.')) {
      isCancelledRef.current = true;
      isPausedRef.current = false;
      setDispatchStatus('stopped');
      setCountdownSeconds(0);
    }
  };

  const handleResetStatuses = () => {
    if (window.confirm('Reset all recipient statuses to pending?')) {
      setRecipients((prev) =>
        prev.map((r) => ({
          ...r,
          status: 'pending',
          errorMessage: undefined,
          sentAt: undefined,
          latencyMs: undefined,
        }))
      );
      setDispatchStatus('idle');
      addLog('info', 'Recipient status queue reset to pending.');
    }
  };

  const handleRetryFailed = () => {
    const failedList = recipients.filter((r) => r.status === 'failed');
    if (failedList.length === 0) return;

    setRecipients((prev) =>
      prev.map((r) => (r.status === 'failed' ? { ...r, status: 'queued', errorMessage: undefined } : r))
    );

    addLog('info', `Retrying ${failedList.length} failed dispatches...`);
    executeSendLoop(failedList);
  };

  const handleRetrySingle = (recipientId: string) => {
    const target = recipients.find((r) => r.id === recipientId);
    if (!target) return;

    setRecipients((prev) =>
      prev.map((r) => (r.id === recipientId ? { ...r, status: 'queued', errorMessage: undefined } : r))
    );

    addLog('info', `Retrying send for ${target.email}...`);
    executeSendLoop([target]);
  };

  const handleExportAudit = () => {
    const exportData = recipients.map((r, i) => ({
      index: i + 1,
      email: r.email,
      status: r.status,
      sentAt: r.sentAt || '',
      latencyMs: r.latencyMs || '',
      errorMessage: r.errorMessage || '',
      ...r.fields,
    }));
    exportToCSV(exportData, `campaign-audit-log-${Date.now()}.csv`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Banner */}
      {batchConfig.sendMode === 'custom_relay' ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">
                Gmail API Live Dispatch Mode Active
              </h4>
              <p className="text-[11px] text-emerald-700">
                {hasGmailAuth
                  ? `Authenticated! Emails will be sent from your connected Gmail address (${senderEmail}).`
                  : 'Gmail account not connected yet. Please connect your account to begin live dispatches.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasGmailAuth ? (
              <button
                onClick={onTriggerGmailLogin}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition-colors whitespace-nowrap"
              >
                Connect Gmail
              </button>
            ) : (
              <button
                onClick={() =>
                  setBatchConfig((prev) => ({ ...prev, sendMode: 'sandbox' }))
                }
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                Switch to Sandbox
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Safe Sandbox Simulation Mode Active
              </h4>
              <p className="text-[11px] text-slate-500">
                Executes realistic batch timing, countdown intervals, and retry validation without sending actual emails.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setBatchConfig((prev) => ({ ...prev, sendMode: 'custom_relay' }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shadow-2xs"
          >
            Switch to Gmail Mode
          </button>
        </div>
      )}

      {/* Configuration & Pacing Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Batch Delivery & Pacing Controls
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Throttle sending cadence to avoid domain blocks and simulate delivery resilience.
            </p>
          </div>

          <button
            onClick={onOpenSettings}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Adjust Sender & Presets
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Batch Size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Batch Size (recipients / tranche)
              </label>
              <span className="font-mono text-xs font-bold text-slate-900">
                {batchConfig.batchSize}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              disabled={dispatchStatus === 'running'}
              value={batchConfig.batchSize}
              onChange={(e) =>
                setBatchConfig((prev) => ({ ...prev, batchSize: Number(e.target.value) }))
              }
              className="w-full accent-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Groups sends into tranches of {batchConfig.batchSize}
            </p>
          </div>

          {/* Delay Between Batches */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Inter-Batch Delay
              </label>
              <span className="font-mono text-xs font-bold text-slate-900">
                {batchConfig.delaySeconds}s
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              disabled={dispatchStatus === 'running'}
              value={batchConfig.delaySeconds}
              onChange={(e) =>
                setBatchConfig((prev) => ({ ...prev, delaySeconds: Number(e.target.value) }))
              }
              className="w-full accent-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Pauses {batchConfig.delaySeconds}s between each batch
            </p>
          </div>

          {/* Failure Simulation Rate (in sandbox) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Test Failure Rate (Sandbox)
              </label>
              <span className="font-mono text-xs font-bold text-slate-900">
                {batchConfig.failureSimulationRate}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              disabled={dispatchStatus === 'running'}
              value={batchConfig.failureSimulationRate}
              onChange={(e) =>
                setBatchConfig((prev) => ({
                  ...prev,
                  failureSimulationRate: Number(e.target.value),
                }))
              }
              className="w-full accent-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {batchConfig.failureSimulationRate === 0
                ? 'All valid recipients succeed'
                : `Simulates ~${batchConfig.failureSimulationRate}% temporary bounces to test retry`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress & Live Controls Console */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Campaign Dispatch Console
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  dispatchStatus === 'running'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : dispatchStatus === 'paused'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : dispatchStatus === 'completed'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {dispatchStatus === 'running' && 'Active Dispatch'}
                {dispatchStatus === 'paused' && 'Paused'}
                {dispatchStatus === 'completed' && 'Completed'}
                {dispatchStatus === 'stopped' && 'Stopped'}
                {dispatchStatus === 'idle' && 'Idle / Ready'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Subject: <strong className="text-slate-700">{subject || '(No subject set)'}</strong>
            </p>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {dispatchStatus === 'idle' && (
              <button
                onClick={handleInitiateSend}
                disabled={recipients.length === 0}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Batch Campaign</span>
              </button>
            )}

            {dispatchStatus === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause Sending</span>
                </button>

                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop Campaign</span>
                </button>
              </>
            )}

            {dispatchStatus === 'paused' && (
              <>
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume Campaign</span>
                </button>

                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {(dispatchStatus === 'completed' || dispatchStatus === 'stopped') && (
              <>
                <button
                  onClick={handleInitiateSend}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Run Again</span>
                </button>

                <button
                  onClick={handleResetStatuses}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Reset Queue</span>
                </button>
              </>
            )}

            {failedCount > 0 && dispatchStatus !== 'running' && (
              <button
                onClick={handleRetryFailed}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap cursor-pointer"
                title="Retry only contacts that failed"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Failed ({failedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Metrics Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="text-[11px] font-medium text-slate-500">Total Cohort</span>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">
              {totalCount}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              <span>Delivered</span>
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
              {sentCount}
            </div>
          </div>

          <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-rose-800">
              <XCircle className="h-3 w-3" />
              <span>Failed / Bounced</span>
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-rose-600 tabular-nums">
              {failedCount}
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <Clock className="h-3 w-3" />
              <span>Pending / In-Flight</span>
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-700 tabular-nums">
              {pendingCount}
            </div>
          </div>
        </div>

        {/* Progress Bar & Countdown Pacing Indicator */}
        <div className="mt-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Campaign Completion</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {percentComplete}%
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-300 ${
                failedCount > 0 && sentCount === 0
                  ? 'bg-rose-500'
                  : 'bg-slate-900'
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          {countdownSeconds > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 animate-pulse">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Batch delay active: next batch dispatches in {countdownSeconds} seconds...</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Recipient Delivery Audit & Logs Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recipient Roster Status Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Per-Recipient Delivery Status
            </h4>
            <button
              onClick={handleExportAudit}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3 w-3 text-slate-500" />
              <span>Export Audit</span>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[320px] divide-y divide-slate-100">
            {recipients.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No recipients</p>
            ) : (
              recipients.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-[10px] text-slate-400 w-5">
                      #{i + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-medium text-slate-900 truncate">{r.email}</p>
                      {r.errorMessage && (
                        <p className="text-[11px] text-rose-600 truncate">{r.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-medium text-[11px] ${
                        r.status === 'sent'
                          ? 'text-emerald-700'
                          : r.status === 'failed'
                          ? 'text-rose-600'
                          : r.status === 'sending'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {r.status === 'sent' && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sent ({r.latencyMs}ms)
                        </span>
                      )}
                      {r.status === 'failed' && (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                      {r.status === 'sending' && 'Sending...'}
                      {r.status === 'queued' && 'Queued'}
                      {r.status === 'pending' && 'Ready'}
                    </span>

                    {r.status === 'failed' && dispatchStatus !== 'running' && (
                      <button
                        onClick={() => handleRetrySingle(r.id)}
                        className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Retry this contact"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Execution Activity Stream */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-600" />
              <h4 className="text-sm font-semibold text-slate-900">
                Live Dispatch Activity Stream
              </h4>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              {activityLogs.length} events
            </span>
          </div>

          <div className="overflow-y-auto max-h-[320px] rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 divide-y divide-slate-800/80">
            {activityLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic">
                Logs will stream here when batch sending begins.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="py-1.5 flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 select-none">
                    [{log.timestamp}]
                  </span>
                  <span
                    className={
                      log.level === 'success'
                        ? 'text-emerald-400'
                        : log.level === 'error'
                        ? 'text-rose-400 font-semibold'
                        : log.level === 'warn'
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pre-Flight Explicit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Campaign Dispatch
                </h3>
                <p className="text-xs text-slate-500">
                  Please review the plan before beginning transmission.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatch Mode:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {batchConfig.sendMode === 'custom_relay' ? 'Live Gmail API' : 'Sandbox Simulation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Recipients:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {recipients.length} contacts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender Identity:</span>
                <span className="font-medium text-slate-900">
                  {senderName || 'Alex Morgan'} &lt;{senderEmail || 'alex@company.com'}&gt;
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-medium text-slate-900 truncate max-w-xs">
                  {subject}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch Structure:</span>
                <span className="font-mono text-slate-900">
                  {Math.ceil(recipients.length / batchConfig.batchSize)} batches ({batchConfig.batchSize}/batch with {batchConfig.delaySeconds}s delay)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attachments:</span>
                <span className="font-mono text-slate-900">
                  {attachments.length} file(s)
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Confirm & Start Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

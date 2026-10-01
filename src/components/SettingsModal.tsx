import React from 'react';
import { X, Mail, Shield, Sliders, Trash2, LogOut, CheckCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { BatchConfig } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  hasToken: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  batchConfig: BatchConfig;
  setBatchConfig: React.Dispatch<React.SetStateAction<BatchConfig>>;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  hasToken,
  onLogin,
  onLogout,
  isLoggingIn,
  batchConfig,
  setBatchConfig,
  onClearAllData,
}) => {
  if (!isOpen) return null;

  const applyPreset = (preset: 'safe' | 'balanced' | 'fast') => {
    if (preset === 'safe') {
      setBatchConfig((prev) => ({ ...prev, batchSize: 2, delaySeconds: 5 }));
    } else if (preset === 'balanced') {
      setBatchConfig((prev) => ({ ...prev, batchSize: 5, delaySeconds: 2 }));
    } else if (preset === 'fast') {
      setBatchConfig((prev) => ({ ...prev, batchSize: 10, delaySeconds: 1 }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-slate-800" />
            <h3 className="text-base font-bold text-slate-900">
              Settings & Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-6">
          {/* Gmail Account Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Gmail Account Connection
            </h4>

            {user && hasToken ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {user.displayName || 'Connected Account'}
                      </span>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-600">
                  Connect your Google account to send real personalized campaigns directly via Gmail.
                </p>
                <div className="mt-1">
                  <GoogleSignInButton onClick={onLogin} isLoading={isLoggingIn} />
                </div>
              </div>
            )}
          </div>

          {/* Delivery Mode & Engine */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Campaign Dispatch Mode
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                  batchConfig.sendMode === 'custom_relay'
                    ? 'border-slate-900 bg-slate-50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Gmail API Direct</span>
                  <input
                    type="radio"
                    name="sendMode"
                    value="custom_relay"
                    checked={batchConfig.sendMode === 'custom_relay'}
                    onChange={() =>
                      setBatchConfig((prev) => ({ ...prev, sendMode: 'custom_relay' }))
                    }
                    className="accent-slate-900"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Sends live emails through your authenticated Gmail inbox.
                </p>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                  batchConfig.sendMode === 'sandbox'
                    ? 'border-slate-900 bg-slate-50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Sandbox Simulation</span>
                  <input
                    type="radio"
                    name="sendMode"
                    value="sandbox"
                    checked={batchConfig.sendMode === 'sandbox'}
                    onChange={() =>
                      setBatchConfig((prev) => ({ ...prev, sendMode: 'sandbox' }))
                    }
                    className="accent-slate-900"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Safe dry-run testing with real latency, countdowns, and retry verification.
                </p>
              </label>
            </div>
          </div>

          {/* Pacing Presets */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pacing Presets
              </h4>
              <span className="text-[11px] text-slate-400">
                Batch: {batchConfig.batchSize} / Delay: {batchConfig.delaySeconds}s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('safe')}
                className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-2.5 text-center hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-900">Conservative</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">2 / 5s delay</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-2.5 text-center hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-900">Balanced</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">5 / 2s delay</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('fast')}
                className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-2.5 text-center hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-900">Fast Pace</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">10 / 1s delay</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
            <h4 className="text-xs font-bold text-rose-800 mb-1">
              Reset Stored Local Data
            </h4>
            <p className="text-[11px] text-rose-600 mb-3">
              Clear saved campaign logs, custom templates, and recipient cache from browser storage.
            </p>
            <button
              onClick={onClearAllData}
              className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Applet Data</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

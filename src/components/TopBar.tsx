import React from 'react';
import { Send, Users, FileText, History, Settings, Sparkles, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';

export type TabType = 'composer' | 'templates' | 'dispatcher' | 'history';

interface TopBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onLoadSample: () => void;
  recipientCount: number;
  isDispatching: boolean;
  user: User | null;
  hasToken: boolean;
  onLogin: () => void;
  isLoggingIn: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onLoadSample,
  recipientCount,
  isDispatching,
  user,
  hasToken,
  onLogin,
  isLoggingIn,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#composer"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('composer');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-slate-700"
        >
          MailBatch Studio
        </a>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden md:flex items-center gap-1 md:gap-2">
        <button
          onClick={() => setActiveTab('composer')}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'composer'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Recipients & Composer</span>
          {recipientCount > 0 && (
            <span
              className={`ml-1 font-mono text-[10px] ${
                activeTab === 'composer' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              ({recipientCount})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatcher')}
          className={`relative flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'dispatcher'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Batch Dispatcher</span>
          {isDispatching && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>History & Logs</span>
        </button>
      </nav>

      {/* Zone 3: Primary actions & Google connection status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLoadSample}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap"
          title="Load 8 sample conference recipients with personal tags"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Load Sample List</span>
        </button>

        {/* Google / Gmail Auth Indicator */}
        {user && hasToken ? (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100/70 transition-colors"
            title={`Connected as ${user.email}`}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full object-cover border border-emerald-300"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-emerald-200 flex items-center justify-center font-bold text-[10px]">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden lg:inline font-mono truncate max-w-[120px]">
              {user.email}
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          </button>
        ) : (
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-colors whitespace-nowrap"
            title="Connect your Gmail account to send live bulk campaigns"
          >
            <div className="h-3.5 w-3.5 shrink-0">
              <svg viewBox="0 0 48 48" style={{ display: 'block', width: '100%', height: '100%' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <span>{isLoggingIn ? 'Connecting...' : 'Connect Gmail'}</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap"
          title="Campaign and sender settings"
        >
          <Settings className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};

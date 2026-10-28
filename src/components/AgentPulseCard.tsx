import React, { useEffect, useState, useMemo } from 'react';
import {
  Bot,
  Clock,
  RotateCcw,
  Play,
  Pause,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  GitPullRequest,
  Check,
  Undo2
} from 'lucide-react';

export interface AssignedAgent {
  id: string;
  name: string;
  level: string;
  model?: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  timestamp: string;
  summary: string;
  details?: string;
  stage?: 'analyzing' | 'coding' | 'review' | 'submitted' | 'testing';
}

interface AgentPulseCardProps {
  issueId: string;
  issueNumber?: number;
  issueTitle?: string;
  projectId: string;
  agentKey?: string;
  assignedAgent: AssignedAgent;
  lastHeartbeatAt?: string;
}

const STAGES = [
  { key: 'analyzing', label: '1. Diagnosing', desc: 'Tracing bug' },
  { key: 'coding', label: '2. Implementing', desc: 'Editing codebase' },
  { key: 'review', label: '3. Human Gate', desc: 'Decision required' },
  { key: 'submitted', label: '4. PR Linked', desc: 'Awaiting reviews' },
  { key: 'testing', label: '5. Verified', desc: 'Quorum reached' },
] as const;

export const AgentPulseCard: React.FC<AgentPulseCardProps> = ({
  issueId,
  projectId = "project_zedu",
  agentKey,
  assignedAgent,
  lastHeartbeatAt,
}) => {
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: 'init-1',
      type: 'claim.accepted',
      timestamp: '13:28',
      summary: 'Task claimed & lease locked',
      stage: 'analyzing',
    },
    {
      id: 'init-2',
      type: 'analysis.started',
      timestamp: '13:29',
      summary: 'Inspecting general-timeout.tsx & host permissions',
      stage: 'analyzing',
    },
  ]);

  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(
    lastHeartbeatAt ? new Date(lastHeartbeatAt) : new Date()
  );
  const [secondsUntilStale, setSecondsUntilStale] = useState<number>(15 * 60);
  const [activeStage, setActiveStage] = useState<'analyzing' | 'coding' | 'review' | 'submitted' | 'testing'>('coding');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showLogDetails, setShowLogDetails] = useState<boolean>(false);
  const [revisionCount, setRevisionCount] = useState<number>(1);
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // 15-Minute Heartbeat countdown
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const hbTime = lastHeartbeat.getTime();
      const elapsedSeconds = Math.floor((now - hbTime) / 1000);
      setSecondsUntilStale(Math.max(0, 15 * 60 - elapsedSeconds));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastHeartbeat, isPaused]);

  // Real-time stream or Simulation mode
  useEffect(() => {
    let isCancelled = false;
    if (!agentKey || agentKey.trim() === '') return;

    const streamUrl = `https://ziki.dev/api/v1/events/stream?bugId=${issueId}&projectId=${projectId}`;

    async function startStream() {
      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${agentKey}`,
            Accept: 'text/event-stream',
          },
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isCancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const chunk of lines) {
            if (chunk.includes(': ping')) continue;
            const matchEvent = chunk.match(/event:\s*([^\n]+)/);
            const matchData = chunk.match(/data:\s*([^\n]+)/);

            if (matchEvent && matchData) {
              const eventType = matchEvent[1].trim();
              const payload = JSON.parse(matchData[1].trim());
              handleIncomingEvent(eventType, payload);
            }
          }
        }
      } catch (err) {
        console.warn('SSE fallback:', err);
      }
    }

    startStream();
    return () => {
      isCancelled = true;
    };
  }, [issueId, projectId, agentKey]);

  const handleIncomingEvent = (eventType: string, payload: any) => {
    const newEvent: ActivityEvent = {
      id: payload.id || `evt-${Date.now()}`,
      type: eventType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      summary: formatEventSummary(eventType, payload),
      details: payload.notes || payload.title,
    };

    setEvents((prev) => [newEvent, ...prev.slice(0, 5)]);

    if (eventType.includes('heartbeat') || eventType.includes('claim')) {
      setLastHeartbeat(new Date());
    } else if (eventType === 'issue.pr_linked') {
      setActiveStage('submitted');
    } else if (eventType === 'issue.test_verdict') {
      setActiveStage('testing');
    } else if (eventType === 'coding.progress') {
      setActiveStage('review');
    }
  };

  const formatEventSummary = (type: string, data: any): string => {
    switch (type) {
      case 'claim.accepted':
        return 'Claim locked & active';
      case 'comment.created':
        return `Diagnostic note added`;
      case 'issue.pr_linked':
        return `PR #94 linked`;
      case 'issue.test_verdict':
        return `Verified (Good to merge)`;
      case 'heartbeat.ping':
        return 'Heartbeat lease renewed';
      case 'coding.progress':
        return data.summary || 'Solution drafted';
      case 'gate.approved':
        return 'Human approved approach';
      case 'gate.rework':
        return 'Human requested revision';
      default:
        return type;
    }
  };

  const handleApproveGate = () => {
    setActiveStage('submitted');
    handleIncomingEvent('gate.approved', { summary: 'Approach approved: Linking PR #94' });
    setTimeout(() => {
      handleIncomingEvent('issue.pr_linked', { pullRequestUrl: 'https://github.com/Zedu-Endor/zedu-fe/pull/94' });
    }, 600);
  };

  const handleReworkGate = () => {
    setActiveStage('coding');
    setIsRefining(true);
    handleIncomingEvent('gate.rework', { summary: `Rev ${revisionCount} rejected: Re-analyzing route handlers` });

    setTimeout(() => {
      setRevisionCount((prev) => prev + 1);
      setIsRefining(false);
      setActiveStage('review');
      handleIncomingEvent('coding.progress', { summary: `Rev ${revisionCount + 1} ready: Added host_id check before /leave` });
    }, 1500);
  };

  const simulateStep = (stage: 'coding' | 'review' | 'submitted' | 'testing') => {
    if (stage === 'coding') {
      setActiveStage('coding');
      setIsRefining(false);
      handleIncomingEvent('coding.progress', { summary: 'Drafted: /end → /leave' });
    } else if (stage === 'review') {
      setActiveStage('review');
      setIsRefining(false);
      handleIncomingEvent('coding.progress', { summary: 'Solution ready for human review' });
    } else if (stage === 'submitted') {
      setActiveStage('submitted');
      setIsRefining(false);
      handleIncomingEvent('issue.pr_linked', { pullRequestUrl: 'https://github.com/Zedu-Endor/zedu-fe/pull/94' });
    } else if (stage === 'testing') {
      setActiveStage('testing');
      setIsRefining(false);
      handleIncomingEvent('issue.test_verdict', { goodToMerge: true });
    }
  };

  const formattedTimeRemaining = useMemo(() => {
    const mins = Math.floor(secondsUntilStale / 60);
    const secs = secondsUntilStale % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [secondsUntilStale]);

  const currentStageIndex = STAGES.findIndex((s) => s.key === activeStage);
  const currentStageMeta = STAGES[currentStageIndex];

  return (
    <div className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200">
      {/* 1. HERO STATUS: AGENT IDENTITY & PHASE */}
      <div className="p-5 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50 dark:from-indigo-950/40 dark:via-[#111827] dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                  {assignedAgent.name}
                </span>
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium border border-slate-200 dark:border-transparent">
                  {assignedAgent.level}
                </span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{currentStageMeta.label}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({currentStageMeta.desc})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-500">Silence Lease</div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{formattedTimeRemaining}</div>
              </div>
              <button
                onClick={() => {
                  setLastHeartbeat(new Date());
                  handleIncomingEvent('heartbeat.ping', { summary: 'Lease extended' });
                }}
                title="Renew lease"
                className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              title={isPaused ? "Resume Agent" : "Hold Agent"}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
            </button>
          </div>
        </div>

        {/* 2. PROGRESSION BAR */}
        <div className="grid grid-cols-5 gap-2 mt-5">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div key={s.key} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? s.key === 'review' ? 'bg-amber-400 animate-pulse' : 'bg-indigo-600 dark:bg-indigo-500 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      isCurrent
                        ? s.key === 'review' ? 'text-amber-600 dark:text-amber-300' : 'text-indigo-600 dark:text-indigo-300'
                        : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. OPTION B: TWO-WAY INTERACTIVE DECISION GATE */}
      <div className={`p-4 border-b transition-colors duration-200 ${
        isRefining
          ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
          : activeStage === 'review' 
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
          : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${
              isRefining
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : activeStage === 'review'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
            }`}>
              {isRefining ? (
                <RotateCcw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              ) : (
                <GitPullRequest className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Proposed Solution</span>
                {/* Visual Clue 1: Revision pill */}
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                  revisionCount > 1
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  Rev {revisionCount}
                </span>

                <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/60 dark:border-indigo-900 px-1.5 py-0.5 rounded">
                  general-timeout.tsx
                </span>
              </div>

              {/* Visual Clue 2: Solution text changes when refined */}
              <div className="text-[11px] font-mono mt-0.5">
                {isRefining ? (
                  <span className="text-blue-600 dark:text-blue-400 font-sans font-medium animate-pulse">Agent is re-analyzing based on your feedback...</span>
                ) : revisionCount > 1 ? (
                  <span className="text-emerald-700 dark:text-emerald-400">
                    <span className="text-slate-400 dark:text-slate-500 line-through mr-1">/end → /leave</span>
                    <span>Added buzz.host_id check before /leave (Refined)</span>
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400">
                    Replace <span className="text-rose-600 dark:text-rose-400">/end</span> with <span className="text-emerald-600 dark:text-emerald-400">/leave</span> for non-hosts
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Decision Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReworkGate}
              disabled={isRefining || activeStage === 'submitted' || activeStage === 'testing'}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{isRefining ? 'Refining...' : 'Reject / Refine'}</span>
            </button>
            <button
              onClick={handleApproveGate}
              disabled={isRefining || activeStage === 'submitted' || activeStage === 'testing'}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Rev {revisionCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. SIMULATION BAR */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs transition-colors duration-200">
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Stage Simulator:</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => simulateStep('coding')}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              activeStage === 'coding'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Coding
          </button>
          <button
            onClick={() => simulateStep('review')}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              activeStage === 'review'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Gate
          </button>
          <button
            onClick={() => simulateStep('submitted')}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              activeStage === 'submitted'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            PR
          </button>
          <button
            onClick={() => simulateStep('testing')}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition ${
              activeStage === 'testing'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Quorum
          </button>
        </div>
      </div>

      {/* 5. CURRENT ACTION & COLLAPSIBLE HISTORY */}
      <div className="p-4 bg-white dark:bg-[#111827] transition-colors duration-200">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {events[0]?.summary || 'Agent actively running...'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                Recorded at {events[0]?.timestamp || 'just now'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowLogDetails(!showLogDetails)}
            className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition"
          >
            <span>{showLogDetails ? 'Hide' : 'History'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLogDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showLogDetails && (
          <div className="mt-2.5 space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-2.5">
            {events.slice(1).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400"
              >
                <span>{evt.summary}</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{evt.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#0d131f] border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 transition-colors duration-200">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time SSE Stream Active</span>
        </span>
        <a
          href="https://ziki.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition"
        >
          <span>ziki.dev</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

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
  FileCode,
  SlidersHorizontal,
  Sparkles
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
  stage?: 'analyzing' | 'coding' | 'testing' | 'submitted';
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
  { key: 'analyzing', label: '1. Diagnosing', desc: 'Tracing bug & reproducing error' },
  { key: 'coding', label: '2. Implementing', desc: 'Editing codebase & writing fix' },
  { key: 'submitted', label: '3. PR Linked', desc: 'Pull request awaiting reviews' },
  { key: 'testing', label: '4. Verified', desc: '2x Reviewer quorum reached' },
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
  const [activeStage, setActiveStage] = useState<'analyzing' | 'coding' | 'testing' | 'submitted'>('analyzing');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showLogDetails, setShowLogDetails] = useState<boolean>(false);

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
    if (!agentKey || agentKey.trim() === '') {
      return;
    }

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
      setActiveStage('coding');
    }
  };

  const formatEventSummary = (type: string, data: any): string => {
    switch (type) {
      case 'claim.accepted':
        return 'Claim locked & active';
      case 'comment.created':
        return `Diagnostic note added`;
      case 'issue.pr_linked':
        return `PR Linked: ${data.pullRequestUrl ? '#94' : 'Fix ready'}`;
      case 'issue.test_verdict':
        return `Test verdict: ${data.goodToMerge ? 'Verified (Good to merge)' : 'Changes requested'}`;
      case 'heartbeat.ping':
        return 'Heartbeat lease renewed';
      case 'coding.progress':
        return data.summary || 'Code modifications applied';
      default:
        return type;
    }
  };

  const simulateStep = (stage: 'coding' | 'submitted' | 'testing') => {
    if (stage === 'coding') {
      setActiveStage('coding');
      handleIncomingEvent('coding.progress', { summary: 'Replaced /end with /leave in general-timeout.tsx' });
    } else if (stage === 'submitted') {
      setActiveStage('submitted');
      handleIncomingEvent('issue.pr_linked', { pullRequestUrl: 'https://github.com/Zedu-Endor/zedu-fe/pull/94' });
    } else if (stage === 'testing') {
      setActiveStage('testing');
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
    <div className="w-full bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* 1. HERO STATUS: WHAT IS THE AGENT DOING RIGHT NOW */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/40 via-[#111827] to-slate-900 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Agent Identity & Live Phase */}
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                  {assignedAgent.name}
                </span>
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded font-medium">
                  {assignedAgent.level}
                </span>
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>{currentStageMeta.label}</span>
                <span className="text-xs font-normal text-slate-400">({currentStageMeta.desc})</span>
              </div>
            </div>
          </div>

          {/* Lease & Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Heartbeat Badge */}
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500">Silence Lease</div>
                <div className="text-xs font-mono font-bold text-slate-200">{formattedTimeRemaining}</div>
              </div>
              <button
                onClick={() => {
                  setLastHeartbeat(new Date());
                  handleIncomingEvent('heartbeat.ping', { summary: 'Lease extended' });
                }}
                title="Renew lease"
                className="p-1 hover:text-emerald-400 text-slate-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pause/Resume Toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
              title={isPaused ? "Resume Agent" : "Hold Agent"}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* 2. GLANCEABLE 4-STEP VISUAL PROGRESSION */}
        <div className="grid grid-cols-4 gap-2 mt-5">
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
                      ? 'bg-indigo-500 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      isCurrent ? 'text-indigo-300' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SIMULATION ACTION BAR: ONE-CLICK STAGE ADVANCE */}
      <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Interactive Co-Pilot Simulation:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => simulateStep('coding')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              activeStage === 'coding'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Apply Fix
          </button>
          <button
            onClick={() => simulateStep('submitted')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              activeStage === 'submitted'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Link PR
          </button>
          <button
            onClick={() => simulateStep('testing')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              activeStage === 'testing'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Verify Quorum
          </button>
        </div>
      </div>

      {/* 4. CURRENT ACTION & COLLAPSIBLE HISTORY */}
      <div className="p-4 bg-[#111827]">
        {/* Latest Activity Pill */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              {activeStage === 'submitted' ? (
                <FileCode className="w-4 h-4 text-blue-400" />
              ) : activeStage === 'testing' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">
                {events[0]?.summary || 'Agent actively running...'}
              </div>
              <div className="text-[11px] text-slate-500">
                Last recorded action at {events[0]?.timestamp || 'just now'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowLogDetails(!showLogDetails)}
            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            <span>{showLogDetails ? 'Hide History' : 'View History'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLogDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Recent Actions */}
        {showLogDetails && (
          <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
            {events.slice(1).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400"
              >
                <span>{evt.summary}</span>
                <span className="font-mono text-[10px] text-slate-500">{evt.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-[#0d131f] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Real-time SSE Stream Active</span>
        </span>
        <a
          href="https://ziki.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
        >
          <span>ziki.dev</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

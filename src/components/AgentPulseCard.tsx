import React, { useEffect, useState, useMemo } from 'react';
import {
  Bot,
  Activity,
  Clock,
  Terminal,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  FileCode,
  Radio,
  SlidersHorizontal
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
  claimedAt?: string;
  lastHeartbeatAt?: string;
}

export const AgentPulseCard: React.FC<AgentPulseCardProps> = ({
  issueId,
  issueNumber = 1390,
  issueTitle = "Web: non-hosts call /buzz/:id/end at 1-hour call limit and get 403 error toast",
  projectId = "project_zedu",
  agentKey,
  assignedAgent,
  lastHeartbeatAt,
}) => {
  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: 'init-1',
      type: 'claim.accepted',
      timestamp: '13:28:10',
      summary: 'Task claimed by ChatGPT Assistant (Offer accepted within 60s window)',
      stage: 'analyzing',
    },
    {
      id: 'init-2',
      type: 'analysis.started',
      timestamp: '13:29:45',
      summary: 'Inspecting repository code paths at pkg/router/channel.go & general-timeout.tsx',
      details: 'Comparing host_id check against zedu-be PR #15 behavior',
      stage: 'analyzing',
    },
  ]);

  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(
    lastHeartbeatAt ? new Date(lastHeartbeatAt) : new Date()
  );
  const [secondsUntilStale, setSecondsUntilStale] = useState<number>(15 * 60);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<'analyzing' | 'coding' | 'testing' | 'submitted'>('analyzing');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(false);

  // 1. 15-Minute Heartbeat countdown timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const hbTime = lastHeartbeat.getTime();
      const elapsedSeconds = Math.floor((now - hbTime) / 1000);
      const remaining = Math.max(0, 15 * 60 - elapsedSeconds);
      setSecondsUntilStale(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastHeartbeat, isPaused]);

  // 2. Real-time stream or Simulation mode
  useEffect(() => {
    let isCancelled = false;

    if (!agentKey || agentKey.trim() === '') {
      setIsSimulated(true);
      setIsConnected(true);
      return;
    }

    // Attempt real SSE stream if agentKey provided
    const streamUrl = `https://ziki.dev/api/v1/events/stream?bugId=${issueId}&projectId=${projectId}`;

    async function startStream() {
      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${agentKey}`,
            Accept: 'text/event-stream',
          },
        });

        if (!response.ok || !response.body) {
          console.warn('Real SSE unavailable, activating local interactive stream mode');
          if (!isCancelled) {
            setIsSimulated(true);
            setIsConnected(true);
          }
          return;
        }

        if (!isCancelled) {
          setIsConnected(true);
          setIsSimulated(false);
        }

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
        console.warn('SSE fallback to simulation mode:', err);
        if (!isCancelled) {
          setIsSimulated(true);
          setIsConnected(true);
        }
      }
    }

    startStream();

    return () => {
      isCancelled = true;
    };
  }, [issueId, projectId, agentKey]);

  const handleIncomingEvent = (eventType: string, payload: any) => {
    const newEvent: ActivityEvent = {
      id: payload.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: eventType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      summary: formatEventSummary(eventType, payload),
      details: payload.notes || payload.title || payload.detail,
    };

    setEvents((prev) => [newEvent, ...prev.slice(0, 8)]);

    if (eventType === 'claim.extended' || eventType === 'claim.accepted' || eventType === 'heartbeat.ping') {
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
        return 'Claim locked and offer accepted (Active 60s gate)';
      case 'comment.created':
        return `Diagnostic comment: "${(data.body || data.summary || '').slice(0, 50)}..."`;
      case 'issue.pr_linked':
        return `PR linked: ${data.pullRequestUrl || 'https://github.com/Zedu-Endor/zedu-fe/pull/88'}`;
      case 'issue.test_verdict':
        return `Test verdict: ${data.goodToMerge ? 'Verified (Good to merge)' : 'Changes requested'}`;
      case 'heartbeat.ping':
        return 'Heartbeat pinged - active session renewed for 15 minutes';
      case 'coding.progress':
        return data.summary || 'Code modifications applied';
      default:
        return `Platform event: ${type}`;
    }
  };

  // Human actions to test / simulate live handoffs
  const simulateHeartbeat = () => {
    setLastHeartbeat(new Date());
    handleIncomingEvent('heartbeat.ping', { summary: 'Agent refreshed heartbeat via POST /api/v1/issues/:id/heartbeat' });
  };

  const simulateStep = (stage: 'coding' | 'testing' | 'submitted') => {
    if (stage === 'coding') {
      setActiveStage('coding');
      handleIncomingEvent('coding.progress', {
        summary: 'Agent updated general-timeout.tsx to invoke /leave for non-hosts',
        notes: 'Refactored handleTerminateMeeting() to read buzz.host_id',
      });
    } else if (stage === 'submitted') {
      setActiveStage('submitted');
      handleIncomingEvent('issue.pr_linked', {
        pullRequestUrl: 'https://github.com/Zedu-Endor/zedu-fe/pull/94',
        title: 'Fix: replace /end with /leave on timeout for non-host participants',
      });
    } else if (stage === 'testing') {
      setActiveStage('testing');
      handleIncomingEvent('issue.test_verdict', {
        goodToMerge: true,
        notes: '2x Reviewer quorum reached. Passed 375px viewport and timeout simulations.',
      });
    }
  };

  const formattedTimeRemaining = useMemo(() => {
    const mins = Math.floor(secondsUntilStale / 60);
    const secs = secondsUntilStale % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [secondsUntilStale]);

  const healthStatus = secondsUntilStale > 180 ? 'healthy' : secondsUntilStale > 0 ? 'warning' : 'stale';

  return (
    <div className="w-full bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-sans transition-all">
      {/* Top Banner: Agent identity and live status */}
      <div className="px-5 py-4 bg-[#0d131f] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {assignedAgent.name}
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-950/80 text-indigo-300 rounded-md border border-indigo-800/50">
                {assignedAgent.level}
              </span>
              {isSimulated && (
                <span className="px-2 py-0.5 text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800/40 rounded-md flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Live HUD
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Working on Issue #{issueNumber}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 truncate max-w-xs">{issueTitle}</span>
            </p>
          </div>
        </div>

        {/* Live status badge */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-mono text-slate-300">
            {isConnected ? (isSimulated ? 'REACTIVE (SSE SIM)' : 'CONNECTED (SSE)') : 'CONNECTING'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">Ziki Gate 4/6</span>
        </div>
      </div>

      {/* Metrics Row: Heartbeat countdown & phase */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0e1422] border-b border-slate-800/70">
        {/* Heartbeat box */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              healthStatus === 'healthy'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : healthStatus === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Silence Window</div>
              <div className="text-lg font-mono font-bold text-slate-100 flex items-center gap-2">
                {formattedTimeRemaining}
                <span className="text-xs font-normal text-slate-500">/ 15:00</span>
              </div>
            </div>
          </div>
          <button
            onClick={simulateHeartbeat}
            title="Simulate / Send heartbeat refresh"
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Current Phase box */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Execution Phase</div>
            <div className="text-base font-bold text-slate-100 capitalize flex items-center gap-2">
              {activeStage}
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            </div>
          </div>
        </div>

        {/* Human Controls / Handoff */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Human Handoff</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Steer & Intercept</div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title={isPaused ? "Resume agent timer" : "Pause / Hold agent"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1"
            >
              <span>{showInspector ? 'Hide' : 'Inspect'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Step Progression Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0d131f]/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
          <span>Lifecycle Gate Progress</span>
          <span className="font-mono text-indigo-400">
            {activeStage === 'analyzing' && 'Step 1/4: Diagnostic & Reproduction'}
            {activeStage === 'coding' && 'Step 2/4: Fix Implementation'}
            {activeStage === 'submitted' && 'Step 3/4: PR Linked & Ready'}
            {activeStage === 'testing' && 'Step 4/4: Quorum Verified'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="h-2 rounded-full bg-emerald-500 shadow-sm transition-all" title="Step 1: Claimed"></div>
          <div className={`h-2 rounded-full transition-all ${activeStage !== 'analyzing' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`} title="Step 2: Analysis"></div>
          <div className={`h-2 rounded-full transition-all ${activeStage === 'submitted' || activeStage === 'testing' ? 'bg-emerald-500' : activeStage === 'coding' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'}`} title="Step 3: Coding"></div>
          <div className={`h-2 rounded-full transition-all ${activeStage === 'testing' ? 'bg-emerald-500' : activeStage === 'submitted' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'}`} title="Step 4: Review"></div>
        </div>
      </div>

      {/* Interactive Simulation Panel for demo & testing */}
      <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
          <span>Interactive Co-Pilot Trigger:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => simulateStep('coding')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition"
          >
            Apply Fix
          </button>
          <button
            onClick={() => simulateStep('submitted')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition"
          >
            Link PR
          </button>
          <button
            onClick={() => simulateStep('testing')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition"
          >
            Verify Quorum
          </button>
        </div>
      </div>

      {/* Optional Inspector Panel */}
      {showInspector && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs font-mono space-y-2">
          <div className="text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-indigo-300">Agent Reasoning Trace & Context</span>
            <span className="text-[10px] text-slate-500">ID: {assignedAgent.id}</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 space-y-1.5">
            <p className="text-emerald-400">✓ Resolved host permission model in zedu-be PR #15.</p>
            <p className="text-slate-300">→ In non-host clients: replace <code className="text-indigo-300">handleTerminateMeeting()</code> POST <code className="text-rose-300">/buzz/:id/end</code> with POST <code className="text-emerald-300">/buzz/:id/leave</code>.</p>
            <p className="text-slate-400">→ Target Files: <code className="text-slate-200">src/app/(client)/[org]/_components/meeting/general-timeout.tsx</code></p>
          </div>
        </div>
      )}

      {/* Real-time Activity Feed Stream */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Agent Activity & Event Feed</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {events.length} events logged
          </span>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-start space-x-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  {evt.type.includes('pr') ? (
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  ) : evt.type.includes('verdict') ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : evt.type.includes('heartbeat') ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200">{evt.summary}</p>
                  {evt.details && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{evt.details}</p>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-mono ml-3 flex-shrink-0">
                {evt.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-5 py-3 bg-[#0d131f] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Ziki Platform • Autonomous Agent Interaction Gate</span>
        <a
          href="https://ziki.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
        >
          <span>Open in Ziki</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};


import { useState } from 'react';
import { AgentPulseCard, AssignedAgent } from './components/AgentPulseCard';
import {
  GitBranch,
  Users,
  CheckCircle2,
  Bot,
  KeyRound
} from 'lucide-react';

const CONNECTED_AGENTS: AssignedAgent[] = [
  { id: 'cmvit1hcv055wlp01q3uwvewm', name: 'ChatGPT Assistant', level: 'reviewer' },
  { id: 'cmvkb4pp65c3yns0190e801zr', name: 'Reviewer Alpha', level: 'reviewer' },
  { id: 'cmvkb53jy5ca8ns01rxajgyuo', name: 'Reviewer Beta', level: 'reviewer' },
  { id: 'cmvkb6jg25cihns01emmnlyqn', name: 'Reviewer Gamma', level: 'reviewer' },
];

export function App() {
  const [selectedAgent, setSelectedAgent] = useState<AssignedAgent>(CONNECTED_AGENTS[0]);
  const [agentKey, setAgentKey] = useState<string>('ziki_ugmJf2KbXQYF34xlU_HgwoJVd9JETik6pARbUCcWA6E');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* 1. COMPACT TOP HEADER */}
      <header className="border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
            Z
          </div>
          <span className="font-bold text-base text-white tracking-tight">Ziki</span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-semibold text-slate-300">Ziki (project_zedu)</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Agent Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedAgent.id}
              onChange={(e) => {
                const found = CONNECTED_AGENTS.find((a) => a.id === e.target.value);
                if (found) setSelectedAgent(found);
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {CONNECTED_AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id} className="bg-slate-900 text-slate-100">
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Configure API Key"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Key input bar */}
      {showKeyInput && (
        <div className="bg-slate-900 border-b border-indigo-500/30 px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-slate-400 font-mono text-[11px]">Key:</span>
            <input
              type="password"
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              placeholder="ziki_..."
              className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-slate-200 font-mono text-xs w-full focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-5">
        {/* Issue Summary Banner */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                #1390
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded">
                Open
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded">
                Medium
              </span>
              <span className="text-xs text-slate-500">frontend • audio/video</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Web: non-hosts call /buzz/:id/end at 1-hour call limit and get 403 error toast
            </h1>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>cmvaubiob...</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitBranch className="w-3.5 h-3.5 text-slate-500" />
              <span>staging</span>
            </div>
          </div>
        </div>

        {/* AGENT CO-PILOT HUD: GLANCEABLE CORE */}
        <AgentPulseCard
          issueId="cmvnv6afb0nafmt0116alj554"
          issueNumber={1390}
          issueTitle="Web: non-hosts call /buzz/:id/end at 1-hour limit"
          projectId="project_zedu"
          agentKey={agentKey}
          assignedAgent={selectedAgent}
        />

        {/* COMPACT BOTTOM GRID: QUORUM & FIX GOAL AT A GLANCE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quorum Gate Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between font-semibold text-slate-300">
              <span>Required Quorum Verification</span>
              <span className="text-emerald-400 font-mono font-bold">2 / 2 Passed</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-[11px] truncate">Reviewer 1</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-[11px] truncate">Reviewer 2</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-[11px] truncate">Triager</span>
              </div>
            </div>
          </div>

          {/* Quick Expected Solution Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-300">
              <span>Target Solution</span>
              <span className="text-indigo-400 font-mono">Bounty: 750 pts</span>
            </div>
            <p className="text-slate-400 leading-snug">
              In <code className="text-indigo-300">general-timeout.tsx</code>, switch non-host calls from <code className="text-rose-400">/end</code> to <code className="text-emerald-400">/leave</code>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;

import { useState } from 'react';
import { AgentPulseCard, AssignedAgent } from './components/AgentPulseCard';
import {
  GitBranch,
  Users,
  CheckCircle2,
  Sparkles,
  Bot,
  KeyRound,
  ExternalLink
} from 'lucide-react';

const CONNECTED_AGENTS: AssignedAgent[] = [
  {
    id: 'cmvit1hcv055wlp01q3uwvewm',
    name: 'ChatGPT Assistant',
    level: 'reviewer',
    model: 'GPT-4o',
  },
  {
    id: 'cmvkb4pp65c3yns0190e801zr',
    name: 'ChatGPT Reviewer Alpha',
    level: 'reviewer',
    model: 'Claude 3.5 Sonnet',
  },
  {
    id: 'cmvkb53jy5ca8ns01rxajgyuo',
    name: 'ChatGPT Reviewer Beta',
    level: 'reviewer',
    model: 'Claude 3.5 Sonnet',
  },
  {
    id: 'cmvkb6jg25cihns01emmnlyqn',
    name: 'ChatGPT Reviewer Gamma',
    level: 'reviewer',
    model: 'Claude 3.5 Sonnet',
  },
];

export function App() {
  const [selectedAgent, setSelectedAgent] = useState<AssignedAgent>(CONNECTED_AGENTS[0]);
  const [agentKey, setAgentKey] = useState<string>('ziki_ugmJf2KbXQYF34xlU_HgwoJVd9JETik6pARbUCcWA6E');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              Z
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">Ziki</span>
          </div>

          <div className="hidden sm:flex items-center text-xs font-medium text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg space-x-2">
            <span className="text-slate-500">Project:</span>
            <span className="text-slate-200 font-semibold">Ziki (project_zedu)</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono">958 issues</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Agent Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Bot className="w-4 h-4 text-indigo-400" />
            <select
              value={selectedAgent.id}
              onChange={(e) => {
                const found = CONNECTED_AGENTS.find((a) => a.id === e.target.value);
                if (found) setSelectedAgent(found);
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {CONNECTED_AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id} className="bg-slate-900 text-slate-100">
                  {agent.name} ({agent.level})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Configure API Key"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Key Drawer / Bar */}
      {showKeyInput && (
        <div className="bg-slate-900/90 border-b border-indigo-500/30 px-6 py-2.5 flex items-center justify-between text-xs transition-all">
          <div className="flex items-center space-x-2 w-full max-w-xl">
            <span className="text-slate-400 font-mono">Agent Key:</span>
            <input
              type="password"
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              placeholder="ziki_..."
              className="bg-slate-950 border border-slate-700 px-3 py-1 rounded text-slate-200 font-mono text-xs w-full focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-slate-500 text-[11px]">
            Connected to <code>https://ziki.dev</code>
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Issue Context & Details (2 columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Header */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                #1390
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                Status: Open
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                Severity: Medium
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-slate-300 rounded-md">
                frontend • buzz • audio/video
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Web: non-hosts call /buzz/:id/end at the 1-hour call limit and get a 403 error toast; they should call /leave
            </h1>

            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Reporter: <strong className="text-slate-300">cmvaubiob...</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                <span>Branch: <strong className="text-slate-300">staging</strong></span>
              </div>
            </div>
          </div>

          {/* THE HUMAN-AGENT CO-PILOT HUD COMPONENT */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Agent Co-Pilot & Execution HUD
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Transparent Execution & Heartbeat
              </span>
            </div>

            <AgentPulseCard
              issueId="cmvnv6afb0nafmt0116alj554"
              issueNumber={1390}
              issueTitle="Web: non-hosts call /buzz/:id/end at 1-hour limit"
              projectId="project_zedu"
              agentKey={agentKey}
              assignedAgent={selectedAgent}
            />
          </div>

          {/* Description Section */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Issue Specification
            </h3>
            <div className="prose prose-invert text-sm text-slate-300 space-y-3 leading-relaxed">
              <p>
                The 1-hour call limit (<code className="text-indigo-300">general-timeout.tsx</code>) runs in every participant's browser. When the hour is up, and when anyone clicks "Leave now" in the "Call ending soon" popup, it calls <code className="text-rose-300">POST /buzz/:id/end</code>.
              </p>
              <p>
                Since zedu-be PR #15 (Ziki #1264), only the buzz host may end a buzz, so non-hosts get a 403 and <code className="text-indigo-300">PostRequest</code> shows the error toast "only the buzz host can perform this action".
              </p>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                <strong className="text-emerald-400 block mb-1">Expected Behavior:</strong>
                Only the host's browser calls <code className="text-indigo-300">/end</code>. Everyone else calls <code className="text-emerald-300">POST /buzz/:id/leave</code> and closes their call UI, with no error toast.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction & Collaboration Sidebar */}
        <div className="space-y-6">
          {/* Quorum & Validation Matrix Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Ziki Quorum Gates</span>
              <span className="text-indigo-400 font-mono">2 / 2 Required</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Reviewer 1 Confirmation</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Real (Med)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Reviewer 2 Confirmation</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Real (Med)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Triager Clearance</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Cleared</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800">
              Each reviewer must be an independent owner to qualify for confirmation bounty.
            </div>
          </div>

          {/* Points & Bounty Breakdown */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Bounty Allocation
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Solver Reward (Medium):</span>
                <strong className="text-emerald-400 font-mono">750 pts</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Reporter Bounty:</span>
                <strong className="text-indigo-400 font-mono">150 pts</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Reviewer Sign-offs (x2):</span>
                <strong className="text-slate-200 font-mono">300 pts</strong>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl text-xs space-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Reference Links
            </span>
            <a
              href="https://ziki.dev/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-slate-300 hover:text-indigo-400 py-1 transition"
            >
              <span>Ziki Agent API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://ziki.dev/issues/cmvnv6afb0nafmt0116alj554"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-slate-300 hover:text-indigo-400 py-1 transition"
            >
              <span>Issue #1390 in Ziki</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;


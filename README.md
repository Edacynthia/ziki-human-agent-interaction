# Ziki Human-Agent Interaction: Co-Pilot HUD

An interactive, frontend-only enhancement for **Ziki (https://ziki.dev)** designed to bridge the trust and transparency gap during human-agent collaboration.

---

## 💡 The Problem Addressed

During the Ziki task lifecycle, once an agent claims an issue or begins work (Gate 4 of 6), the human owner is left in a "black box" state between 15-minute heartbeats. The human has no visibility into whether the agent is analyzing dependencies, reproducing bugs, generating tests, or stuck in an execution loop.

This project delivers the **Agent Co-Pilot HUD & Pulse Card**:
1. **Live Heartbeat Countdown & Silence Window:** Visual countdown to the 15-minute timeout.
2. **Phase & Execution Breadcrumbs:** Shows whether the agent is in *Diagnostic & Reproduction*, *Fix Implementation*, *PR Linking*, or *Verification*.
3. **Reactive Action Feed:** Displays incoming events in real-time (via Ziki SSE stream `GET /api/v1/events/stream` or interactive simulation).
4. **Human Handoff & Interception:** Allows humans to pause the timer, inspect the agent's internal reasoning traces, or trigger manual reviews.

---

## 🚀 How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Install Dependencies
Open your terminal in this directory and run:
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to:
```
http://localhost:3000
```

---

## 🛠️ Features & Controls in the UI

- **Agent Switcher (Top Right):** Toggle between your connected Ziki agents (`ChatGPT Assistant`, `ChatGPT Reviewer Alpha`, `Beta`, `Gamma`).
- **Interactive Co-Pilot Trigger:** Click **Apply Fix**, **Link PR**, or **Verify Quorum** to simulate real lifecycle stage transitions.
- **Heartbeat Refresh:** Click the refresh icon next to the countdown to simulate the agent renewing its 15-minute lease.
- **Inspect Drawer:** Click **Inspect** to reveal the agent's underlying diagnostic findings and code paths.
- **Configure Agent Key:** Click the key icon in the navbar to connect to your real Ziki API key for live SSE streams.


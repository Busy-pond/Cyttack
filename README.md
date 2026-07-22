<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=2500&pause=1000&color=2E5EAA&center=true&vCenter=true&width=700&lines=Cyttack;AI-Driven+Cyber+Resilience;From+Weeks+to+Hours." alt="Typing SVG" />

**AI-Driven Cyber Resilience for Critical National Infrastructure**

Built for ET AI Hackathon 2026 — Problem Statement 7

[![Live Demo](https://img.shields.io/badge/Live%20Demo-cyttack--cyttack.vercel.app-2E5EAA?style=for-the-badge&logo=vercel&logoColor=white)](https://cyttack-cyttack.vercel.app/)
[![Repo](https://img.shields.io/badge/Repo-a34656%2FCyttack-1A1F3D?style=for-the-badge&logo=github&logoColor=white)](https://github.com/a34656/Cyttack)
[![License](https://img.shields.io/badge/License-MIT-2E9E5B?style=for-the-badge)](#)

![Python](https://img.shields.io/badge/Python-ML%20Backend-3776AB?style=flat-square&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Monorepo-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-API%20Server-000000?style=flat-square&logo=express&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-MITRE%20Mapping-D97757?style=flat-square&logo=anthropic&logoColor=white)

</div>

<br/>

## 🎯 Problem

Critical national infrastructure is increasingly targeted by advanced persistent threats. With **70% of government entities** running end-of-life IT infrastructure, signature-based detection tools structurally fail against low-and-slow APTs — they can only catch what they've already seen.

> Cyttack is a behavioral intelligence layer that detects deviations from normal network activity **without depending on known malware signatures**, and reasons about what those deviations mean using an LLM-powered MITRE ATT&CK mapping layer.

<br/>

## ⚡ What Cyttack Does

Cyttack combines three layers, each doing what it's actually good at:

<table>
<tr>
<td width="33%" valign="top">

### 🧠 1. Behavioral Anomaly Engine
*unsupervised, multi-agent*

Learns what "normal" network traffic looks like from a clean baseline day, then scores live traffic for deviation — **no attack labels required**.

Implemented as per-network-segment agents (web, DNS, remote-access, mail, database) rather than one global model, since different services have genuinely different normal-traffic shapes. Each segment agent is an independently trained **Isolation Forest**.

</td>
<td width="33%" valign="top">

### 🎯 2. Known-Attack Classifier
*supervised*

An **XGBoost** multiclass model trained on labeled attack traffic, providing high-confidence identification of known attack types (DDoS, PortScan, Patator brute-force, DoS variants, web attacks, etc.).

Feeds a strong prior into the MITRE mapping layer.

</td>
<td width="33%" valign="top">

### 🗺️ 3. MITRE ATT&CK Mapping Agent
*LLM reasoning layer*

Flagged anomalies are passed to **Claude**, which maps each one to a MITRE ATT&CK tactic/technique, assigns a severity and confidence score, explains its reasoning, and recommends a containment action — in structured JSON, ready to drive downstream automation.

</td>
</tr>
</table>

> **Two-speed architecture:** ML detection is fast and cheap and runs on every flow; LLM reasoning is slower and richer and only runs on the small filtered set of flagged events.

<br/>

## 🔍 Why Two Detectors, Not One

| | 🧠 Behavioral Anomaly Engine<br>(Isolation Forest) | 🎯 Known-Attack Classifier<br>(XGBoost) |
|---|---|---|
| **Learns from** | Only benign baseline traffic | Labeled attack examples |
| **Catches** | Novel / previously unseen deviations | Attacks matching known patterns |
| **Miss case** | Subtle attacks that don't diverge much from baseline | Genuinely new attack types it's never seen |
| **Detection accuracy** | Lower, noisier | Very high on seen attack types |

Signature-based tools are exactly the "known-attack classifier" side of this table — accurate on what they've seen, blind to what they haven't. Cyttack keeps that capability but layers the unsupervised engine on top specifically to cover its blind spot, which is the core ask of Problem Statement 7.

<br/>

## 📊 Detection Performance

Evaluated on **CICIDS2017**: trained on Monday's clean baseline traffic, threshold tuned on Friday's DDoS traffic, tested unseen on the remaining 6 days/attack files.

<details open>
<summary><b>Behavioral Anomaly Engine (multi-agent, segment-based)</b></summary>
<br/>

| Attack type | Recall | False Positive Rate |
|---|:---:|:---:|
| DDoS | `73.3%` | `42.5%` |
| DoS (Hulk/GoldenEye/slowloris) | `81.5%` | `16.2%` |
| FTP/SSH Patator (brute force) | `80.3%` | `15.8%` |
| Infiltration* | `94.4%` | `17.9%` |
| Bot | `28.6%` | `15.4%` |
| Web Attacks (XSS/SQLi/Brute Force) | `11.3%` | `14.7%` |
| PortScan | `3.1%` | `14.8%` |

<sub>*Infiltration has only 36 labeled samples in the test file — treat this recall figure as low-confidence.</sub>

</details>

<details>
<summary><b>Known-Attack Classifier (XGBoost, held-out test split)</b></summary>
<br/>

**99–100%** precision/recall on DDoS, PortScan, DoS variants, and Patator.

Weaker on classes with very few samples (Heartbleed: 3 samples, SQL Injection: 5 samples — reported honestly as statistically unreliable rather than hidden) and on XSS (F1 ≈ 0.29, a genuine model limitation, not a sample-size artifact).

</details>

<details>
<summary><b>⚠️ Known limitation, stated honestly</b></summary>
<br/>

The unsupervised engine's precision drops sharply on very rare attack classes (Infiltration, Bot) — this is expected base-rate math (a small number of true positives against a much larger false-positive pool when the attack itself is 0.01–1% of traffic), not a broken model.

PortScan and Web Attacks remain the two weakest cases for the anomaly engine specifically because their traffic overlaps heavily with legitimate short-connection or legitimate web-request behavior — a documented, explainable limitation rather than a bug.

</details>

<br/>

## 🏗️ Architecture

Cyttack is split into two cooperating parts:

- **ML / MITRE reasoning backend (Python)** — trains and runs the anomaly detection models, the known-attack classifier, and the Claude-powered MITRE ATT&CK mapping agent. This is where the detection intelligence lives.
- **Application layer (TypeScript monorepo)** — the live dashboard, API server, and database. Serves the results (alerts, entities, campaigns, predictions, etc.) produced by the ML/MITRE backend to the SOC Analyst / CISO dashboard in real time.

```
backend/                          Python ML + MITRE reasoning layer
├── data/raw/                     CICIDS2017 CSVs (Monday–Friday, benign + labeled attacks)
├── ml/
│   ├── train_anomaly_model.py         Global Isolation Forest baseline
│   ├── multi_agent_baseline.py        Per-segment Isolation Forest agents (web/dns/remote_access/mail/database/other)
│   ├── train_supervised_classifier.py XGBoost known-attack classifier
│   └── mitre_mapper.py                Claude-powered MITRE ATT&CK reasoning agent
├── models/                        Trained model artifacts (.joblib)
├── api/                           FastAPI backend (threat feed, upload, metrics, containment routes)

artifacts/
├── cyttack/                       Frontend — Vite + React SOC dashboard
└── api-server/                    Express API server — serves dashboard/alerts/entities data via Drizzle ORM

lib/
└── db/                            Drizzle ORM schema + Postgres (Supabase) config
```

<details>
<summary><b>🔄 How It Works, End to End</b></summary>
<br/>

1. The Python ML backend trains on CICIDS2017 baseline + labeled attack traffic and produces two scoring layers: the unsupervised anomaly engine and the supervised known-attack classifier.
2. Flagged/anomalous flows are passed to the MITRE mapping agent, which uses Claude to map each one to a MITRE ATT&CK tactic/technique, assign severity/confidence, and recommend a containment action, in structured JSON.
3. This output feeds into the application layer's Postgres database (entities, alerts, campaigns, predictions, etc.) via the Drizzle-backed API server.
4. The React dashboard queries the API server in real time to render active incidents, the Global Risk Index, AI predictions, and the live attack simulation feed for SOC Analysts and CISOs.

</details>

<br/>

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|---|---|
| **ML** | scikit-learn (Isolation Forest), XGBoost, pandas, numpy |
| **LLM Reasoning** | Anthropic Claude API (MITRE ATT&CK mapping) |
| **ML Backend** | FastAPI, uvicorn, pydantic |
| **App Backend** | Node.js, Express, Drizzle ORM, PostgreSQL (Supabase) |
| **Frontend** | Vite, React, TypeScript, Tailwind CSS — deployed on Vercel |
| **Dataset** | CICIDS2017 (Canadian Institute for Cybersecurity) |

</div>

<br/>

## 🚀 Getting Started

### 1. ML / MITRE backend (Python)

```bash
git clone https://github.com/a34656/Cyttack.git
cd Cyttack/backend
pip install -r requirements.txt --break-system-packages

# Place CICIDS2017 CSVs in backend/data/raw/, then:

# Global behavioral baseline
python ml/train_anomaly_model.py \
  --train data/raw/Monday-WorkingHours.pcap_ISCX.csv \
  --tune-on data/raw/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv \
  --test data/raw/Tuesday-WorkingHours.pcap_ISCX.csv data/raw/Wednesday-workingHours.pcap_ISCX.csv \
         data/raw/Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv \
         data/raw/Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv \
         data/raw/Friday-WorkingHours-Morning.pcap_ISCX.csv \
         data/raw/Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv

# Multi-agent segment baseline
python ml/multi_agent_baseline.py --train ... --tune-on ... --test ...   # same file args as above

# Known-attack classifier
python ml/train_supervised_classifier.py --data data/raw/*.pcap_ISCX.csv

# MITRE mapping agent (requires ANTHROPIC_API_KEY set in environment)
python ml/mitre_mapper.py
```

### 2. Application layer (dashboard + API server)

This is the pnpm monorepo that powers the live SOC dashboard and serves data to the frontend.

**Prerequisites:** Node.js, [pnpm](https://pnpm.io/), a PostgreSQL database (this project uses [Supabase](https://supabase.com/)).

**Install dependencies:**
```bash
cd Cyttack
pnpm install
```

If pnpm blocks native build scripts (esbuild, lightningcss, etc.) on first install, approve them once:
```bash
pnpm approve-builds
```

**Set your database connection.**
Get your connection string from Supabase → **Connect** button (top of the project dashboard) → **Transaction pooler** (recommended — works reliably across networks and hosting providers; the direct connection string can fail on networks/hosts without IPv6 support).

> ⚠️ If your database password contains special characters (`@`, `#`, `$`, `%`, etc.), URL-encode them (e.g. `@` → `%40`, `$` → `%24`) or the connection string will fail to parse.

In your terminal, before starting the API server:
```bash
export DATABASE_URL="postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
export PORT=5000
```
> On Windows PowerShell, use `$env:DATABASE_URL="..."` and `$env:PORT="5000"` instead — and set these in the *same terminal session* you run the server from, since PowerShell env vars don't persist across windows.

**Push the database schema:**
```bash
pnpm --filter @workspace/db run push
```

**Run the API server** (Terminal 1):
```bash
pnpm --filter @workspace/api-server run dev
```

**Run the frontend dashboard** (Terminal 2):
```bash
pnpm --filter @workspace/cyttack run dev
```

Open the URL Vite prints (typically `http://localhost:5173`), navigate to `/dashboard`, and click **Start Live Attack Simulation**. 🎬

<br/>

### 📋 Useful Commands

| Task | Command |
|---|---|
| Full workspace build | `pnpm run build` |
| Typecheck codebase | `pnpm run typecheck` |
| Push DB schema changes | `pnpm --filter @workspace/db run push` |
| Regenerate API client/schemas | `pnpm --filter @workspace/api-spec run codegen` |

<br/>

### ☁️ Deployment

- **Frontend:** deployed on Vercel. Set `VITE_API_URL` to your deployed API server's public URL (e.g. `https://cyttack.onrender.com`) so the frontend knows where to send `/api/*` requests — Vercel doesn't proxy these automatically the way a local dev server does.
- **API server:** deployed on a host that supports long-running Node processes (e.g. Render, Railway, Fly.io) since it isn't a serverless function. Set `DATABASE_URL` (Supabase pooler connection string, URL-encoded), `SESSION_SECRET`, and `NODE_ENV=production`. Leave `PORT` unset — most hosts (including Render) assign and inject it automatically.
- Make sure the API server's CORS configuration allows requests from your deployed frontend's domain.

<br/>

## 🧭 Known Limitations & Roadmap

- [ ] **No Source IP or Timestamp in the dataset** — CICIDS2017's reduced flow-feature CSVs strip identity metadata, so true per-user and per-device behavioral baselines (as opposed to per-network-segment) aren't buildable from this data. Documented here rather than simulated with fake identities.
- [ ] **Ensemble combination** (flag if either the global OR segment-specific model detects an anomaly) is identified as the next highest-impact improvement — segment agents help some attack types (Patator, DoS) and hurt others (Web Attacks) relative to the global model; combining both is expected to recover the best of each.
- [ ] **Autonomous Incident Response Orchestrator** — the containment-action execution layer (isolate endpoint, block IP, snapshot VM) is designed but not yet wired to live actions; currently the MITRE mapper recommends an action without executing it.
- [ ] **Campaign correlation** (grouping related flagged events into a single attack campaign rather than isolated alerts) is planned; would benefit from richer telemetry with host identity.

<br/>

## 👥 Team

Built by a 2-person team for ET AI Hackathon 2026.

<br/>

## 📚 Dataset Citation

Sharafaldin, I., Lashkari, A.H., and Ghorbani, A.A. (2018). *Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization.* 4th International Conference on Information Systems Security and Privacy (ICISSP), Portugal, January 2018. (CICIDS2017)

<br/>

<div align="center">

**[⬆ Back to Top](#)**

<sub>Built with 🛡️ for a more resilient digital India.</sub>

</div>

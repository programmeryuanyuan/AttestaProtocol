![Network](https://img.shields.io/badge/network-0G%20Chain%20Aristotle-purple)
![Contract](https://img.shields.io/badge/contract-deployed-brightgreen)
![Built for](https://img.shields.io/badge/built%20for-0G%20Zero%20Cup-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

<a id="readme-top"></a>

<div align="center">

# Attesta Protocol

**The AI quality certification protocol on 0G.**  
**The evaluator sees nothing — yet every certificate is provable on-chain.**

*No jury. No oracle. No human. Pure cryptographic and hardware guarantee.*

[Try It Now](https://attesta-protocol.vercel.app/try) · [Live Dashboard](https://attesta-protocol.vercel.app/dashboard) · [Contract on 0G Chain](https://chainscan.0g.ai/address/0xCd1563bb446a209C5817Ff3F4Bd80afF441034da) · [GitHub](https://github.com/programmeryuanyuan/AttestaProtocol)

</div>

---

**Project at a Glance**
- Any AI agent submits output → sealed TEE evaluates without seeing content → **Quality Certificate issued on-chain** → escrow auto-settles
- Built as a protocol primitive — any 0G app calls `requestCertification()` to register a request; TEE relayer resolves it via `resolveExternalCert()` → `CertificateIssued` emitted on-chain
- Deployed on 0G Chain Aristotle (Chain ID 16661) · Contract verifiable at `chainscan.0g.ai`

---

<details>
<summary>Table of Contents</summary>

1. [Problem & Solution](#1-problem--solution)
2. [Demo](#2-demo)
3. [How It Works](#3-how-it-works)
4. [Protocol Interface](#4-protocol-interface)
5. [Tech Stack](#5-tech-stack)
6. [Why Now & Why 0G](#6-why-now--why-0g)
7. [On-Chain Proof](#7-on-chain-proof)
8. [Roadmap](#8-roadmap)
9. [Links](#9-links)

</details>

---

## 1. Problem & Solution

**The problem:** When one AI agent commissions another to complete a task, there is no trustless way to evaluate the result. Every current approach has a fatal flaw:

| Approach | Who sees content | Trust model | Verifiable? | Cost |
|---|---|---|---|---|
| Human review | ✅ reviewer | Social | ❌ | $$$ |
| Economic jury (stake/slash) | ✅ jurors | Economic | ❌ | $$ |
| Oracle | ✅ operator | Centralized | ❌ | $ |
| **Attesta Protocol** | **❌ no one** | **Hardware** | **✅ on-chain** | **~$0.008** |

**The solution:** Attesta Protocol issues **Quality Certificates** backed by 0G Private Computer (TEE). The AI output enters a sealed Intel TDX hardware enclave. The compute operator cannot read the content. The evaluation generates a cryptographic attestation posted on 0G Chain. Any downstream contract — or human — can verify the certificate independently.

**The core innovation:** The certificate is the primitive. Escrow settlement is one built-in application of it. Think of it as SSL for AI outputs — you don't trust the website; you trust the certificate from the hardware.

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 2. Demo

- 🌐 **Live:** [https://attesta-protocol.vercel.app](https://attesta-protocol.vercel.app)
- 🧪 **Try It:** [attesta-protocol.vercel.app/try](https://attesta-protocol.vercel.app/try) — no wallet needed
- 📊 **Dashboard:** [attesta-protocol.vercel.app/dashboard](https://attesta-protocol.vercel.app/dashboard)
- 📹 **Video:** [https://youtu.be/o9ijZvOQE9g](https://youtu.be/o9ijZvOQE9g)
- 📜 **Contract:** [`0xCd1563bb446a209C5817Ff3F4Bd80afF441034da`](https://chainscan.0g.ai/address/0xCd1563bb446a209C5817Ff3F4Bd80afF441034da)

**Try the interactive demo in 30 seconds:**
1. Go to [/try](https://attesta-protocol.vercel.app/try)
2. Write anything in the "Agent B's Deliverable" box
3. Drag the **Pass Threshold** slider
4. Click **Submit to 0G Private Computer** — watch the TEE evaluate and issue a Quality Certificate

> The magic moment: the same result passes at threshold 60, fails at threshold 90. The evaluator evaluated blindly — you just changed Agent A's bar. A numbered certificate with TEE attestation appears on-chain.

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 3. How It Works

### System Architecture

```mermaid
graph TD
    subgraph Agents["Agent Layer"]
        A["🤖 Agent A<br/>(Client)"]
        B["🤖 Agent B<br/>(Worker)"]
    end

    subgraph Chain["0G Chain · ID 16661"]
        C["📄 AttestProtocol.sol<br/>createTask / submitResult<br/>requestCertification / resolveExternalCert"]
    end

    subgraph Compute["0G Private Computer (TEE)"]
        T["🔒 Sealed Enclave<br/>GLM-5.2 · Intel TDX · NVIDIA H100<br/>Operator: NO ACCESS"]
    end

    subgraph Storage["0G Storage"]
        S["📦 Result Content<br/>Content-addressed · Root hash on-chain"]
    end

    subgraph Cert["Certificate Output"]
        E["📜 CertificateIssued Event<br/>certId · score · passed · attestationHash<br/>On-chain · Verifiable by anyone"]
    end

    A -->|"createTask + lock escrow"| C
    B -->|"upload result"| S
    B -->|"submitResult(resultURI)"| C
    C -->|"requestVerify(criteria, resultURI)"| T
    T -->|"attestation(score, passed)"| C
    C -->|"emit"| E
    E -->|"score ≥ threshold → transfer"| B
    E -->|"score < threshold → refund"| A

    style Compute fill:#1a0a2e,stroke:#a855f7,color:#e2d9f3
    style Chain fill:#0a1628,stroke:#3b82f6,color:#dbeafe
    style Cert fill:#0a1f0a,stroke:#00ff88,color:#d1fae5
    style Agents fill:#1a1a1a,stroke:#475569,color:#cbd5e1
    style Storage fill:#1a1208,stroke:#f59e0b,color:#fef3c7
```

### Settlement Flow

```mermaid
sequenceDiagram
    participant A as Agent A (Client)
    participant C as AttestProtocol.sol<br/>0G Chain · 16661
    participant S as 0G Storage
    participant T as 0G Private Computer<br/>(TEE Enclave)

    A->>C: createTask(criteriaURI, threshold)<br/>+ lock escrow
    Note over C: Status: Created

    B->>S: upload result content
    B->>C: submitResult(resultURI, resultHash)
    Note over C: Status: Submitted

    C->>T: requestVerify(criteria, resultURI)
    Note over T: ████ SEALED INPUT ████<br/>Operator: NO ACCESS<br/>GLM-5 · Intel TDX · H100

    T->>C: attestation(passed, score, attestationHash)
    Note over C: Status: Resolved ✅ Certificate Issued

    alt score ≥ threshold
        C->>B: transfer escrow ✅
    else score < threshold
        C->>A: refund escrow ↩️
    end
```

**State machine:** `Created → Submitted → Resolved` (3 states, no ambiguity)

**On-chain events — verifiable by anyone:**

```solidity
TaskCreated(taskId, agentA, agentB, escrowAmount, criteriaURI)
ResultSubmitted(taskId, resultURI, resultHash)
AttestationReceived(taskId, attestationHash, passed, score)
TaskResolved(taskId, recipient, amount)
// New: standalone certificate primitive
CertificateIssued(certId, subject, outputHash, score, passed, attestationHash)
```

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 4. Protocol Interface

Attesta Protocol is designed as a composable primitive, not just an app. Any 0G protocol can call it directly to issue quality certificates — no escrow required.

```solidity
// Any 0G protocol calls this to request a certificate
AttestProtocol.requestCertification(
    subject,      // agent address being evaluated
    outputHash,   // keccak256 of the AI output
    criteriaHash  // keccak256 of evaluation criteria
) returns (certId)

// TEE relayer resolves it
AttestProtocol.resolveExternalCert(certId, score, passed, attestationHash)
// → emits CertificateIssued(certId, subject, outputHash, score, passed, attestation)
```

**Possible certificate consumers:**

| Consumer | How they use the certificate |
|---|---|
| Escrow settlement *(built-in)* | Release payment if `passed == true` |
| Agent reputation scoring | Accumulate `score` history per agent address |
| DAO grant disbursement | Disburse funds when deliverable cert is issued |
| Multi-agent task routing | Route to agents with highest historical cert scores |

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 5. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Certification** | 0G Private Computer (TEE) | Only infra combining operator-invisible inference + on-chain attestation |
| **Chain** | 0G Chain · Aristotle · ID 16661 | Native TEE attestation support · 400ms block time |
| **Storage** | 0G Storage | Content-addressable result storage · tamper-proof root hash |
| **Contract** | Solidity 0.8.20 | 3-state escrow + standalone `requestCertification()` interface |
| **Frontend** | Next.js + Tailwind + Recharts | Vercel one-click deploy · Server Components for on-chain data |

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 6. Why Now & Why 0G

**Why now:** 0G Private Computer launched in 2026 as the first product combining TEE inference with on-chain attestation at scale. This exact capability stack didn't exist 12 months ago. Attesta Protocol is only possible today.

**Why 0G:** This protocol cannot be built on any other stack. The mechanism requires:
- TEE that prevents the compute operator from seeing input → 0G Private Computer
- On-chain attestation anyone can verify → 0G Chain
- Fast enough for agent-speed workflows → 400ms finality
- Permanent storage for encrypted task specs and results → 0G Storage

Attesta Protocol uses all four layers of the 0G stack. It isn't "deployed on 0G" — it *requires* 0G to exist.

**The timing:** AI agents are beginning to transact with each other autonomously. The trust layer for agent-to-agent commerce doesn't exist yet. Every multi-agent system that routes payments will eventually need something like this. Attesta Protocol is the first attempt to build it as an open protocol on 0G.

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 7. On-Chain Proof

Contract deployed on 0G Aristotle Mainnet (Chain ID 16661):

| | |
|---|---|
| **Address** | [`0xCd1563bb446a209C5817Ff3F4Bd80afF441034da`](https://chainscan.0g.ai/address/0xCd1563bb446a209C5817Ff3F4Bd80afF441034da) |
| **Deploy TX** | [`0x615045f8...`](https://chainscan.0g.ai/tx/0x615045f8ed0d70d6fd1d44a509a6b510c1cd7233784b77b17515735e4a2439cf) |
| **Verified** | Sourcify ✅ |
| **Explorer** | [chainscan.0g.ai](https://chainscan.0g.ai) |

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 8. Roadmap

**Submitted — June 23:**
- [x] 3-state escrow contract (`Created → Submitted → Resolved`)
- [x] Standalone `requestCertification()` protocol interface
- [x] `CertificateIssued` on-chain event — portable, composable cert primitive
- [x] Deployed to 0G Chain Aristotle Mainnet · Sourcify verified
- [x] Interactive `/try` demo — Quality Certificate card with TEE animation
- [x] Pass Threshold slider — evaluators can set their own bar
- [x] Live dashboard with on-chain event feed

**Round of 32 — June 28:**
- [x] Real 0G Compute API integration (GLM-5.2, live TEE evaluation — temperature 0 for deterministic scoring)
- [ ] Real 0G Storage (actual result upload + root hash on Dashboard)
- [ ] Certificate Gallery — browse all issued certs by agent address
- [ ] `/try` sends real `createTask` TX via MetaMask

**Beyond — Protocol Expansion:**

*Trust Layer*
- [ ] **Agent Reputation System** — on-chain score aggregated from `CertificateIssued` history; agents build verifiable track records across tasks
- [ ] **Multi-criteria scoring** — weighted rubric support (accuracy, latency, format compliance); partial payment based on criteria passed

*Payment & Settlement*
- [ ] **Agent-to-Agent Auto Payment** — certificate triggers automatic x402 micropayment to Agent B; no human approval needed
- [ ] **Conditional Escrow Chaining** — Agent A pays Agent B only after Agent B's sub-agents are also certified; recursive settlement for multi-step pipelines

*Ecosystem*
- [ ] **Agent Marketplace** — open marketplace where Agent A posts tasks, multiple Agent Bs bid, TEE blind-evaluates all submissions and auto-awards the winner
- [ ] **Agent SDK** — one-line integration (`npm install attesta-protocol`) for any AI agent framework (LangChain, AutoGen, CrewAI)
- [ ] **Ecosystem Plugin** — any 0G protocol calls `requestCertification()` as quality gate before releasing payment or access

<p align="right"><a href="#readme-top">↑ back to top</a></p>

---

## 9. Links

| | |
|---|---|
| 🧪 Try It | [attesta-protocol.vercel.app/try](https://attesta-protocol.vercel.app/try) |
| 🌐 Live Demo | [attesta-protocol.vercel.app](https://attesta-protocol.vercel.app) |
| 💻 GitHub | [github.com/programmeryuanyuan/AttestaProtocol](https://github.com/programmeryuanyuan/AttestaProtocol) |
| 📜 Contract | [0x04Ac...a67D on chainscan.0g.ai](https://chainscan.0g.ai/address/0xCd1563bb446a209C5817Ff3F4Bd80afF441034da) |
| 🏆 Competition | [0G Zero Cup](https://0g.ai/arena/zero-cup) · June 2026 |

<p align="right"><a href="#readme-top">↑ back to top</a></p>

![Network](https://img.shields.io/badge/network-0G%20Chain-purple)
![Built for](https://img.shields.io/badge/built%20for-0G%20Zero%20Cup-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

<a id="readme-top"></a>

# ArbiterEscrow

> The first agent-to-agent settlement protocol where the arbiter sees nothing, yet proves everything.

---

## 1. Problem & Solution

**The problem:** When one AI agent commissions another to complete a task, there is no trustless way to evaluate the result. Current options require human review, an economic jury (stake/slash), or an oracle — all of which introduce trust assumptions or require seeing the content.

**The solution:** ArbiterEscrow routes evaluation through 0G Private Computer, a Trusted Execution Environment (TEE). The result enters a sealed hardware enclave where even the compute operator cannot read the content. The evaluation generates a cryptographic attestation posted on-chain. The smart contract reads the attestation and settles escrow automatically.

**Why this matters:**
- No human, jury, or oracle is involved
- Privacy: result content is never exposed outside the TEE
- Verifiability: the attestation hash is public and auditable on 0G Chain
- Only possible on 0G — no other infrastructure combines TEE inference with on-chain attestation at this level

---

## 2. Demo

- 🌐 **Live:** [https://arbiter-escrow.vercel.app](https://arbiter-escrow.vercel.app) *(deploying)*
- 📹 **Video:** *(3-min demo, link pending)*
- 📜 **Contract:** *(chainscan.0g.ai, pending deployment)*

---

## 3. How It Works

```
Agent A creates task + locks escrow on 0G Chain
          ↓
Agent B uploads result to 0G Storage → submits hash on-chain
          ↓
0G Private Computer (TEE) evaluates criteria vs result
          ↓ [Operator: NO ACCESS]
Attestation posted to 0G Chain (pass/fail + score)
          ↓
ArbiterEscrow.sol auto-settles: PASS → Agent B  |  FAIL → Agent A refund
```

**State machine:** `Created → Submitted → Resolved` (3 states)

**On-chain events (verifiable by anyone):**

```
TaskCreated(taskId, agentA, agentB, escrowAmount, criteriaHash)
ResultSubmitted(taskId, resultURI, resultHash)
AttestationReceived(taskId, attestationHash, passed, score)
TaskResolved(taskId, recipient, amount)
```

---

## 4. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Verification core | 0G Private Computer (TEE) | Only infra with operator-invisible inference + on-chain attestation |
| Chain | 0G Chain (Aristotle, Chain ID 16661) | Native TEE attestation support; 400ms block time |
| Storage | 0G Storage | Result upload with content-addressable root hash |
| Contract | Solidity 0.8.20 | Conditional escrow + 3-state machine |
| Frontend | Next.js + Tailwind + shadcn/ui | Vercel one-click deploy |

---

## 5. Why 0G, Why Now

0G Private Computer launched as the first product to combine TEE inference with on-chain attestation at this scale. ArbiterEscrow is not just "built on 0G" — the core mechanism **cannot exist without 0G Private Computer**. The privacy-verification duality (operator cannot see → anyone can verify) is native to this stack.

---

## 6. Architecture

```
┌─────────────┐   createTask(criteria, escrow)   ┌──────────────────────┐
│   Agent A   │ ──────────────────────────────→  │                      │
│  (Client)   │                                   │  ArbiterEscrow.sol   │
└─────────────┘                                   │  (0G Chain · 16661)  │
                                                   │                      │
┌─────────────┐   submitResult(resultURI)         │  Created             │
│   Agent B   │ ──────────────────────────────→  │    ↓                 │
│  (Worker)   │                                   │  Submitted           │
└─────────────┘                                   │    ↓                 │
                                                   │  Resolved            │
               ┌─────────────────────────┐        │                      │
               │  0G Private Computer    │        └──────────────────────┘
               │  ┌─────────────────┐   │                 ↑
               │  │  TEE Enclave    │   │  attestation(passed, score)
               │  │  GLM-5 eval     │   │ ────────────────────────────
               │  │  SEALED INPUT   │   │
               │  └─────────────────┘   │
               │  Operator: NO ACCESS   │
               └─────────────────────────┘
```

---

## 7. Roadmap

**Submitted (June 23):**
- [x] Simplified contract (3-state machine)
- [x] Landing + Dashboard frontend
- [x] Animated demo flow

**Round of 32 (June 28):**
- [ ] Real 0G Compute API integration (GLM-5, live TEE evaluation)
- [ ] Real 0G Storage (result upload + root hash proof)
- [ ] Contract deployed to 0G Chain mainnet with verifiable TX
- [ ] "Try It" live evaluation panel in Dashboard

**Beyond:**
- [ ] Agent SDK — one-line integration for any AI agent
- [ ] Multi-criteria tasks (weighted scoring)
- [ ] Dispute window with TEE re-evaluation

---

## 8. Links

- 🌐 **Live Demo:** [https://arbiter-escrow.vercel.app](https://arbiter-escrow.vercel.app)
- 💻 **GitHub:** *(link pending)*
- 🔗 **0G Chain Explorer:** *(contract address pending)*
- 🏆 **Built for:** [0G Zero Cup](https://0g.ai/arena/zero-cup) — June 2026

---

<p align="right"><a href="#readme-top">↑ back to top</a></p>

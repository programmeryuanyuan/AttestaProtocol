# Arbiter Protocol — Zero Cup 参赛计划

> 截止：2026-06-23 | 目标：当天提交

---

## 一、重新定位：一句话

**Arbiter Protocol** — 用 0G Private Computer 做链上可证明的 agent-to-agent 结算验证。

Agent A 委托 Agent B 做任务，结果由 0G Private Computer（TEE 可信执行环境）在完全隐私的环境里评估，评估结论以链上 attestation 形式发布，智能合约据此自动结算 escrow。

**和原版的核心区别**：
| | 原版 | 新版 |
|--|------|------|
| 验证机制 | ZK 格式检查 + 多 Agent Jury | 0G Private Computer TEE |
| 信任模型 | 经济激励（stake/slash） | 密码学 + 硬件保证 |
| 复杂度 | 5 状态 + commit-reveal + 随机选 Jury | 3 状态，单一验证路径 |
| 0G 使用 | 部署在 Monad（链无关） | 直接用 0G 核心产品 |
| 数据可见性 | Jury 能看到原文 | 运营者也看不到 |

---

## 二、简化架构

```
Agent A                    ArbiterEscrow.sol           0G Private Computer
   │                              │                           │
   │── createTask(criteria) ──→   │                           │
   │      锁定 escrow             │                           │
   │                              │                           │
Agent B                           │                           │
   │── submitResult(resultURI) ─→ │                           │
   │      状态: Submitted          │                           │
   │                              │── requestVerify() ──────→ │
   │                              │      TEE 内部评估          │
   │                              │      运营者不可见          │
   │                              │← attestation(pass/fail) ──│
   │                              │      链上可证明            │
   │                              │                           │
   │                              │── settle()                │
   │                        pass → Agent B 获 escrow          │
   │                        fail → Agent A 退款               │
```

**状态机（从 5 步简化为 3 步）**：
```
Created → Submitted → Resolved
```

去掉：Accepted / ZKPassed / Deliberating 三个中间态  
去掉：JuryRegistry 合约、commit-reveal、slash 逻辑、随机选 Jury

---

## 三、核心叙事（Pitch 用）

> "当 AI 委托 AI 做事，谁来判断结果好不好？"
>
> 现有方案靠人工审核、靠 Oracle、靠经济激励的陪审团——都是信任假设，不是密码学保证。
>
> Arbiter Protocol 把评估交给 0G Private Computer：结果进入 TEE 硬件飞地，运营者看不到，计算过程生成链上 attestation，任何人可验证。第一次实现了 agent 协作的无信任条件结算。

**为什么 0G**：0G Private Computer 是唯一把 TEE 推理与链上 attestation 结合的产品，Arbiter 直接构建在这个能力之上，不是"用了 0G"，是"只能在 0G 上做"。

---

## 四、0G Studio Prompt（直接复制粘贴）

> 打开 app.0g.ai → Studio → 新建项目 → 粘贴以下描述

---

```
Build a dark-themed single-page dashboard called "Arbiter Protocol" — a demo showing how AI agents settle work contracts using 0G Private Computer for trustless verification.

## Core concept to show
Agent A (client AI) hires Agent B (worker AI) for a task. Agent B submits their result. 0G Private Computer evaluates the result inside a TEE enclave — the operator never sees the data — and posts a verifiable attestation on-chain. The escrow auto-settles based on the attestation. No jury, no human, no oracle needed.

## Layout and sections

### Header
- Title: "Arbiter Protocol" in large white text
- Subtitle: "Agent-to-Agent Settlement · Powered by 0G Private Computer"
- Right side: a live animated block counter labeled "0G Chain Block"

### Section 1 — Interactive Demo (left, 60% width)
A vertical 4-step timeline showing the settlement flow. Each step has an icon, title, description, and timestamp. There is a "▶ Run Demo" green button at the top.

When the user clicks "Run Demo", animate through the steps with 1.5s delay between each, showing a spinner on the active step, then a green checkmark when done:

Step 1 — 🤖 Task Created
  "Agent A locked 0.05 ETH escrow"
  "Criteria: Market research report, min 500 chars, must include competitor analysis"
  Status chip: green "ESCROW LOCKED"

Step 2 — 📤 Result Submitted  
  "Agent B submitted result via IPFS"
  "ipfs://Qm7f3a9b...d2c1 · 847 chars"
  Status chip: blue "SUBMITTED"

Step 3 — 🔒 0G Private Computer Verifying
  "Evaluating inside Intel TDX + NVIDIA H100 enclave"
  "Operator cannot access prompt or result"
  Show a pulsing purple ring animation during this step
  Status chip: purple "TEE ENCLAVE ACTIVE"
  After animation completes, show: Attestation: 0x9d4f...a3e2 ✓

Step 4 — ✅ Settled
  "Score: 84/100 · Threshold: 70/100 · PASSED"
  "0.05 ETH → Agent B"
  Transaction: 0x4a2b...f9e1
  Status chip: green "RESOLVED"

### Section 2 — 0G Private Computer Detail (right, 40% width)
A card with purple gradient border showing what happens inside TEE:

Title: "0G Private Computer" with a shield icon

Fields:
- Model: GLM-5 (TEE-verified)
- Hardware: Intel TDX + NVIDIA H100
- Evaluation criteria: visible as plain text
- Result content: "████████ SEALED ████████" (redacted, only hash shown)
- Result hash: 0x7f3a...b2c1
- Attestation: green badge "ON-CHAIN VERIFIED"
- Operator visibility: red badge with lock icon "OPERATOR: NO ACCESS"

Below the card, two smaller stat boxes:
- "Verification time: 2.3s"
- "Gas cost: ~$0.008"

### Section 3 — Why This Matters (bottom, full width)
Three cards in a row with dark backgrounds and subtle borders:

Card 1 — "Data Privacy"
Icon: 🔒
"Agent results evaluated inside sealed hardware. Not even the compute provider can read the content."

Card 2 — "On-Chain Verifiable"  
Icon: ⛓️
"TEE attestation posted to 0G chain. Any party can verify the evaluation happened correctly."

Card 3 — "No Trust Required"
Icon: ✅
"No jury. No oracle. No human review. Pure cryptographic and hardware guarantee."

### Footer
"Built for 0G Zero Cup · June 2026 · 0g.ai/arena/zero-cup"

## Design system
- Background: #080808
- Card background: #111111
- Border color: #222222
- Primary accent: #00ff88 (green, for success/ETH/passed states)
- Secondary accent: #a855f7 (purple, for 0G Private Computer elements)
- Info accent: #3b82f6 (blue, for submitted/processing states)
- Font: monospace for addresses, hashes, and code values; system sans-serif for body text
- All address/hash values should be truncated: show first 6 and last 4 chars with "..." in middle
- Subtle gradient glow on the 0G Private Computer card (purple glow)
- The "Run Demo" button should have a pulsing animation when idle

## Behavior
- On page load, all steps show as "pending" (grey)
- Clicking "Run Demo" animates through all 4 steps sequentially
- Clicking "Reset" returns all steps to pending state
- The block counter in the header increments every 400ms (simulating 0G's 400ms block time)
```

---

## 五、提交清单（6月23日前）

- [ ] 在 Bitget 购买 $0G（3个，不到$1）
- [ ] 提币到 MetaMask
- [ ] 打开 app.0g.ai，连接钱包
- [ ] Studio 新建项目，粘贴上方 Prompt
- [ ] 调整细节，部署到 Vercel
- [ ] 在 0g.ai/arena/zero-cup 注册并提交项目链接
- [ ] 项目描述填写：Arbiter Protocol — Agent-to-Agent Settlement via 0G Private Computer

---

## 六、加分方向（时间够的话）

1. **接入真实 0G Storage**：把 "Result submitted via IPFS" 换成真实上传到 0G Storage，返回真实的 root hash 展示在 dashboard 上
2. **接入 0G Compute API**：用 GLM-5 真实评估一段示例文本，展示真实的评分，比 mock 数据更有说服力
3. **加一个 "Try It" 表单**：让评审可以输入自己的任务描述和结果文本，现场跑一次验证

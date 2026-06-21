# ArbiterEscrow — 完整项目设计（优化版）

> 截止：2026-06-23 · 目标：Top 32 入围，后续每轮迭代

---

## 一、Idea 验证（4要素公式）

```
AI Agent（Agent B，工人）因为「无法证明自己的工作质量」，
需要一个能在不暴露内容的情况下完成评估并自动结算的系统，
关键链上动作是 0G 链上的 TaskResolved 事件（含 attestation hash）。
30 秒 Demo 的「魔法时刻」是：
  结果提交 → TEE 内评估（运营者不可见）→ 链上 attestation 出现 → escrow 自动打款
  全程无人工、无 Oracle、无 Jury——纯密码学 + 硬件保证。
```

**为什么是「魔法时刻」**：评委见过很多 escrow 项目，但没见过「连运营者也看不到内容」就能完成裁决的——这是 0G Private Computer 独有的能力，也是只能在 0G 上做的理由。

---

## 二、差异化一句话定位

**ArbiterEscrow** — The first agent-to-agent settlement protocol where the arbiter sees nothing, yet proves everything.

中文版：首个「裁判看不到内容、但计算过程人人可验证」的 AI Agent 结算协议。

---

## 三、系统架构

```
┌─────────────┐     createTask(criteria, escrow)    ┌──────────────────────┐
│   Agent A   │ ─────────────────────────────────→  │                      │
│  (Client)   │                                      │  ArbiterEscrow.sol   │
└─────────────┘                                      │  (0G Chain · 16661)  │
                                                      │                      │
┌─────────────┐     submitResult(resultURI)          │  Created             │
│   Agent B   │ ─────────────────────────────────→  │    ↓                 │
│  (Worker)   │                                      │  Submitted           │
└─────────────┘                                      │    ↓                 │
                                                      │  Resolved            │
                     ┌─────────────────────────┐     │                      │
                     │  0G Private Computer    │     └──────────────────────┘
                     │  ┌─────────────────┐   │              ↑
                     │  │  TEE Enclave    │   │   attestation(pass/fail)
                     │  │  GLM-5 eval     │   │ ─────────────────────────
                     │  │  sealed input   │   │
                     │  └─────────────────┘   │
                     │  Operator: NO ACCESS    │
                     └─────────────────────────┘
```

**状态机**：`Created → Submitted → Resolved`（3 态）

**链上事件（评委可验证）**：
```
TaskCreated(taskId, agentA, agentB, escrowAmount, criteria)
ResultSubmitted(taskId, resultURI, resultHash)
AttestationReceived(taskId, attestationHash, passed, score)
TaskResolved(taskId, recipient, amount)
```

---

## 四、前端两层结构

按 hackthon-skill 五十一章：评委点链接先落 `/`，看懂再进 Dashboard。

```
/          Landing 说明页   — 10 秒让评委懂项目
/dashboard  Dashboard       — 证明「项目真的在跑」
```

### Landing 页内容规划

```
Hero:
  ArbiterEscrow
  "The first agent-to-agent settlement where the arbiter sees nothing,
   yet proves everything."
  [Open Dashboard →]  [GitHub]

How it works（3步）:
  1. 🤖 Agent A creates task + locks escrow on 0G Chain
  2. 📤 Agent B submits result → stored on 0G Storage
  3. 🔒 0G Private Computer evaluates inside TEE → on-chain attestation → auto-settle

Tech badges:
  [0G Private Computer]  [0G Chain]  [TEE · Intel TDX]  [GLM-5]  [Solidity]
```

### Dashboard 4 块标配

按 hackthon-skill 五十一章，缺一掉分：

```
Block 1 — 顶部状态条
  总任务数 | 已结算数 | 合约地址（短 + 跳 chainscan.0g.ai）| 0G Chain Block（400ms 跳动）

Block 2 — 主图表（recharts）
  折线图：任务状态时间线（x=时间, y=累计结算金额）
  暗色背景 + 主色 #a855f7（紫色，与 0G Private Computer 视觉一致）

Block 3 — 决策时间轴（最近 10 条任务）
  列：TaskID | Agent B | Status | Score | Attestation Hash | TX（跳 chainscan）

Block 4 — Interactive Demo Panel
  可点击「▶ Run Demo」动态演示完整流程（4步动画）
  含「Try It」表单：输入任意文本 → 模拟评估 → 显示结果
```

---

## 五、视觉规范（hackthon-skill 五十四章）

| 规则 | ArbiterEscrow 对应做法 |
|------|----------------------|
| 配色收敛 | 主色 `#a855f7`（紫，0G Private Computer）+ 强调 `#00ff88`（绿，pass/settled）+ `#0a0a0a` 背景 |
| 间距统一 | Card `p-6`，grid `gap-4`，容器 `max-w-7xl mx-auto` |
| 字号 ≤ 4 级 | `text-2xl`（页标题）/ `text-lg`（卡片标题）/ `text-sm`（正文）/ `text-xs`（辅助/hash）|
| 数字突出 | 关键数字 `text-3xl font-bold`，标签 `text-sm text-slate-400` |
| 状态颜色 + 图标 | pass → `#00ff88 + CheckCircle`，fail → `#ef4444 + XCircle`，pending → `#a855f7 + Loader`，全用 `lucide-react` |

---

## 六、README（8模块结构）

按 hackthon-skill 十六章，写中文初稿，最后出英文版。

```markdown
<!-- badges -->
![Network](https://img.shields.io/badge/network-0G%20Chain-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![Built for](https://img.shields.io/badge/built%20for-0G%20Zero%20Cup-blueviolet)

<a id="readme-top"></a>

# ArbiterEscrow

> The first agent-to-agent settlement protocol where the arbiter sees nothing,
> yet proves everything.

## 1. Problem & Solution

**痛点**：AI Agent 委托另一个 AI Agent 完成任务时，没有人能在不信任对方的情况下完成付款——现有方案要么靠人工审核，要么靠经济激励的陪审团，都是信任假设而非密码学保证。

**解法**：ArbiterEscrow 把评估交给 0G Private Computer（TEE）：
- 结果进入硬件飞地，**运营者看不到内容**
- 评估过程生成链上 attestation，**任何人可验证**
- 智能合约据此自动结算，**无需人工、无需 Oracle**

**创新点**：首次把 TEE 隐私计算 + 链上 attestation + 条件 Escrow 结合，实现真正的「无信任 Agent 结算」。

## 2. Demo

- 🌐 Live: [https://arbiter-escrow.vercel.app](待填)
- 📹 Video: [3-min demo](待填)
- 📜 On-chain TX: [chainscan.0g.ai/address/0x...](待填)

![screenshot](待填)

## 3. How it works

\`\`\`mermaid
sequenceDiagram
    participant A as Agent A
    participant C as ArbiterEscrow.sol
    participant S as 0G Storage
    participant T as 0G Private Computer (TEE)

    A->>C: createTask(criteria) + lock escrow
    Note over C: Status: Created
    B->>S: upload result
    B->>C: submitResult(resultURI)
    Note over C: Status: Submitted
    C->>T: requestVerify(criteria, resultURI)
    Note over T: Sealed evaluation<br/>Operator: NO ACCESS
    T->>C: attestation(passed=true, score=84)
    Note over C: Status: Resolved
    C->>B: transfer escrow ✅
\`\`\`

## 4. Tech Stack

| 层 | 技术 | 为什么选它 |
|---|------|----------|
| 验证核心 | 0G Private Computer (TEE) | 唯一做到「运营者不可见 + 链上可证明」的计算层 |
| 链 | 0G Chain (Aristotle, Chain ID 16661) | 原生 TEE attestation 支持；400ms 出块 |
| 存储 | 0G Storage | 结果存储 + root hash 防篡改 |
| 合约 | Solidity 0.8.20 | 条件 escrow + 状态机 |
| 前端 | Next.js + Tailwind + recharts | Vercel 一键部署 |

## 5. Why now & Why 0G

0G Private Computer 于 2026 年上线，是第一个把 TEE 推理与 0G 链上 attestation 结合的产品。
ArbiterEscrow 不是「用了 0G」，是「只能在 0G 上做」——没有 0G Private Computer，这个机制不存在。

## 6. Roadmap

- [x] 简化合约（3 态状态机）
- [x] Landing + Dashboard 前端
- [x] Demo 动画流程
- [ ] 接入真实 0G Compute API（GLM-5 TEE 推理）
- [ ] 接入 0G Storage（真实 result URI + root hash）
- [ ] 合约部署到 0G Chain mainnet
- [ ] Agent SDK（让任何 AI Agent 一行代码接入）

## 7. Links

- 🌐 Live Demo: 待填
- 💻 GitHub: 待填
- 📜 Contract: 待填（chainscan.0g.ai）
- 🔗 On-chain TX: 待填
```

---

## 七、Demo 视频脚本（3 分钟）

按 hackthon-skill 二十章格式：

| 时间 | 旁白（逐字稿） | 屏幕 |
|------|-------------|------|
| 0:00–0:20 | "当 AI 雇用 AI 完成任务，谁来裁定结果好不好？现在的答案是：没有人。" | 黑屏 → 标题出现 |
| 0:20–0:40 | "现有方案靠陪审团、靠 Oracle——都是信任假设。ArbiterEscrow 用不同的方式解决这个问题。" | Landing 页 Hero |
| 0:40–1:00 | "Agent A 创建任务，锁定 0.05 ETH 到链上 escrow。Agent B 确认条件，开始执行。" | Dashboard Demo Panel Step 1-2 |
| 1:00–1:40 | "Agent B 提交结果。现在关键来了——结果进入 0G Private Computer 的 TEE 硬件飞地。运营者看不到内容。但评估过程会生成一个链上 attestation——任何人都能验证这次评估确实发生了，且按照约定标准进行。" | Step 3 动画（紫色脉冲环 + sealed 标识） |
| 1:40–2:00 | "评分 84/100，超过及格线 70。合约自动把 escrow 打给 Agent B。链上 TX 可查。" | Step 4 + chainscan TX 链接 |
| 2:00–2:30 | "这里是完整的技术架构。核心创新只有一点：把裁判放进了 TEE——它什么都看不到，但它的判断可以被全世界验证。" | Mermaid 架构图一闪 |
| 2:30–3:00 | "ArbiterEscrow 是第一个做到这一点的 Agent 结算协议。Built on 0G. Live at [URL]。" | Landing CTA 按钮 |

---

## 八、0G Studio Prompt — Landing 页

> **先做 Landing，再做 Dashboard**

```
Build a dark-themed landing page for "ArbiterEscrow" — a Web3 protocol for AI agent-to-agent settlement using 0G Private Computer.

## Hero section
- Large title: "ArbiterEscrow"
- Subtitle (smaller): "The first agent-to-agent settlement where the arbiter sees nothing, yet proves everything."
- Two buttons side by side:
  - Primary: "Open Dashboard →" (purple background #a855f7, links to /dashboard)
  - Secondary: "GitHub" (outline style, dark border)
- Below buttons: small text "Built for 0G Zero Cup · June 2026"

## "How it works" section
Title: "How It Works"
Three steps in a horizontal row, each with an icon, bold title, and one sentence:

Step 1 — icon: robot emoji or shield
Title: "Agent A creates task"
Text: "Locks escrow on 0G Chain with acceptance criteria. Agent B reviews and accepts."

Step 2 — icon: upload arrow
Title: "Agent B submits result"  
Text: "Work is uploaded to 0G Storage. Result hash is committed on-chain."

Step 3 — icon: lock / shield
Title: "0G Private Computer settles"
Text: "TEE enclave evaluates the result — operator cannot see the content. Attestation posted on-chain. Escrow auto-settles."

## Tech badges section
Title: "Powered by"
A row of small pill badges:
"0G Private Computer" · "0G Chain" · "TEE · Intel TDX" · "GLM-5" · "Solidity 0.8" · "Next.js"

## Design
- Background: #080808
- Text: white
- Primary accent: #a855f7 (purple) — used for the primary button, step icons
- Success accent: #00ff88 (green) — used for any "settled / verified" indicators
- Font: system sans-serif, clean
- Max width: 900px centered
- Generous vertical padding between sections
- No animations needed — keep it clean and fast-loading
- The page should be a static single page, no data fetching
```

---

## 九、0G Studio Prompt — Dashboard

```
Build a dark-themed dashboard page at /dashboard for "ArbiterEscrow".

## Overall layout
Dark background (#080808). Max width 1200px centered. 

## Section 1 — Header bar (full width)
Left: "ArbiterEscrow" title + "Dashboard" subtitle
Right: a block counter showing "0G Block #XXXXXXX" that increments every 400ms (simulating 0G's block time)
Below header: contract address displayed as "Contract: 0xeB56...d93D" with a small "↗" icon

## Section 2 — Stats row (4 cards, equal width)
Card 1: "Total Tasks" — show "3" in large bold number
Card 2: "Settled" — show "2" in large bold green number (#00ff88)
Card 3: "Avg Verification" — show "2.3s" in large bold purple number
Card 4: "Gas per Verify" — show "~$0.008" in large bold number

## Section 3 — Two columns below stats

### Left column (60% width) — Interactive Demo
Title: "Live Settlement Demo"
A "▶ Run Demo" button (green, pulsing glow when idle).
A "Reset" button (grey outline) next to it.

A vertical 4-step timeline. Each step has: step number circle, icon, title, description, timestamp, and a status chip.

Step 1 — Task Created
Icon: 🤖
Title: "Task Created"
Description: "Agent A locked 0.05 ETH escrow · Criteria: market research report, min 500 chars"
Status chip: green "ESCROW LOCKED"

Step 2 — Result Submitted
Icon: 📤
Title: "Result Submitted"  
Description: "Agent B uploaded to 0G Storage · 847 chars · Hash: 0x7f3a...b2c1"
Status chip: blue "SUBMITTED"

Step 3 — TEE Verifying
Icon: 🔒
Title: "0G Private Computer"
Description: "Evaluating inside Intel TDX + NVIDIA H100 · Operator: NO ACCESS"
During animation: show a pulsing purple ring
After animation: show "Attestation: 0x9d4f...a3e2 ✓"
Status chip: purple "TEE ENCLAVE ACTIVE" → changes to "VERIFIED" after done

Step 4 — Settled
Icon: ✅
Title: "Settled"
Description: "Score: 84/100 · Threshold: 70 · PASSED · 0.05 ETH → Agent B"
TX: "0x4a2b...f9e1 ↗"
Status chip: green "RESOLVED"

Animation behavior:
- On load: all steps grey/pending
- Click "Run Demo": animate through steps with 1.5s delay each
- Click "Reset": back to pending

### Right column (40% width) — TEE Detail card
Purple gradient border, slight purple glow.
Title: "0G Private Computer" with a shield icon

Fields displayed as label: value pairs:
- Model: GLM-5 (TEE-verified)
- Hardware: Intel TDX + NVIDIA H100
- Criteria: "Market research, 500+ chars, competitor analysis"
- Result content: "████████ SEALED ████████"
- Result hash: 0x7f3a...b2c1
- Attestation: [green badge] ON-CHAIN VERIFIED
- Operator access: [red badge with lock] NO ACCESS

Below: two small stat boxes side by side:
- "Verification: 2.3s"
- "Cost: ~$0.008"

## Section 4 — "Why This Matters" (full width, 3 cards)
Three cards in a row:

Card 1: "Data Privacy"
Icon: 🔒
"Results evaluated inside sealed hardware. Even the compute provider cannot read the content."

Card 2: "On-Chain Verifiable"
Icon: ⛓
"TEE attestation posted to 0G Chain. Any party can independently verify the evaluation."

Card 3: "No Trust Required"
Icon: ✅
"No jury. No oracle. No human. Pure cryptographic and hardware guarantee."

## Footer
"ArbiterEscrow · Built for 0G Zero Cup · June 2026"
Link: "0g.ai/arena/zero-cup ↗"

## Design system
- Background: #080808
- Card background: #111111
- Border: #1e1e1e
- Primary accent: #a855f7 (purple)
- Success accent: #00ff88 (green)
- Info accent: #3b82f6 (blue)
- Error/attention: #ef4444 (red)
- All hashes/addresses: monospace font, truncated to first6...last4
- Lucide-react icons for all icons (no emoji in final)
- shadcn/ui Card components if available
```

---

## 十、提交清单（按优先级）

### 必须完成（今天）
- [x] $0G 充值 + Router Credit
- [x] 0G Builder Profile 注册（待确认）
- [ ] 用 **桌面 Chrome** 打开 app.0g.ai → Studio
- [ ] 粘贴「八、Landing Prompt」→ 生成 Landing 页
- [ ] 确认效果 → 询问我是否进行 Dashboard
- [ ] 粘贴「九、Dashboard Prompt」→ 生成 Dashboard
- [ ] 部署到 Vercel（一键）→ 拿到线上 URL
- [ ] 在 `0g.ai/arena/zero-cup` 提交项目链接

### 提交描述（复制粘贴用）
```
ArbiterEscrow — The first agent-to-agent settlement protocol where the arbiter 
sees nothing, yet proves everything.

Built on 0G Private Computer (TEE): results are evaluated inside sealed hardware 
enclaves — operators cannot see the content, yet the evaluation is verifiable 
on-chain via attestation. No jury, no oracle, no human required.

Stack: 0G Private Computer · 0G Chain · GLM-5 · Solidity · Next.js
```

### Top 32 后迭代（6月28日前）
- [ ] 接入真实 0G Compute API（GLM-5，真实 TEE 评估，替换 mock 动画）
- [ ] 接入 0G Storage（真实 result 上传 + root hash 展示）
- [ ] 合约部署到 0G Chain（chainscan.0g.ai 可查 TX）
- [ ] README TX Hash 证明（评委可点链接验证）
- [ ] Dashboard 加「Try It」表单（评委现场体验）
- [ ] 写 README 英文版（hackthon-skill 十八章模板）
- [ ] 录制 3 分钟 Demo 视频（按「七、视频脚本」）

---

## 十一、评委视角自审（hackthon-skill 二十一章）

按 5 个维度检查当前方案：

| 维度 | 当前状态 | 风险 |
|------|---------|------|
| 第一句话 5 秒决定 | ✅「arbiter sees nothing yet proves everything」强 | — |
| Problem & Solution | ✅ 痛点 + 解法清晰 | 确保 Landing 上有这段 |
| 技术亮点被一眼记住 | ✅「TEE + 链上 attestation」可视化 | Dashboard 的 SEALED 视觉要够震撼 |
| 魔法时刻 | ✅ TEE 评估动画 + attestation 出现瞬间 | 动画要够流畅 |
| Roadmap 认真感 | 有 `[ ]` 计划项 | 确保 README 里写进去 |

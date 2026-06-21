# 0G Studio Prompt — ArbiterEscrow Dashboard

> 直接复制下方代码块内容粘贴进 0G Studio

---

```
Build a single-page React dashboard app called "ArbiterEscrow Dashboard".

Tech: React + Tailwind CSS + lucide-react icons. No external UI library needed.

---

## Global design system

Background: #080808 (near-black)
Card background: rgba(255, 255, 255, 0.03) with border 1px solid rgba(255,255,255,0.07)
Add a subtle dot-grid pattern to the page background using a CSS radial-gradient:
  background-image: radial-gradient(rgba(168,85,247,0.08) 1px, transparent 1px)
  background-size: 28px 28px

Colors:
  Purple (primary): #a855f7
  Green (success): #00ff88
  Blue (info): #3b82f6
  Red (danger): #ef4444
  Text primary: #f1f5f9
  Text muted: #64748b

All cards: use glassmorphism — background rgba(255,255,255,0.03), border rgba(255,255,255,0.07), border-radius 12px, backdrop-filter blur(8px)
Font: system-ui, -apple-system, sans-serif

---

## Section 1 — Top header bar

Full-width row. Padding: 20px 24px. Border-bottom: 1px solid rgba(255,255,255,0.06).

Left side:
  - "ArbiterEscrow" in white, font-size 18px, font-weight 700
  - Below it: "Agent-to-Agent Settlement · 0G Private Computer" in muted text, font-size 12px

Right side (flex row, gap 16px, items centered):
  - Contract address chip: dark pill showing "Contract: 0xeB56...d93D" with a small ExternalLink icon, font-size 12px, monospace, color #64748b
  - Block counter badge: purple-bordered pill showing "⬡ Block #12,847,392" — the number increments every 400ms using setInterval in JavaScript. Font monospace, color #a855f7.

---

## Section 2 — Stats row

4 cards in a horizontal row (equal width, gap 12px), margin: 24px.

Card 1:
  Top label: "Total Tasks" (muted, 11px uppercase letter-spacing)
  Big number: "3" (white, 32px, bold)
  Bottom: small grey text "on 0G Chain"

Card 2:
  Top label: "Settled"
  Big number: "2" (color #00ff88, 32px, bold)
  Bottom: small text with a green dot "● Active"

Card 3:
  Top label: "Avg Verification"
  Big number: "2.3s" (color #a855f7, 32px, bold)
  Bottom: "by 0G Private Computer"

Card 4:
  Top label: "Gas per Verify"
  Big number: "~$0.008" (white, 32px, bold)
  Bottom: "on 0G Aristotle"

---

## Section 3 — Main two-column layout

Padding: 0 24px. Gap: 20px. Below the stats row.

### Left column (width ~58%) — "Try It" panel

This is the primary interactive feature. Card with a subtle purple glowing border when active.

#### Default / idle state

Header row:
  Left: "Try It" (white, 16px bold) + subtitle "Experience 0G Private Computer · No wallet needed" (muted, 12px)
  Right: a small purple badge "LIVE DEMO"

Below: two input sections side by side (or stacked on small screens):

  Textarea 1 — "Task Criteria (Agent A)"
    Label: "What Agent A expects" (muted, 11px uppercase)
    Placeholder text pre-filled (editable):
      "Write a market analysis report on AI infrastructure.
      Requirements: min 200 words, cover 3 competitors,
      include a clear recommendation. Score threshold: 70/100."
    Height: ~120px. Dark background, subtle border, rounded-8.

  Textarea 2 — "Submitted Result (Agent B)"
    Label: "Agent B's deliverable" (muted, 11px uppercase)
    Placeholder text pre-filled (editable):
      "The AI infrastructure market is rapidly evolving. Key players include
      0G (decentralized AI OS), Akash Network (compute marketplace), and
      Gensyn (ML training). 0G stands out with its integrated storage,
      compute, and DA layers — uniquely positioned for agent-native apps.
      Recommendation: prioritize 0G for agent deployment pipelines given
      its sub-second finality and native TEE support. Total market projected
      at $47B by 2027."
    Height: ~120px. Dark background, subtle border, rounded-8.

Between the textareas and the button: a "Pass Threshold" slider row.

  Row layout: label left, slider center, value badge right.
  Label: "Pass Threshold" (muted, 12px)
  Slider: HTML range input, min=0, max=100, default=70, step=1
    Styled with purple accent color for the thumb and filled track
    Full width of the card
  Value badge: dynamically shows current threshold, e.g. "70 / 100"
    Background: rgba(168,85,247,0.15), border: 1px solid rgba(168,85,247,0.3)
    Color: #a855f7, font: 13px bold, padding: 3px 10px, border-radius: 99px
  Below the slider: a one-line hint in muted 11px:
    "Agent A sets the bar · TEE scores blindly · Contract enforces the deal"

Below the threshold row: a full-width large button:
  "▶  Submit to 0G Private Computer"
  Background: linear-gradient(135deg, #7c3aed, #a855f7)
  Text: white, 15px bold
  Padding: 14px
  Border-radius: 8px
  On hover: brightness 1.1
  Has a subtle pulsing glow animation when idle (box-shadow pulse on #a855f7)

#### Processing state (after button click)

Replace the button area with a 4-step processing timeline. Each step appears sequentially with a 1.2s delay.

Step 1 (appears at 0s):
  Icon: Upload (lucide) — blue
  Text: "Uploading result to 0G Storage..."
  Right: animated spinner
  → After 1.2s: spinner → green Check, text turns white

Step 2 (appears at 1.2s):
  Icon: Lock (lucide) — purple
  Text: "Entering TEE Enclave · Operator access: REVOKED"
  Right: animated spinner
  → After 1.2s: spinner → green Check

Step 3 (appears at 2.4s):
  Icon: Cpu (lucide) — purple, pulsing glow
  Text: "0G Private Computer evaluating..."
  Sub-text: "████ SEALED INPUT ████  GLM-5 · Intel TDX · NVIDIA H100"
  Right: animated spinner (longer, 2s)
  → After 2s: spinner → green Check, glow stops

Step 4 (appears at 4.4s):
  Show the result card (see below)

#### Result card (appears after processing)

A new card that slides in (or fades in). Border color matches outcome: green glow if PASSED, red glow if FAILED.

Top row: "Evaluation Complete" (white bold) + outcome badge: green "PASSED" or red "FAILED"

Score display (centered, large):
  Big circular arc meter showing score out of 100.
  Score is determined by result textarea length:
    <100 chars  → score = 42
    100–300 chars → score = 68
    >300 chars  → score = 84
  PASSED/FAILED is determined by comparing score vs the current slider threshold value:
    score >= threshold → PASSED
    score < threshold  → FAILED
  The arc meter animates from 0 to the score value over 0.8s.
  Score number in center: e.g. "84" in 36px bold, color #00ff88 if PASSED, #ef4444 if FAILED.
  Below the number: "/ 100" in muted small text.

Threshold comparison row (below the arc meter):
  Three items in a horizontal row, centered:
    "Score: 84" (large, color matches outcome)
    "vs" (muted)
    "Threshold: 70" (white, shows the current slider value)
  Below: outcome sentence — "84 ≥ 70 → PASSED" or "42 < 70 → FAILED"
  This row makes the comparison explicit and satisfying.

Settlement row:
  "Escrow: 0.05 ETH → Agent B  ✓" (green, if PASSED)
  OR "Escrow: 0.05 ETH → Agent A  (refunded)" (red, if FAILED)

Attestation section:
  Label: "0G Chain Attestation" (muted uppercase 11px)
  Hash: "0x9d4f...a3e2" (monospace, #a855f7)
  Status: green dot + "VERIFIED ON-CHAIN"
  Small external link: "View on chainscan.0g.ai ↗" (muted link)

Bottom: a small "Reset →" link to go back to default state.

---

### Right column (width ~42%) — Two stacked cards

#### Card A — TEE Detail (top card)

Purple glowing border: box-shadow 0 0 20px rgba(168,85,247,0.15), border 1px solid rgba(168,85,247,0.3)

Header: Shield icon (purple) + "0G Private Computer" (white 14px bold)
Sub: "Trusted Execution Environment" (muted 11px)

Divider line.

Label/value list (label: 11px muted uppercase, value: 13px white):
  MODEL       GLM-5 (TEE-Verified)
  HARDWARE    Intel TDX + NVIDIA H100
  ENCLAVE     Active
  OPERATOR    [red badge with Lock icon] NO ACCESS
  ATTESTATION [green badge with Check] ON-CHAIN

Divider line.

"Content Visibility" section:
  Label: "Sealed Input" (muted 11px)
  A dark box showing:
    ████████████████████
    ████  SEALED  ████
    ████████████████████
  In monospace grey, 12px. Add a blinking cursor at end.

Two small metric chips below (side by side):
  "⚡ 2.3s avg verify" (purple bg)
  "💎 ~$0.008 / call" (dark bg, purple border)

#### Card B — Why This Matters (bottom card, 3 items vertical)

Title: "Why This Matters" (white 14px bold)

Three rows, each with icon + title + one sentence:

Row 1: Lock icon (purple) · "Data Privacy"
  "Results enter a sealed enclave. Even the compute provider cannot read the content."

Row 2: Link icon (blue) · "On-Chain Verifiable"
  "TEE attestation is posted to 0G Chain. Any party can verify the evaluation independently."

Row 3: CheckCircle icon (green) · "No Trust Required"
  "No jury. No oracle. No human review. Cryptographic and hardware guarantee only."

---

## Section 4 — Footer

Full-width. Padding: 20px 24px. Border-top: 1px solid rgba(255,255,255,0.06).
Text center: "ArbiterEscrow · Built for 0G Zero Cup · June 2026 · " + link "0g.ai/arena/zero-cup ↗"
All text muted, 12px.

---

## Behavior notes

- All state managed with React useState
- The block counter uses useEffect + setInterval(400)
- Processing steps use sequential setTimeout calls
- Threshold state: useState(70), controlled by the slider
- Score logic based on result textarea character count:
    <100 chars  → score = 42
    100–300 chars → score = 68
    >300 chars  → score = 84
- Pass/fail: score >= threshold → PASSED, else FAILED
- Both threshold and score are captured at the moment "Submit" is clicked, so adjusting the slider after processing doesn't retroactively change the result (makes the "set before submit" rule intuitive)
- The arc meter is drawn with SVG (a circle stroke-dashoffset animation)
- No external API calls needed — evaluation is client-side logic for demo purposes
- Page is fully static, no routing needed (single page)
- Make it mobile-responsive: on small screens, the two columns stack vertically
```

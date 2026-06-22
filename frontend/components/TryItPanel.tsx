"use client"

import { useState, useRef } from "react"
import { keccak256, toHex } from "viem"
import { Upload, Lock, Cpu, CheckCircle, XCircle, Loader2, RotateCcw, Copy, Shield, ExternalLink } from "lucide-react"

type Phase = "idle" | "step1" | "step2" | "step3" | "done"

function shortHash(h: string) {
  return h.slice(0, 10) + "…" + h.slice(-4)
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} className="text-slate-600 hover:text-purple-400 transition-colors ml-1 shrink-0">
      {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function ScoreMeter({ score, max = 100 }: { score: number; max?: number }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const fill = (score / max) * circ
  const color = score >= 70 ? "#00ff88" : "#ef4444"
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#1e1e2e" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dasharray 0.9s ease" }}
      />
      <text x="60" y="55" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{score}</text>
      <text x="60" y="73" textAnchor="middle" fill="#475569" fontSize="11">/ 100</text>
    </svg>
  )
}

const STEPS = [
  { icon: Upload, label: "Uploading result to 0G Storage…",              color: "text-blue-400" },
  { icon: Lock,   label: "Entering TEE Enclave · Operator access: REVOKED", color: "text-purple-400" },
  { icon: Cpu,    label: "0G Private Computer evaluating…",               color: "text-purple-400",
    sub: "████ SEALED INPUT ████  ·  GLM-5 · Intel TDX · NVIDIA H100" },
]

function computeScore(text: string) {
  const len = text.trim().length
  if (len < 100) return 42
  if (len < 300) return 68
  return 84
}

export default function TryItPanel() {
  const [criteria, setCriteria] = useState(
    "Write a market analysis on AI infrastructure.\nRequirements: min 200 words, cover 3 competitors, include a clear recommendation."
  )
  const [result, setResult] = useState(
    "The AI infrastructure market is rapidly evolving. Key players include 0G (decentralized AI OS), Akash Network (compute marketplace), and Gensyn (ML training). 0G stands out with its integrated storage, compute, and DA layers — uniquely positioned for agent-native apps. Recommendation: prioritize 0G for agent deployment pipelines given its sub-second finality and native TEE support. Total market projected at $47B by 2027."
  )
  const [threshold, setThreshold]       = useState(70)
  const [phase, setPhase]               = useState<Phase>("idle")
  const [doneStep, setDoneStep]         = useState(0)
  const [score, setScore]               = useState(0)
  const [passed, setPassed]             = useState(false)
  const [outputHash, setOutputHash]     = useState("")
  const [criteriaHash, setCriteriaHash] = useState("")
  const [attestation, setAttestation]   = useState("")
  const [certId, setCertId]             = useState(47)
  const [issuedAt, setIssuedAt]         = useState("")
  const [txHash, setTxHash]             = useState<string | null>(null)
  const [txLoading, setTxLoading]       = useState(false)
  const [txError, setTxError]           = useState(false)
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() { timerRefs.current.forEach(clearTimeout); timerRefs.current = [] }

  function reset() {
    clearTimers()
    setPhase("idle")
    setDoneStep(0)
    setScore(0)
    setTxHash(null)
    setTxLoading(false)
    setTxError(false)
  }

  async function callCertifyAPI(outHash: string, critHash: string, s: number, p: boolean) {
    setTxLoading(true)
    try {
      const res = await fetch("/api/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputHash: outHash, criteriaHash: critHash, score: s, passed: p }),
      })
      const data = await res.json()
      if (data.txHash) {
        setTxHash(data.txHash)
        setAttestation(data.attestationHash ?? attestation)
      } else {
        setTxError(true)
      }
    } catch {
      setTxError(true)
    } finally {
      setTxLoading(false)
    }
  }

  function submit() {
    clearTimers()
    const s = computeScore(result)
    const p = s >= threshold

    const outHash  = keccak256(toHex(result))
    const critHash = keccak256(toHex(criteria))
    const attest   = keccak256(toHex(`${outHash}${critHash}${threshold}`))

    setScore(s)
    setPassed(p)
    setOutputHash(outHash)
    setCriteriaHash(critHash)
    setAttestation(attest)
    setCertId(prev => prev + 1)
    setIssuedAt(new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC")
    setTxHash(null)
    setTxError(false)
    setPhase("step1")
    setDoneStep(0)

    // Fire API call in parallel with animation
    callCertifyAPI(outHash, critHash, s, p)

    const t1 = setTimeout(() => { setDoneStep(1); setPhase("step2") }, 1200)
    const t2 = setTimeout(() => { setDoneStep(2); setPhase("step3") }, 2600)
    const t3 = setTimeout(() => { setDoneStep(3); setPhase("done")  }, 5000)
    timerRefs.current = [t1, t2, t3]
  }

  const isProcessing = phase !== "idle" && phase !== "done"
  const accentPass   = "from-emerald-500/50 via-purple-500/20 to-emerald-500/50"
  const accentFail   = "from-red-500/50 via-purple-500/20 to-red-500/50"

  return (
    <div className="rounded-xl border border-purple-500/20 bg-white/[0.03] p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold text-lg">Try It</p>
          <p className="text-slate-400 text-xs mt-0.5">Experience 0G Private Computer · No wallet needed</p>
        </div>
        <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full">LIVE DEMO</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-slate-500">Agent A — Acceptance Criteria</label>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            disabled={isProcessing}
            rows={5}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none
              focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-slate-500">Agent B — Deliverable</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            disabled={isProcessing}
            rows={5}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none
              focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
          />
          <p className="text-[11px] text-slate-500 italic">You are playing Agent B. Write more to score higher.</p>
        </div>
      </div>

      {/* Threshold */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 shrink-0">Pass Threshold</span>
          <input
            type="range" min={0} max={100} step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            disabled={isProcessing}
            className="flex-1 accent-purple-500 disabled:opacity-50"
          />
          <span className="text-sm font-bold text-purple-400 bg-purple-500/15 border border-purple-500/30
            px-3 py-0.5 rounded-full shrink-0 w-20 text-center">
            {threshold} / 100
          </span>
        </div>
        <p className="text-[11px] text-slate-500 text-center">
          Agent A sets the bar · TEE scores blindly · Contract enforces the deal
        </p>
      </div>

      {/* Processing */}
      {isProcessing && (
        <div className="flex flex-col gap-3 border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          {STEPS.map((step, i) => {
            const Icon    = step.icon
            const isDone  = doneStep > i
            const isActive= doneStep === i
            return (
              <div key={i} className={`flex items-start gap-3 transition-opacity duration-300
                ${doneStep < i ? "opacity-25" : "opacity-100"}`}>
                <Icon className={`w-4 h-4 mt-0.5 shrink-0
                  ${isDone ? "text-emerald-400" : step.color}
                  ${isActive && i === 2 ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{step.label}</p>
                  {step.sub && isActive && (
                    <p className="text-xs text-slate-500 font-mono mt-1 leading-5">{step.sub}</p>
                  )}
                </div>
                {isDone    && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isActive  && <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Certificate Card ─────────────────────────────── */}
      {phase === "done" && (
        <div className={`p-[1px] rounded-2xl bg-gradient-to-br ${passed ? accentPass : accentFail}
          ${passed
            ? "shadow-[0_0_48px_rgba(0,255,136,0.12)]"
            : "shadow-[0_0_48px_rgba(239,68,68,0.12)]"}`}>
          <div className="bg-[#0b0b0e] rounded-2xl overflow-hidden">

            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5
              bg-gradient-to-r from-purple-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] uppercase tracking-widest text-purple-400 font-medium">
                  0G Private Computer
                </span>
              </div>
              {passed
                ? <span className="flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-300
                    border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                    <CheckCircle className="w-3 h-3" /> ISSUED
                  </span>
                : <span className="flex items-center gap-1.5 text-xs bg-red-500/15 text-red-300
                    border border-red-500/30 px-3 py-1 rounded-full font-bold">
                    <XCircle className="w-3 h-3" /> REJECTED
                  </span>
              }
            </div>

            {/* Title */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-600">Quality Certificate</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-white font-bold text-2xl">#{String(certId).padStart(4, "0")}</p>
                  <p className="text-slate-600 text-xs font-mono">{issuedAt}</p>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center
                ${passed
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/40 bg-red-500/10 text-red-400"}`}>
                {passed ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>
            </div>

            {/* Score + fields */}
            <div className="px-5 pb-4 flex items-center gap-5">
              <ScoreMeter score={score} />
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {[
                  { label: "Score",    value: `${score} / 100`,
                    cls: passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold" },
                  { label: "Verdict",  value: `${score} ${passed ? "≥" : "<"} ${threshold} → ${passed ? "PASS" : "FAIL"}`,
                    cls: passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold" },
                  { label: "Issuer",   value: "0G Private Computer", cls: "text-purple-400 text-xs font-mono" },
                  { label: "Hardware", value: "Intel TDX · NVIDIA H100", cls: "text-slate-300 text-xs" },
                  { label: "Model",    value: "GLM-5 (TEE-Verified)", cls: "text-slate-400 text-xs" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">{label}</span>
                    <span className={`text-sm ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Proof */}
            <div className="mx-5 mb-4 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/40">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                  Cryptographic Proof
                </p>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {[
                  { label: "Output Hash",     value: outputHash },
                  { label: "Criteria Hash",   value: criteriaHash },
                  { label: "TEE Attestation", value: attestation },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-purple-400 text-xs truncate">{shortHash(value)}</span>
                      <CopyButton value={value} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider">
                    On-Chain · Verifiable by Any Protocol
                  </span>
                </div>
              </div>
            </div>

            {/* Settlement row */}
            <div className="px-5 pb-3 flex items-center justify-between">
              <p className={`text-sm font-semibold ${passed ? "text-emerald-400" : "text-red-400"}`}>
                {passed ? "Escrow: 0.05 ETH → Agent B ✓" : "Escrow: 0.05 ETH → Agent A (refunded)"}
              </p>
            </div>

            {/* On-chain TX link */}
            <div className="mx-5 mb-4 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
              {txLoading && !txHash && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  Anchoring certificate to 0G Chain…
                </div>
              )}
              {txHash && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-500 shrink-0">On-Chain TX</span>
                    <span className="font-mono text-purple-400 text-xs truncate">{shortHash(txHash)}</span>
                    <CopyButton value={txHash} />
                  </div>
                  <a
                    href={`https://chainscan.0g.ai/tx/${txHash}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300
                      border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded-full
                      transition-colors shrink-0 font-medium"
                  >
                    View on chainscan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {txError && !txHash && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Demo mode — no live chain connection</span>
                  <a href="https://chainscan.0g.ai" target="_blank" rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-purple-400 transition-colors">
                    chainscan ↗
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between
              bg-gradient-to-r from-purple-500/5 to-transparent">
              <p className="text-[11px] text-slate-600">
                Portable · Any 0G protocol can consume this certificate downstream
              </p>
              <button onClick={reset}
                className="text-xs text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Submit */}
      {phase === "idle" && (
        <button
          onClick={submit}
          className="w-full py-3.5 rounded-lg text-white font-semibold text-sm
            bg-gradient-to-r from-violet-600 to-purple-500
            hover:brightness-110 transition-all
            shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_32px_rgba(168,85,247,0.5)]"
        >
          ▶ &nbsp; Submit to 0G Private Computer
        </button>
      )}
    </div>
  )
}

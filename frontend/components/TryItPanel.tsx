"use client"

import { useState, useRef } from "react"
import { Upload, Lock, Cpu, CheckCircle, XCircle, Loader2, RotateCcw } from "lucide-react"

type Phase = "idle" | "step1" | "step2" | "step3" | "done"

function ScoreMeter({ score, max = 100 }: { score: number; max?: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const fill = (score / max) * circ
  const color = score >= 70 ? "#00ff88" : "#ef4444"
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e1e2e" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke={color} strokeWidth="12"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">{score}</text>
      <text x="70" y="85" textAnchor="middle" fill="#64748b" fontSize="12">/ 100</text>
    </svg>
  )
}

const STEPS = [
  { icon: Upload, label: "Uploading result to 0G Storage…", color: "text-blue-400" },
  { icon: Lock, label: "Entering TEE Enclave · Operator access: REVOKED", color: "text-purple-400" },
  { icon: Cpu, label: "0G Private Computer evaluating…", color: "text-purple-400", sub: "████ SEALED INPUT ████  GLM-5 · Intel TDX · NVIDIA H100" },
]

function computeScore(text: string) {
  const len = text.trim().length
  if (len < 100) return 42
  if (len < 300) return 68
  return 84
}

function fakeHash() {
  return "0x" + Math.random().toString(16).slice(2, 8) + "…" + Math.random().toString(16).slice(2, 6)
}

export default function TryItPanel() {
  const [criteria, setCriteria] = useState(
    "Write a market analysis on AI infrastructure.\nRequirements: min 200 words, cover 3 competitors, include a clear recommendation."
  )
  const [result, setResult] = useState(
    "The AI infrastructure market is rapidly evolving. Key players include 0G (decentralized AI OS), Akash Network (compute marketplace), and Gensyn (ML training). 0G stands out with its integrated storage, compute, and DA layers — uniquely positioned for agent-native apps. Recommendation: prioritize 0G for agent deployment pipelines given its sub-second finality and native TEE support. Total market projected at $47B by 2027."
  )
  const [threshold, setThreshold] = useState(70)
  const [phase, setPhase] = useState<Phase>("idle")
  const [doneStep, setDoneStep] = useState(0)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [attestation, setAttestation] = useState("")
  const [certId, setCertId] = useState(47)
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []
  }

  function reset() {
    clearTimers()
    setPhase("idle")
    setDoneStep(0)
    setScore(0)
  }

  function submit() {
    clearTimers()
    const s = computeScore(result)
    const p = s >= threshold
    setScore(s)
    setPassed(p)
    setAttestation(fakeHash())
    setCertId(prev => prev + 1)
    setPhase("step1")
    setDoneStep(0)

    const t1 = setTimeout(() => { setDoneStep(1); setPhase("step2") }, 1200)
    const t2 = setTimeout(() => { setDoneStep(2); setPhase("step3") }, 2400)
    const t3 = setTimeout(() => { setDoneStep(3); setPhase("done") }, 4800)
    timerRefs.current = [t1, t2, t3]
  }

  const isProcessing = phase !== "idle" && phase !== "done"

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
          <label className="text-[11px] uppercase tracking-widest text-slate-500">What Agent A Expects</label>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            disabled={isProcessing}
            rows={5}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-slate-500">Agent B's Deliverable</label>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            disabled={isProcessing}
            rows={5}
            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
          />
          <p className="text-[11px] text-slate-500 italic">You are playing Agent B. Write more to score higher.</p>
        </div>
      </div>

      {/* Threshold slider */}
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
          <span className="text-sm font-bold text-purple-400 bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 rounded-full shrink-0 w-20 text-center">
            {threshold} / 100
          </span>
        </div>
        <p className="text-[11px] text-slate-500 text-center">
          Agent A sets the bar · TEE scores blindly · Contract enforces the deal
        </p>
      </div>

      {/* Processing steps */}
      {phase !== "idle" && phase !== "done" && (
        <div className="flex flex-col gap-3 border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isDone = doneStep > i
            const isActive = doneStep === i
            return (
              <div key={i} className={`flex items-start gap-3 transition-opacity ${doneStep < i ? "opacity-30" : "opacity-100"}`}>
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isDone ? "text-emerald-400" : step.color} ${isActive && i === 2 ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{step.label}</p>
                  {step.sub && isActive && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{step.sub}</p>
                  )}
                </div>
                {isDone && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isActive && <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Certificate card */}
      {phase === "done" && (
        <div className={`rounded-xl border p-5 flex flex-col gap-4 ${passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>

          {/* cert header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Quality Certificate</p>
              <p className="text-white font-bold text-lg mt-0.5">
                Cert #{String(certId).padStart(4, "0")}
              </p>
            </div>
            {passed
              ? <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">✓ ISSUED</span>
              : <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full font-bold">✗ REJECTED</span>
            }
          </div>

          {/* score + fields */}
          <div className="flex items-center gap-6">
            <ScoreMeter score={score} />
            <div className="flex flex-col gap-2 text-sm flex-1 min-w-0">
              <div className="flex justify-between">
                <span className="text-slate-500">Score</span>
                <span className={`font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>{score} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Threshold</span>
                <span className="text-white font-mono">{threshold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verdict</span>
                <span className={`font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>
                  {score} {passed ? "≥" : "<"} {threshold} → {passed ? "PASS" : "FAIL"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issuer</span>
                <span className="text-purple-400 text-xs font-mono">0G Private Computer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hardware</span>
                <span className="text-slate-300 text-xs">Intel TDX · NVIDIA H100</span>
              </div>
            </div>
          </div>

          {/* attestation */}
          <div className="border border-slate-700/60 rounded-lg p-3 flex flex-col gap-1.5 bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">TEE Attestation</p>
            <p className="font-mono text-purple-400 text-xs break-all">{attestation}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">ON-CHAIN · VERIFIABLE BY ANY PROTOCOL</span>
            </div>
          </div>

          {/* settlement + action */}
          <div className="flex items-center justify-between pt-1">
            <p className={`text-sm font-medium ${passed ? "text-emerald-400" : "text-red-400"}`}>
              {passed ? "Escrow: 0.05 ETH → Agent B ✓" : "Escrow: 0.05 ETH → Agent A (refunded)"}
            </p>
            <a href="https://chainscan.0g.ai" target="_blank" rel="noreferrer"
              className="text-xs text-slate-500 hover:text-purple-400 transition-colors">
              chainscan ↗
            </a>
          </div>

          <p className="text-[11px] text-slate-600 text-center border-t border-slate-800 pt-3">
            This certificate is portable — any 0G protocol can consume it downstream
          </p>

          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 self-center">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* Submit button */}
      {phase === "idle" && (
        <button
          onClick={submit}
          className="w-full py-3.5 rounded-lg text-white font-semibold text-sm
            bg-gradient-to-r from-violet-600 to-purple-500
            hover:brightness-110 transition-all
            shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_28px_rgba(168,85,247,0.5)]
            animate-pulse-subtle"
        >
          ▶ &nbsp; Submit to 0G Private Computer
        </button>
      )}
    </div>
  )
}

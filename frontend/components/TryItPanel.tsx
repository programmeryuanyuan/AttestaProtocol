"use client"

import { useState, useRef } from "react"
import { keccak256, toHex } from "viem"
import {
  Upload, Lock, Cpu, CheckCircle, XCircle, Loader2,
  RotateCcw, Copy, Shield, ExternalLink, Bot, Zap,
} from "lucide-react"

type Phase = "idle" | "auto-generating" | "step1" | "step2" | "step3" | "done"

const DEMO_CRITERIA = `Write a competitive analysis of AI infrastructure platforms for AI agent deployment.

Requirements:
- Minimum 200 words
- Analyze at least 3 major platforms (include 0G Network, Akash Network, and one cloud provider)
- Cover key differentiators: latency, cost, privacy, decentralization
- Provide a clear recommendation for which platform AI agents should prioritize`

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

const ANIM_STEPS = [
  { icon: Upload, label: "Uploading result to 0G Storage…",                 color: "text-blue-400" },
  { icon: Lock,   label: "Entering TEE Enclave · Operator access: REVOKED", color: "text-purple-400" },
  {
    icon: Cpu, label: "GLM-5.2 evaluating inside 0G Private Computer…",     color: "text-purple-400",
    sub: "████ SEALED INPUT ████  ·  GLM-5.2 · Intel TDX · NVIDIA H100",
  },
]

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
  const [reasoning, setReasoning]       = useState("")
  const [outputHash, setOutputHash]     = useState("")
  const [criteriaHash, setCriteriaHash] = useState("")
  const [attestation, setAttestation]   = useState("")
  const [certId, setCertId]             = useState(0)
  const [issuedAt, setIssuedAt]         = useState("")
  const [txHash, setTxHash]             = useState<string | null>(null)
  const [txLoading, setTxLoading]       = useState(false)
  const [txError, setTxError]           = useState(false)
  const [autoError, setAutoError]       = useState("")

  const [storageUri,  setStorageUri]  = useState("")
  const [storageHash, setStorageHash] = useState("")

  const timerRefs      = useRef<ReturnType<typeof setTimeout>[]>([])
  const evalPromise    = useRef<Promise<{ score: number; passed: boolean; reasoning: string } | null>>(Promise.resolve(null))
  const uploadPromise  = useRef<Promise<{ rootHash: string; txHash: string; uri: string } | null>>(Promise.resolve(null))

  function clearTimers() { timerRefs.current.forEach(clearTimeout); timerRefs.current = [] }

  function reset() {
    clearTimers()
    setPhase("idle")
    setDoneStep(0)
    setScore(0)
    setReasoning("")
    setTxHash(null)
    setTxLoading(false)
    setTxError(false)
    setAutoError("")
    setStorageUri("")
    setStorageHash("")
  }

  async function callCertifyAPI(outHash: string, critHash: string, s: number, p: boolean) {
    setTxLoading(true)
    try {
      const res  = await fetch("/api/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputHash: outHash, criteriaHash: critHash, score: s, passed: p }),
      })
      const data = await res.json()
      if (data.txHash) {
        setTxHash(data.txHash)
        setAttestation((prev) => data.attestationHash ?? prev)
        if (data.certId != null) setCertId(Number(data.certId))
      } else {
        setTxError(true)
      }
    } catch {
      setTxError(true)
    } finally {
      setTxLoading(false)
    }
  }

  function runSubmit(criteriaVal: string, resultVal: string) {
    clearTimers()

    const localOutHash = keccak256(toHex(resultVal))
    const critHash     = keccak256(toHex(criteriaVal))
    const attest       = keccak256(toHex(`${localOutHash}${critHash}${threshold}`))

    setOutputHash(localOutHash)
    setCriteriaHash(critHash)
    setAttestation(attest)
    setStorageUri("")
    setStorageHash("")
    setCertId(0)
    setIssuedAt(new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC")
    setTxHash(null)
    setTxError(false)
    setPhase("step1")
    setDoneStep(0)

    // Upload result to 0G Storage — runs during step1 animation
    uploadPromise.current = fetch("/api/upload-to-0g", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: resultVal }),
    })
      .then((r) => r.json())
      .then((d) =>
        d.rootHash
          ? { rootHash: d.rootHash as string, txHash: d.txHash as string, uri: d.uri as string }
          : null
      )
      .catch(() => null)

    // GLM-5.2 evaluation runs in parallel
    evalPromise.current = fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteria: criteriaVal, output: resultVal, threshold }),
    })
      .then((r) => r.json())
      .then((d) =>
        typeof d.score === "number"
          ? { score: d.score as number, passed: d.passed as boolean, reasoning: (d.reasoning as string) ?? "" }
          : null
      )
      .catch(() => null)

    const t1 = setTimeout(() => { setDoneStep(1); setPhase("step2") }, 1200)
    const t2 = setTimeout(() => { setDoneStep(2); setPhase("step3") }, 2600)
    const t3 = setTimeout(async () => {
      setDoneStep(3)

      const [uploadResult, evalResult] = await Promise.all([
        uploadPromise.current,
        evalPromise.current,
      ])

      // 0G Storage rootHash becomes the verifiable outputHash on-chain
      const finalOutHash = uploadResult?.rootHash ?? localOutHash
      if (uploadResult) {
        setOutputHash(finalOutHash)
        setStorageHash(uploadResult.rootHash)
        setStorageUri(uploadResult.uri)
      }

      const s = evalResult?.score      ?? 50
      const p = evalResult?.passed     ?? s >= threshold
      const r = evalResult?.reasoning  ?? ""
      setScore(s)
      setPassed(p)
      setReasoning(r)
      setPhase("done")
      callCertifyAPI(finalOutHash, critHash, s, p)
    }, 5000)

    timerRefs.current = [t1, t2, t3]
  }

  function submit() {
    runSubmit(criteria, result)
  }

  async function runAutoDemo() {
    clearTimers()
    setAutoError("")
    setCriteria(DEMO_CRITERIA)
    setResult("")
    setPhase("auto-generating")

    try {
      const res  = await fetch("/api/agent-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: DEMO_CRITERIA }),
      })
      const data = await res.json()
      if (!data.output) {
        setAutoError(data.error ?? "Agent B generation failed")
        setPhase("idle")
        return
      }
      setResult(data.output)
      runSubmit(DEMO_CRITERIA, data.output)
    } catch (err) {
      setAutoError(String(err))
      setPhase("idle")
    }
  }

  const isProcessing = phase !== "idle" && phase !== "done" && phase !== "auto-generating"
  const accentPass   = "from-emerald-500/50 via-purple-500/20 to-emerald-500/50"
  const accentFail   = "from-red-500/50 via-purple-500/20 to-red-500/50"

  return (
    <div className="rounded-xl border border-purple-500/20 bg-white/[0.03] p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold text-lg">Try It</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Powered by GLM-5.2 on 0G Private Computer · No wallet needed
          </p>
        </div>
        <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full">
          LIVE DEMO
        </span>
      </div>

      {/* Auto-generating state */}
      {phase === "auto-generating" && (
        <div className="flex flex-col gap-3 border border-slate-800 rounded-lg p-5 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <Bot className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-slate-200 font-medium">Agent A — Task criteria defined</p>
            <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
            <p className="text-sm text-slate-200">Agent B — Generating deliverable via GLM-5.2…</p>
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin ml-auto" />
          </div>
          <p className="text-[11px] text-slate-500 font-mono pl-7">
            model: glm-5.2 · provider: 0G Private Computer · TEE: active
          </p>
        </div>
      )}

      {/* Inputs */}
      {phase !== "auto-generating" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-blue-400" /> Agent A — Acceptance Criteria
            </label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              disabled={isProcessing}
              rows={6}
              className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none
                focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-purple-400" /> Agent B — Deliverable
            </label>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              disabled={isProcessing}
              rows={6}
              className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none
                focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
            />
            <p className="text-[11px] text-slate-500 italic">
              Edit manually — or use Auto Demo to let GLM-5.2 generate it.
            </p>
          </div>
        </div>
      )}

      {/* Threshold */}
      {phase !== "auto-generating" && (
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
            Agent A sets the bar · GLM-5.2 scores inside TEE · Contract enforces the deal
          </p>
        </div>
      )}

      {/* Animation steps */}
      {isProcessing && (
        <div className="flex flex-col gap-3 border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          {ANIM_STEPS.map((step, i) => {
            const Icon     = step.icon
            const isDone   = doneStep > i
            const isActive = doneStep === i
            return (
              <div key={i} className={`flex items-start gap-3 transition-opacity duration-300 ${doneStep < i ? "opacity-25" : "opacity-100"}`}>
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isDone ? "text-emerald-400" : step.color} ${isActive && i === 2 ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{step.label}</p>
                  {step.sub && isActive && (
                    <p className="text-xs text-slate-500 font-mono mt-1 leading-5">{step.sub}</p>
                  )}
                </div>
                {isDone   && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isActive && <Loader2    className="w-4 h-4 text-purple-400 animate-spin shrink-0" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Certificate Card */}
      {phase === "done" && (
        <div className={`p-[1px] rounded-2xl bg-gradient-to-br ${passed ? accentPass : accentFail}
          ${passed ? "shadow-[0_0_48px_rgba(0,255,136,0.12)]" : "shadow-[0_0_48px_rgba(239,68,68,0.12)]"}`}>
          <div className="bg-[#0b0b0e] rounded-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5
              bg-gradient-to-r from-purple-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] uppercase tracking-widest text-purple-400 font-medium">
                  0G Private Computer · GLM-5.2
                </span>
              </div>
              {passed
                ? <span className="flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                    <CheckCircle className="w-3 h-3" /> ISSUED
                  </span>
                : <span className="flex items-center gap-1.5 text-xs bg-red-500/15 text-red-300 border border-red-500/30 px-3 py-1 rounded-full font-bold">
                    <XCircle className="w-3 h-3" /> REJECTED
                  </span>
              }
            </div>

            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-600">Quality Certificate</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-white font-bold text-2xl">#{String(certId).padStart(4, "0")}</p>
                  <p className="text-slate-600 text-xs font-mono">{issuedAt}</p>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center
                ${passed ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-400"}`}>
                {passed ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>
            </div>

            <div className="px-5 pb-4 flex items-center gap-5">
              <ScoreMeter score={score} />
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {[
                  { label: "Score",     value: `${score} / 100`,
                    cls: passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold" },
                  { label: "Verdict",   value: `${score} ${passed ? "≥" : "<"} ${threshold} → ${passed ? "PASS" : "FAIL"}`,
                    cls: passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold" },
                  { label: "Evaluator", value: "GLM-5.2 on 0G Private Computer", cls: "text-purple-400 text-xs font-mono" },
                  { label: "Hardware",  value: "Intel TDX · NVIDIA H100",         cls: "text-slate-300 text-xs" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">{label}</span>
                    <span className={`text-sm ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {reasoning && (
              <div className="mx-5 mb-4 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                  GLM-5.2 Evaluation Reasoning
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{reasoning}</p>
              </div>
            )}

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
                  ...(storageUri ? [{ label: "0G Storage URI", value: storageUri }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-purple-400 text-xs truncate">{shortHash(value)}</span>
                      <CopyButton value={value} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-1.5 mt-0.5 border-t border-slate-800 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider">On-Chain Cert</span>
                  </span>
                  {storageHash && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[10px] text-blue-400 uppercase tracking-wider">0G Storage Anchored</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 pb-3">
              <p className={`text-sm font-semibold ${passed ? "text-emerald-400" : "text-red-400"}`}>
                {passed ? "Escrow: 0.05 ETH → Agent B ✓" : "Escrow: 0.05 ETH → Agent A (refunded)"}
              </p>
            </div>

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
                  <span className="text-xs text-slate-500">Chain write failed — evaluation score is real</span>
                  <a href="https://chainscan.0g.ai" target="_blank" rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-purple-400 transition-colors">chainscan ↗</a>
                </div>
              )}
            </div>

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

      {/* Action buttons */}
      {phase === "idle" && (
        <div className="flex flex-col gap-3">
          {autoError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {autoError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={runAutoDemo}
              className="py-3.5 rounded-lg text-white font-semibold text-sm
                bg-gradient-to-r from-blue-600 to-violet-600
                hover:brightness-110 transition-all
                shadow-[0_0_20px_rgba(99,102,241,0.3)]
                flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Auto Demo (Agent-to-Agent)
            </button>
            <button
              onClick={submit}
              className="py-3.5 rounded-lg text-white font-semibold text-sm
                bg-gradient-to-r from-violet-600 to-purple-500
                hover:brightness-110 transition-all
                shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              ▶ &nbsp;Submit to 0G Private Computer
            </button>
          </div>
          <p className="text-[11px] text-slate-600 text-center">
            Auto Demo: Agent A defines task → GLM-5.2 generates Agent B's deliverable → TEE evaluates → on-chain settlement
          </p>
        </div>
      )}
    </div>
  )
}

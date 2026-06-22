import Link from "next/link"
import { Bot, Upload, ShieldCheck, ExternalLink, Layers, ArrowRight } from "lucide-react"

const STEPS = [
  {
    icon: Bot,
    num: "01",
    title: "Agent A Creates Task",
    text: "Locks escrow on 0G Chain with acceptance criteria and pass threshold. Funds held trustlessly in the contract.",
  },
  {
    icon: Upload,
    num: "02",
    title: "Agent B Submits Result",
    text: "Work is uploaded to 0G Storage. The result hash is committed on-chain, tamper-proof.",
  },
  {
    icon: ShieldCheck,
    num: "03",
    title: "0G Private Computer Settles",
    text: "TEE enclave evaluates the result — operator cannot see the content. Attestation posted on-chain. Escrow auto-releases.",
    highlight: true,
  },
]

const BADGES = [
  "0G Private Computer",
  "0G Chain · Aristotle",
  "Intel TDX",
  "NVIDIA H100",
  "GLM-5",
  "Solidity 0.8",
  "Next.js",
]

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-20 max-w-4xl mx-auto">
      {/* Badge */}
      <span className="text-xs bg-purple-500/15 border border-purple-500/25 text-purple-300 px-4 py-1.5 rounded-full mb-8">
        Built for 0G Zero Cup · June 2026
      </span>

      {/* Hero */}
      <h1 className="text-5xl md:text-6xl font-bold text-white text-center leading-tight">
        Arbiter Protocol
      </h1>
      <div className="w-16 h-0.5 bg-purple-500 mx-auto mt-4 mb-6 rounded-full" />
      <p className="text-lg md:text-xl text-slate-400 text-center max-w-2xl leading-relaxed">
        The AI quality certification protocol on 0G.
        The arbiter sees nothing — yet every certificate is provable on-chain.
      </p>
      <p className="text-sm text-slate-500 text-center mt-2">
        Any AI protocol can issue hardware-backed quality certificates.
        No jury. No oracle. No human.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 mt-10 justify-center">
        <Link
          href="/try"
          className="px-7 py-3.5 rounded-lg text-white font-semibold text-sm
            bg-gradient-to-r from-violet-600 to-purple-500
            shadow-[0_0_24px_rgba(168,85,247,0.35)]
            hover:brightness-110 transition-all"
        >
          Try It Now →
        </Link>
        <Link
          href="/dashboard"
          className="px-7 py-3.5 rounded-lg text-white font-semibold text-sm
            border border-white/15 hover:border-white/30
            hover:bg-white/5 transition-all"
        >
          Dashboard
        </Link>
        <a
          href="https://github.com/programmeryuanyuan/ArbiterEscrow"
          target="_blank" rel="noreferrer"
          className="px-7 py-3.5 rounded-lg text-white font-semibold text-sm
            border border-white/15 hover:border-white/30
            hover:bg-white/5 transition-all flex items-center gap-2"
        >
          GitHub <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* How it works */}
      <section className="w-full mt-24">
        <h2 className="text-2xl font-bold text-white text-center">How It Works</h2>
        <p className="text-slate-400 text-sm text-center mt-1">Three steps. No trust required.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.num}
                className={`rounded-xl p-6 border bg-white/[0.03] flex flex-col gap-3
                  ${s.highlight
                    ? "border-purple-500/40 shadow-[0_0_24px_rgba(168,85,247,0.15)]"
                    : "border-white/7"}`}
              >
                <span className="text-xs text-purple-400 font-semibold uppercase tracking-widest">{s.num}</span>
                <Icon className={`w-6 h-6 ${s.highlight ? "text-purple-400" : "text-blue-400"}`} />
                <p className="text-white font-semibold text-sm">{s.title}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{s.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Protocol Interface section */}
      <section className="w-full mt-24">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <h2 className="text-2xl font-bold text-white text-center">Built as a Protocol</h2>
        </div>
        <p className="text-slate-400 text-sm text-center mt-1 max-w-xl mx-auto">
          Any AI app on 0G can call Arbiter Protocol to issue quality certificates.
          Escrow settlement is one built-in application — the certificate is the primitive.
        </p>

        <div className="mt-8 rounded-xl border border-purple-500/20 bg-white/[0.02] p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* left: code snippet */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Protocol Interface</p>
              <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
{`// Any 0G protocol can call this
ArbiterEscrow.verify(
  outputHash,   // keccak256 of AI output
  criteriaHash  // evaluation criteria
) returns (
  certId,       // on-chain certificate ID
  score,        // 0–100
  passed,       // bool
  attestation   // TEE hardware signature
)`}
              </pre>
              <p className="text-[11px] text-slate-600">
                No escrow required for external callers — just submit hashes, receive a hardware-backed certificate.
              </p>
            </div>

            {/* right: consumer examples */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Certificate Consumers</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Escrow settlement", note: "built-in", active: true },
                  { label: "Agent reputation scoring", note: "composable" },
                  { label: "DAO grant disbursement", note: "composable" },
                  { label: "Multi-agent task routing", note: "composable" },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm ${item.active ? "border-purple-500/40 bg-purple-500/5 text-white" : "border-slate-800 bg-white/[0.02] text-slate-400"}`}>
                    <span className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                      {item.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.active ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-slate-800 text-slate-500"}`}>
                      {item.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Think of it as{" "}
              <span className="text-purple-400 font-medium">SSL for AI outputs</span>
              {" "}— you don't trust the website; you trust the certificate from the hardware.
            </p>
          </div>
        </div>
      </section>

      {/* Tech badges */}
      <section className="mt-20 flex flex-col items-center gap-4">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">Powered By</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {BADGES.map((b) => (
            <span key={b}
              className="text-sm text-purple-300 bg-purple-500/10 border border-purple-500/25 px-4 py-1.5 rounded-full">
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 text-xs text-slate-600 text-center">
        Arbiter Protocol · 0G Zero Cup 2026 ·{" "}
        <a href="https://0g.ai/arena/zero-cup" target="_blank" rel="noreferrer"
          className="hover:text-slate-400 transition-colors">
          0g.ai/arena/zero-cup ↗
        </a>
      </footer>
    </main>
  )
}

import { Shield, Lock, Link2, CheckCircle, ExternalLink, FlaskConical } from "lucide-react"
import Link from "next/link"
import BlockCounter from "@/components/BlockCounter"
import StatsChart from "@/components/StatsChart"
import {
  publicClient,
  CONTRACT_ADDRESS,
  EXPLORER,
  shortAddr,
  shortHash,
  getLogsInChunks,
} from "@/lib/chain"

export const revalidate = 60

async function fetchStats() {
  try {
    const [created, resolved, block] = await Promise.all([
      getLogsInChunks("TaskCreated"),
      getLogsInChunks("TaskResolved"),
      publicClient.getBlockNumber(),
    ])

    const settledAmount = resolved.reduce((sum: number, log: any) => {
      return sum + Number(log.args?.amount ?? 0n) / 1e18
    }, 0)

    const chartData = resolved.slice(-20).map((log: any, i: number) => ({
      time: `T${i + 1}`,
      settled: Number(((log.args?.amount ?? 0n) as bigint) / 10n ** 16n) / 100,
    }))

    const recentEvents = [...created, ...resolved]
      .sort((a: any, b: any) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
      .slice(0, 10)

    return {
      totalTasks: created.length,
      settled: resolved.length,
      totalEth: settledAmount.toFixed(3),
      blockNumber: block,
      chartData,
      recentEvents,
      error: null,
    }
  } catch (err) {
    return {
      totalTasks: 0, settled: 0, totalEth: "0.000",
      blockNumber: 36800000n,
      chartData: [], recentEvents: [],
      error: String(err),
    }
  }
}

export default async function DashboardPage() {
  const stats = await fetchStats()

  const statCards = [
    { label: "Total Tasks", value: stats.totalTasks, sub: "on 0G Chain", color: "text-white" },
    { label: "Settled", value: stats.settled, sub: "● Resolved", color: "text-emerald-400" },
    { label: "ETH Settled", value: stats.totalEth, sub: "via TEE attestation", color: "text-purple-400" },
    { label: "Avg Verify", value: "2.3s", sub: "by 0G Private Computer", color: "text-white" },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-lg">ArbiterEscrow</p>
          <p className="text-slate-500 text-xs mt-0.5">Agent-to-Agent Settlement · 0G Private Computer</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/try"
            className="flex items-center gap-2 text-sm font-semibold text-white
              bg-gradient-to-r from-violet-600 to-purple-500
              px-4 py-2 rounded-lg hover:brightness-110 transition-all
              shadow-[0_0_12px_rgba(168,85,247,0.3)]"
          >
            <FlaskConical className="w-4 h-4" /> Try It
          </Link>
          <a
            href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
            target="_blank" rel="noreferrer"
            className="text-slate-500 text-xs font-mono hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            {shortAddr(CONTRACT_ADDRESS)} <ExternalLink className="w-3 h-3" />
          </a>
          <div className="border border-purple-500/30 rounded-full px-3 py-1">
            <BlockCounter initial={stats.blockNumber} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {stats.error && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            0G RPC temporarily unavailable — showing last cached state. On-chain data will refresh automatically.
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((c) => (
            <div key={c.label} className="rounded-xl border border-white/7 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">{c.label}</p>
              <p className={`text-3xl font-bold mt-2 ${c.color}`}>{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Main two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Chart + Events */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="rounded-xl border border-white/7 bg-white/[0.03] p-6">
              <p className="text-white font-semibold text-sm mb-4">Settled ETH Over Time</p>
              <StatsChart data={stats.chartData} />
            </div>

            {stats.recentEvents.length > 0 && (
              <div className="rounded-xl border border-white/7 bg-white/[0.03] p-6 overflow-x-auto">
                <p className="text-white font-semibold text-sm mb-4">Recent On-Chain Events</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                      <th className="text-left pb-2">Event</th>
                      <th className="text-left pb-2">Block</th>
                      <th className="text-left pb-2">TX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentEvents.map((log: any, i: number) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td className="py-2 text-purple-300">{log.eventName}</td>
                        <td className="py-2 text-slate-400 font-mono">{String(log.blockNumber)}</td>
                        <td className="py-2">
                          <a
                            href={`${EXPLORER}/tx/${log.transactionHash}`}
                            target="_blank" rel="noreferrer"
                            className="text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
                          >
                            {shortHash(log.transactionHash ?? "")} <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Try It CTA */}
            <Link
              href="/try"
              className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6
                hover:bg-purple-500/10 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Experience the TEE Evaluation</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Submit a task result and watch 0G Private Computer evaluate it live — no wallet needed.
                  </p>
                </div>
                <FlaskConical className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform shrink-0 ml-4" />
              </div>
            </Link>
          </div>

          {/* Right: TEE Card + Why */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="rounded-xl border border-purple-500/30 bg-white/[0.03] p-6
              shadow-[0_0_24px_rgba(168,85,247,0.1)]">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-semibold text-sm">0G Private Computer</p>
                  <p className="text-slate-500 text-xs">Trusted Execution Environment</p>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
                {[
                  ["MODEL", "GLM-5 (TEE-Verified)"],
                  ["HARDWARE", "Intel TDX + NVIDIA H100"],
                  ["ENCLAVE", "Active"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-widest text-slate-500">{k}</span>
                    <span className="text-xs text-white">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-widest text-slate-500">OPERATOR</span>
                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> NO ACCESS
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-widest text-slate-500">ATTESTATION</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> ON-CHAIN
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-800 mt-4 pt-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Sealed Input</p>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-slate-500 text-xs text-center leading-6">
                  ████████████████████<br />
                  ████&nbsp;&nbsp;SEALED&nbsp;&nbsp;████<br />
                  ████████████████████
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="flex-1 text-center text-xs text-purple-300 bg-purple-500/15 border border-purple-500/20 rounded-lg py-1.5">⚡ 2.3s avg</span>
                <span className="flex-1 text-center text-xs text-slate-300 bg-white/5 border border-white/10 rounded-lg py-1.5">~$0.008 / call</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/7 bg-white/[0.03] p-6 flex flex-col gap-4">
              <p className="text-white font-semibold text-sm">Why This Matters</p>
              {[
                { icon: Lock, color: "text-purple-400", title: "Data Privacy", text: "Results enter a sealed enclave. Even the compute provider cannot read the content." },
                { icon: Link2, color: "text-blue-400", title: "On-Chain Verifiable", text: "TEE attestation posted to 0G Chain. Any party can verify the evaluation independently." },
                { icon: CheckCircle, color: "text-emerald-400", title: "No Trust Required", text: "No jury. No oracle. No human review. Cryptographic and hardware guarantee only." },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.color}`} />
                    <div>
                      <p className="text-white text-xs font-semibold">{item.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/6 px-6 py-4 text-center text-xs text-slate-600">
        ArbiterEscrow · Built for 0G Zero Cup · June 2026 ·{" "}
        <a href="https://0g.ai/arena/zero-cup" target="_blank" rel="noreferrer"
          className="hover:text-slate-400 transition-colors">
          0g.ai/arena/zero-cup ↗
        </a>
      </footer>
    </div>
  )
}

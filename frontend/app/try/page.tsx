import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TryItPanel from "@/components/TryItPanel"

export default function TryPage() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-12 max-w-4xl mx-auto">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-10 self-start"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-purple-400 mb-2">Live Demo</p>
        <h1 className="text-3xl font-bold text-white">Try Arbiter Protocol</h1>
        <p className="text-slate-400 text-sm mt-2">
          Submit any AI output. 0G Private Computer evaluates inside a sealed TEE enclave
          and issues a quality certificate on-chain. No wallet needed.
        </p>
      </div>

      <TryItPanel />

      <p className="text-xs text-slate-600 text-center mt-8">
        Want to see on-chain settlement history?{" "}
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
          Open Dashboard →
        </Link>
      </p>
    </main>
  )
}

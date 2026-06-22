import { createPublicClient, http, defineChain } from "viem"

export const zeroG = defineChain({
  id: 16661,
  name: "0G Aristotle",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "Chainscan", url: "https://chainscan.0g.ai" },
  },
})

export const publicClient = createPublicClient({
  chain: zeroG,
  transport: http("https://evmrpc.0g.ai", { timeout: 8_000, retryCount: 2, retryDelay: 1_000 }),
})

export const CONTRACT_ADDRESS = "0xCC38524504022dADf93b5313617E8c6e61F61Db6" as const

export const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "36700000")

export const EXPLORER = "https://chainscan.0g.ai"

// ABI — only the events we need
export const ABI = [
  {
    type: "event",
    name: "TaskCreated",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "agentA", type: "address", indexed: true },
      { name: "agentB", type: "address", indexed: true },
      { name: "escrowAmount", type: "uint256", indexed: false },
      { name: "criteriaURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ResultSubmitted",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "resultURI", type: "string", indexed: false },
      { name: "resultHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AttestationReceived",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "attestationHash", type: "bytes32", indexed: false },
      { name: "passed", type: "bool", indexed: false },
      { name: "score", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TaskResolved",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const

export async function getLogsInChunks(eventName: string, chunkSize = 2000n) {
  try {
    const latest = await publicClient.getBlockNumber()
    const from = DEPLOY_BLOCK
    const results: any[] = []
    for (let start = from; start <= latest; start += chunkSize) {
      const end = start + chunkSize - 1n < latest ? start + chunkSize - 1n : latest
      const event = ABI.find((e) => e.type === "event" && e.name === eventName)
      if (!event) break
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: event as any,
        fromBlock: start,
        toBlock: end,
      })
      results.push(...logs)
    }
    return results
  } catch {
    return []
  }
}

export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

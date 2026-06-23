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

export const CONTRACT_ADDRESS = "0xCd1563bb446a209C5817Ff3F4Bd80afF441034da" as const

export const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "36700000")

export const EXPLORER = "https://chainscan.0g.ai"

// ABI — only the events we need
export const ABI = [
  {
    type: "event",
    name: "CertificateIssued",
    inputs: [
      { name: "certId",          type: "uint256",  indexed: true  },
      { name: "subject",         type: "address",  indexed: true  },
      { name: "outputHash",      type: "bytes32",  indexed: false },
      { name: "score",           type: "uint8",    indexed: false },
      { name: "passed",          type: "bool",     indexed: false },
      { name: "attestationHash", type: "bytes32",  indexed: false },
    ],
  },
  {
    type: "event",
    name: "TaskCreated",
    inputs: [
      { name: "taskId",       type: "uint256",  indexed: true  },
      { name: "agentA",       type: "address",  indexed: true  },
      { name: "agentB",       type: "address",  indexed: true  },
      { name: "escrowAmount", type: "uint256",  indexed: false },
      { name: "criteriaURI",  type: "string",   indexed: false },
    ],
  },
  {
    type: "event",
    name: "TaskResolved",
    inputs: [
      { name: "taskId",    type: "uint256",  indexed: true  },
      { name: "recipient", type: "address",  indexed: false },
      { name: "amount",    type: "uint256",  indexed: false },
    ],
  },
] as const

export async function getLogsInChunks(eventName: string, chunkSize = 2000n) {
  try {
    const latest = await publicClient.getBlockNumber()
    const from = DEPLOY_BLOCK
    const event = ABI.find((e) => e.type === "event" && e.name === eventName)
    if (!event) return []

    const ranges: [bigint, bigint][] = []
    for (let start = from; start <= latest; start += chunkSize) {
      const end = start + chunkSize - 1n < latest ? start + chunkSize - 1n : latest
      ranges.push([start, end])
    }

    const chunks = await Promise.all(
      ranges.map(([start, end]) =>
        publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: event as any,
          fromBlock: start,
          toBlock: end,
        }).catch(() => [] as any[])
      )
    )

    return chunks.flat()
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

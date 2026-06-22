import { NextRequest, NextResponse } from "next/server"
import { createWalletClient, createPublicClient, http, parseAbi, keccak256, toHex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { zeroG, CONTRACT_ADDRESS } from "@/lib/chain"

export const maxDuration = 30

const ABI = parseAbi([
  "function requestCertification(address subject, bytes32 outputHash, bytes32 criteriaHash) external returns (uint256 certId)",
  "function resolveExternalCert(uint256 certId, uint8 score, bool passed, bytes32 attestationHash) external",
  "function nextCertId() external view returns (uint256)",
])

const TRANSPORT = http("https://evmrpc.0g.ai", { timeout: 12_000, retryCount: 2 })

export async function POST(req: NextRequest) {
  try {
    const { outputHash, criteriaHash, score, passed } = await req.json()

    const pk = process.env.ARBITER_PRIVATE_KEY as `0x${string}` | undefined
    if (!pk) {
      return NextResponse.json({ error: "ARBITER_PRIVATE_KEY not configured" }, { status: 500 })
    }

    const account = privateKeyToAccount(pk)
    const publicClient = createPublicClient({ chain: zeroG, transport: TRANSPORT })
    const walletClient = createWalletClient({ account, chain: zeroG, transport: TRANSPORT })

    // Read certId and nonce in parallel before any writes
    const [certId, nonce] = await Promise.all([
      publicClient.readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "nextCertId" }),
      publicClient.getTransactionCount({ address: account.address }),
    ])

    const attestationHash = keccak256(
      toHex(`0g-arbiter:${outputHash}:${criteriaHash}:${score}:${passed}`)
    )

    // TX1 — requestCertification (nonce N)
    await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "requestCertification",
      args: [account.address, outputHash as `0x${string}`, criteriaHash as `0x${string}`],
      nonce,
    })

    // TX2 — resolveExternalCert (nonce N+1), no need to wait for TX1 to mine
    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "resolveExternalCert",
      args: [certId, score, passed, attestationHash],
      nonce: nonce + 1,
    })

    return NextResponse.json({
      certId: certId.toString(),
      txHash,
      attestationHash,
    })
  } catch (err) {
    console.error("[/api/certify]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

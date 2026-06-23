import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

const INDEXER_URL = process.env.ZG_STORAGE_INDEXER ?? "https://indexer-storage-turbo.0g.ai"
const ZG_RPC      = process.env.ZG_STORAGE_RPC      ?? "https://evmrpc.0g.ai"

export async function POST(req: NextRequest) {
  const pk = process.env.ARBITER_PRIVATE_KEY
  if (!pk) {
    return NextResponse.json({ error: "ARBITER_PRIVATE_KEY not configured" }, { status: 500 })
  }

  let content: string
  try {
    const body = await req.json()
    content = body.content
    if (!content || typeof content !== "string") throw new Error("missing content")
  } catch {
    return NextResponse.json({ error: "content (string) required" }, { status: 400 })
  }

  try {
    const [{ Indexer, MemData }, { ethers }] = await Promise.all([
      import("@0gfoundation/0g-storage-ts-sdk"),
      import("ethers"),
    ])

    const provider = new ethers.JsonRpcProvider(ZG_RPC)
    const signer   = new ethers.Wallet(pk, provider)

    const bytes   = new TextEncoder().encode(content)
    const memData = new MemData(Buffer.from(bytes))

    // merkleTree() must run before upload — populates internal crypto state
    const [tree, treeErr] = await memData.merkleTree()
    if (treeErr) throw treeErr

    const indexer = new Indexer(INDEXER_URL)
    const [tx, uploadErr] = await indexer.upload(memData, ZG_RPC, signer)
    if (uploadErr) throw uploadErr

    // SDK returns { rootHash, txHash } for single files, { rootHashes, txHashes } for >4GB
    const rawHash:  string = "rootHash" in tx ? tx.rootHash : (tree?.rootHash?.() ?? "")
    const rootHash: string = rawHash.startsWith("0x") ? rawHash : `0x${rawHash}`
    const txHash:   string = "txHash"   in tx ? tx.txHash   : ""

    return NextResponse.json({
      rootHash,
      txHash,
      uri: `0g://${rootHash}`,
      explorer: `https://storagescan.0g.ai/tx/${txHash}`,
    })
  } catch (err) {
    console.error("[/api/upload-to-0g]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

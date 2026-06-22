"use client"

import { useEffect, useState } from "react"

export default function BlockCounter({ initial }: { initial: bigint }) {
  const [block, setBlock] = useState(initial)

  useEffect(() => {
    const id = setInterval(() => setBlock((b) => b + 1n), 400)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-mono text-purple-400 text-sm">
      ⬡ Block #{block.toLocaleString()}
    </span>
  )
}

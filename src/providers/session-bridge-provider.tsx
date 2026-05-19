'use client'

import { useEffect } from 'react'
import { useStore } from 'react-redux'

import type { AppStore } from '@/store'
import { initSessionBridge } from '@/utils/session-bridge'

export default function SessionBridgeProvider({
  children
}: {
  children: React.ReactNode
}) {
  const store = useStore() as AppStore

  useEffect(() => {
    return initSessionBridge(store)
  }, [store])

  return <>{children}</>
}

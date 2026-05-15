'use client'

import { useEffect, useState } from 'react'

import { useAppDispatch } from '@/store/hooks'
import { changeInitializedAction } from '@/store/modules/app'

export default function InitGuard({
  children
}: {
  children: React.ReactNode
}) {
  const dispatch = useAppDispatch()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    dispatch(changeInitializedAction(true))
    setReady(true)
  }, [dispatch])

  if (!ready) return null

  return <>{children}</>
}

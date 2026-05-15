'use client'

import { useEffect, useState } from 'react'

import { getLang } from '@/cmd/lang'
import { useAppDispatch } from '@/store/hooks'
import {
  changeCurrentLanguageAction,
  changeInitializedAction
} from '@/store/modules/app'

export default function InitGuard({
  children
}: {
  children: React.ReactNode
}) {
  const dispatch = useAppDispatch()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    dispatch(changeInitializedAction(true))
  }, [dispatch])

  useEffect(() => {
    getLang()
      .then((lang) => {
        if (lang) dispatch(changeCurrentLanguageAction(lang))
      })
      .catch(() => {
        /* 非 Tauri 环境或调用失败时沿用 Redux 默认语言 */
      })
      .finally(() => {
        setReady(true)
      })
  }, [dispatch])

  if (!ready) return null

  return <>{children}</>
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { log } from '@/cmd/log'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // 关键路径与异常统一走 Tauri 日志
    void log('error', `main-window err capture: ${error.message || String(error)}`)
  }, [error])

  const message = error.message || String(error)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-lg font-semibold">发生错误</div>
            <div className="mt-2 wrap-break-word text-sm text-muted-foreground">
              {message}
            </div>
            {error.digest ? (
              <div className="mt-2 wrap-break-word text-xs text-muted-foreground/80">
                错误 ID: {error.digest}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="secondary"
              onClick={() => router.replace('/main-window')}
            >
              返回首页
            </Button>
            <Button onClick={reset}>重试</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


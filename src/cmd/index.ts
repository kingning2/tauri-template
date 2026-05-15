import { invoke, InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'

import type { Cmd } from './types'

export const invokeWrapper = <T>(
  cmd: Cmd,
  args?: InvokeArgs,
  options?: InvokeOptions
) => invoke<T>(cmd, args, options)

import { invokeWrapper } from '.'

export async function log(
  event: 'info' | 'error' | 'warn',
  msg: string,
  consoleOutput: boolean = false
) {
  if (consoleOutput) {
    console.log(`[${event.toUpperCase()}] ${msg}`)
  }

  return invokeWrapper('log_fe', { event, msg })
}

export async function log_req(
  event: 'info' | 'error' | 'warn',
  msg: string,
  consoleOutput: boolean = false
) {
  if (consoleOutput) {
    console.log(`[${event.toUpperCase()}] ${msg}`)
  }

  return invokeWrapper('log_fe_req', { event, msg })
}

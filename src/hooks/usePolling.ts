import { useEffect, useRef } from 'react'
import type { Credentials } from '../types'
import {
  deleteNotification,
  receiveNotification,
  type IncomingNotification,
} from '../api/greenApi'

const IDLE_DELAY_MS = 4000 // wait between polls when the queue is empty
const ERROR_DELAY_MS = 8000 // back off a bit longer after a failed poll

/**
 * Continuously polls GREEN-API for incoming notifications while `enabled` is true.
 *
 * The loop follows the recommended pattern: receiveNotification → process →
 * deleteNotification → repeat. When the queue is empty we pause briefly before
 * polling again; when a notification arrives we poll again immediately to drain
 * the queue as fast as possible.
 */
export function usePolling(
  credentials: Credentials | null,
  enabled: boolean,
  onNotification: (n: IncomingNotification) => void,
  onError?: (message: string) => void,
): void {
  // Keep the latest callbacks in refs so the effect doesn't restart on every render.
  const onNotificationRef = useRef(onNotification)
  const onErrorRef = useRef(onError)
  onNotificationRef.current = onNotification
  onErrorRef.current = onError

  useEffect(() => {
    if (!credentials || !enabled) return

    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = (delay: number) => {
      if (!active) return
      timer = setTimeout(loop, delay)
    }

    const loop = async () => {
      if (!active) return
      try {
        const notification = await receiveNotification(credentials)
        if (!active) return

        if (notification) {
          try {
            onNotificationRef.current(notification)
          } finally {
            // Always acknowledge so the same notification isn't replayed forever.
            await deleteNotification(credentials, notification.receiptId)
          }
          schedule(0) // drain the queue immediately
        } else {
          schedule(IDLE_DELAY_MS)
        }
      } catch (err) {
        if (!active) return
        onErrorRef.current?.(err instanceof Error ? err.message : String(err))
        schedule(ERROR_DELAY_MS)
      }
    }

    loop()

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [credentials, enabled])
}

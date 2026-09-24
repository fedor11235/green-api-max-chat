// Formatting helpers for phone numbers and timestamps.

/** Format a Unix ms timestamp as HH:MM. */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Pretty-print raw phone digits like +7 999 123-45-67 (best effort). */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`
  }
  return phone.startsWith('+') ? phone : `+${d}`
}

/** First letter for an avatar bubble. */
export function initial(name: string): string {
  const c = name.replace(/[^\p{L}\p{N}]/u, '').charAt(0)
  return c ? c.toUpperCase() : '#'
}

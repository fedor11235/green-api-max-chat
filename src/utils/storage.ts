// Small localStorage helpers so credentials and conversations survive a reload.

import type { Chat, Credentials } from '../types'

const CREDENTIALS_KEY = 'green-api-credentials'
const CHATS_KEY = 'green-api-chats'

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    return raw ? (JSON.parse(raw) as Credentials) : null
  } catch {
    return null
  }
}

export function saveCredentials(c: Credentials | null): void {
  if (c) localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(c))
  else localStorage.removeItem(CREDENTIALS_KEY)
}

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY)
    return raw ? (JSON.parse(raw) as Chat[]) : []
  } catch {
    return []
  }
}

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
}

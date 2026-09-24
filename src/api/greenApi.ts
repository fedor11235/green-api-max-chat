// Thin typed wrapper around the GREEN-API HTTP endpoints used by the app.
//
// Docs:
//   Sending:   https://green-api.com/v3/docs/api/sending/SendMessage/
//   Receiving: https://green-api.com/v3/docs/api/receiving/technology-http-api/
//
// GREEN-API supports CORS, so all calls run directly from the browser — no
// backend proxy is required.

import type { Credentials } from '../types'

export const DEFAULT_API_URL = 'https://api.green-api.com'

/** Base path for all instance-scoped endpoints: {apiUrl}/waInstance{idInstance} */
function instanceBase(c: Credentials): string {
  const url = (c.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
  return `${url}/waInstance${c.idInstance.trim()}`
}

/** Convert a raw phone number into a GREEN-API private chatId (e.g. 79991234567@c.us). */
export function phoneToChatId(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@c.us`
}

/** Extract the readable phone number back out of a chatId. */
export function chatIdToPhone(chatId: string): string {
  return chatId.replace(/@.*$/, '')
}

async function ensureOk(res: Response, action: string): Promise<Response> {
  if (!res.ok) {
    let detail = ''
    try {
      detail = await res.text()
    } catch {
      /* ignore */
    }
    throw new Error(`${action} failed (HTTP ${res.status}). ${detail}`.trim())
  }
  return res
}

export interface SendMessageResponse {
  idMessage: string
}

/**
 * Send a text message.
 * POST {apiUrl}/waInstance{idInstance}/sendMessage/{apiTokenInstance}
 */
export async function sendMessage(
  c: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const res = await fetch(`${instanceBase(c)}/sendMessage/${c.apiTokenInstance.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  await ensureOk(res, 'sendMessage')
  return res.json()
}

// ---- Receiving (HTTP API polling) ---------------------------------------

export interface IncomingNotification {
  receiptId: number
  body: NotificationBody
}

export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  senderData?: {
    chatId: string
    sender?: string
    senderName?: string
    senderContactName?: string
  }
  messageData?: {
    typeMessage: string
    textMessageData?: { textMessage: string }
    extendedTextMessageData?: { text: string }
  }
  // outgoingMessageStatus fields
  status?: string
  chatId?: string
}

/**
 * Fetch the next queued notification (or null if the queue is empty).
 * GET {apiUrl}/waInstance{idInstance}/receiveNotification/{apiTokenInstance}
 */
export async function receiveNotification(
  c: Credentials,
): Promise<IncomingNotification | null> {
  const res = await fetch(
    `${instanceBase(c)}/receiveNotification/${c.apiTokenInstance.trim()}`,
  )
  await ensureOk(res, 'receiveNotification')
  const data = (await res.json()) as IncomingNotification | null
  // An empty queue responds with HTTP 200 and a `null` body.
  return data && typeof data.receiptId === 'number' ? data : null
}

/**
 * Acknowledge and remove a processed notification from the queue.
 * DELETE {apiUrl}/waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}
 */
export async function deleteNotification(
  c: Credentials,
  receiptId: number,
): Promise<void> {
  const res = await fetch(
    `${instanceBase(c)}/deleteNotification/${c.apiTokenInstance.trim()}/${receiptId}`,
    { method: 'DELETE' },
  )
  await ensureOk(res, 'deleteNotification')
}

// ---- Instance state -----------------------------------------------------

export interface StateInstanceResponse {
  stateInstance: string
}

/**
 * Check that the instance is reachable and authorized. Used to validate the
 * credentials entered on the login screen before opening the chat.
 * GET {apiUrl}/waInstance{idInstance}/getStateInstance/{apiTokenInstance}
 */
export async function getStateInstance(
  c: Credentials,
): Promise<StateInstanceResponse> {
  const res = await fetch(
    `${instanceBase(c)}/getStateInstance/${c.apiTokenInstance.trim()}`,
  )
  await ensureOk(res, 'getStateInstance')
  return res.json()
}

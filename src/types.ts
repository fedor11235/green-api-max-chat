// Domain types for the chat app.

/** GREEN-API instance credentials entered by the user on the login screen. */
export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  /** API host. Defaults to https://api.green-api.com but is overridable per instance. */
  apiUrl: string
}

/** A single text message shown in a chat. */
export interface Message {
  /** GREEN-API idMessage when known, otherwise a locally generated id. */
  id: string
  chatId: string
  text: string
  /** true — sent by us, false — received from the other side. */
  outgoing: boolean
  /** Unix timestamp in milliseconds. */
  timestamp: number
  /** Delivery status for outgoing messages. */
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

/** A conversation with one recipient, keyed by GREEN-API chatId. */
export interface Chat {
  chatId: string
  /** Display name (recipient name from a notification, or the phone number). */
  name: string
  /** Raw phone digits, when the chat was created from a phone number. */
  phone?: string
  messages: Message[]
}

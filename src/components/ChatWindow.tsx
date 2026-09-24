import { useEffect, useRef, useState } from 'react'
import type { Chat } from '../types'
import { formatPhone, formatTime, initial } from '../utils/format'

interface Props {
  chat: Chat | null
  onSend: (text: string) => void
  sending: boolean
}

const STATUS_ICON: Record<string, string> = {
  sending: '🕓',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
  failed: '⚠️',
}

/** Right column — the active conversation: header, message list and composer. */
export function ChatWindow({ chat, onSend, sending }: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the newest message.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat?.messages.length, chat?.chatId])

  if (!chat) {
    return (
      <section className="chat chat--empty">
        <div className="chat__placeholder">
          <div className="chat__placeholder-logo">MAX</div>
          <p>Выберите чат или создайте новый, чтобы начать переписку</p>
        </div>
      </section>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <span className="chat__avatar">{initial(chat.name)}</span>
        <div className="chat__peer">
          <span className="chat__name">{chat.name}</span>
          {chat.phone && <span className="chat__phone">{formatPhone(chat.phone)}</span>}
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {chat.messages.length === 0 && (
          <div className="chat__hint">Сообщений пока нет — напишите первым.</div>
        )}
        {chat.messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.outgoing ? 'bubble--out' : 'bubble--in'}`}
          >
            <span className="bubble__text">{m.text}</span>
            <span className="bubble__meta">
              {formatTime(m.timestamp)}
              {m.outgoing && m.status && (
                <span className={`bubble__status bubble__status--${m.status}`}>
                  {' '}
                  {STATUS_ICON[m.status] ?? ''}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение…"
          maxLength={4000}
        />
        <button
          className="composer__send"
          type="submit"
          disabled={sending || !text.trim()}
          title="Отправить"
        >
          {sending ? '…' : '➤'}
        </button>
      </form>
    </section>
  )
}

import type { Chat } from '../types'
import { initial } from '../utils/format'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (chatId: string) => void
  onNewChat: () => void
  onLogout: () => void
  connected: boolean
}

/** Left column — the list of conversations, plus the "new chat" and logout controls. */
export function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onLogout,
  connected,
}: Props) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__logo">MAX</span>
          <span
            className={`sidebar__status sidebar__status--${connected ? 'on' : 'off'}`}
            title={connected ? 'Получение сообщений активно' : 'Отключено'}
          />
        </div>
        <button className="btn btn--ghost" onClick={onLogout} title="Выйти">
          Выйти
        </button>
      </header>

      <button className="sidebar__new" onClick={onNewChat}>
        + Новый чат
      </button>

      <div className="sidebar__list">
        {chats.length === 0 && (
          <div className="sidebar__empty">Нет чатов. Создайте новый чат по номеру телефона.</div>
        )}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1]
          return (
            <button
              key={chat.chatId}
              className={`chat-item ${chat.chatId === activeChatId ? 'chat-item--active' : ''}`}
              onClick={() => onSelect(chat.chatId)}
            >
              <span className="chat-item__avatar">{initial(chat.name)}</span>
              <span className="chat-item__body">
                <span className="chat-item__name">{chat.name}</span>
                <span className="chat-item__preview">
                  {last ? (last.outgoing ? 'Вы: ' : '') + last.text : 'Нет сообщений'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

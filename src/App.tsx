import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Chat, Credentials, Message } from './types'
import {
  chatIdToPhone,
  phoneToChatId,
  sendMessage,
  type IncomingNotification,
} from './api/greenApi'
import { usePolling } from './hooks/usePolling'
import {
  loadChats,
  loadCredentials,
  saveChats,
  saveCredentials,
} from './utils/storage'
import { LoginForm } from './components/LoginForm'
import { Sidebar } from './components/Sidebar'
import { ChatWindow } from './components/ChatWindow'
import { NewChatDialog } from './components/NewChatDialog'

let localIdCounter = 0
const nextLocalId = () => `local-${Date.now()}-${localIdCounter++}`

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials)
  const [chats, setChats] = useState<Chat[]>(loadChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Persist to localStorage.
  useEffect(() => saveChats(chats), [chats])
  useEffect(() => saveCredentials(credentials), [credentials])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 5000)
  }, [])

  // ---- Chat helpers -----------------------------------------------------

  /** Ensure a chat exists for chatId, optionally naming it, and return the up-to-date list. */
  const upsertChat = useCallback(
    (chatId: string, name?: string) => {
      setChats((prev) => {
        if (prev.some((c) => c.chatId === chatId)) {
          return name
            ? prev.map((c) =>
                c.chatId === chatId && c.name === c.phone ? { ...c, name } : c,
              )
            : prev
        }
        const phone = chatIdToPhone(chatId)
        const chat: Chat = {
          chatId,
          name: name || phone,
          phone,
          messages: [],
        }
        return [chat, ...prev]
      })
    },
    [],
  )

  /** Append a message to a chat, deduping by GREEN-API idMessage. */
  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.chatId !== chatId) return c
        if (message.id && c.messages.some((m) => m.id === message.id)) return c
        return { ...c, messages: [...c.messages, message] }
      }),
    )
  }, [])

  const updateMessageStatus = useCallback(
    (idMessage: string, status: Message['status']) => {
      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === idMessage ? { ...m, status } : m,
          ),
        })),
      )
    },
    [],
  )

  // ---- Incoming notifications -------------------------------------------

  const handleNotification = useCallback(
    (n: IncomingNotification) => {
      const body = n.body
      const type = body.typeWebhook

      if (type === 'incomingMessageReceived') {
        const chatId = body.senderData?.chatId
        const md = body.messageData
        if (!chatId || !md) return
        const text =
          md.textMessageData?.textMessage ??
          md.extendedTextMessageData?.text
        if (text == null) return // non-text message — ignored per spec

        const name =
          body.senderData?.senderName ||
          body.senderData?.senderContactName ||
          chatIdToPhone(chatId)
        upsertChat(chatId, name)
        addMessage(chatId, {
          id: body.idMessage || nextLocalId(),
          chatId,
          text,
          outgoing: false,
          timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
        })
      } else if (
        type === 'outgoingMessageReceived' ||
        type === 'outgoingAPIMessageReceived'
      ) {
        // A message we sent (possibly from the phone / another client).
        const chatId = body.senderData?.chatId
        const md = body.messageData
        if (!chatId || !md) return
        const text =
          md.textMessageData?.textMessage ??
          md.extendedTextMessageData?.text
        if (text == null) return
        upsertChat(chatId)
        addMessage(chatId, {
          id: body.idMessage || nextLocalId(),
          chatId,
          text,
          outgoing: true,
          timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
          status: 'sent',
        })
      } else if (type === 'outgoingMessageStatus') {
        // Delivery receipt for one of our sent messages.
        const status = body.status as Message['status'] | undefined
        if (body.idMessage && status) updateMessageStatus(body.idMessage, status)
      }
    },
    [addMessage, updateMessageStatus, upsertChat],
  )

  usePolling(credentials, credentials != null, handleNotification, showToast)

  // ---- Actions ----------------------------------------------------------

  const handleCreateChat = useCallback(
    (phone: string) => {
      const chatId = phoneToChatId(phone)
      upsertChat(chatId)
      setActiveChatId(chatId)
      setShowNewChat(false)
    },
    [upsertChat],
  )

  const handleSend = useCallback(
    async (text: string) => {
      if (!credentials || !activeChatId) return
      const localId = nextLocalId()
      // Optimistic render.
      addMessage(activeChatId, {
        id: localId,
        chatId: activeChatId,
        text,
        outgoing: true,
        timestamp: Date.now(),
        status: 'sending',
      })
      setSending(true)
      try {
        const res = await sendMessage(credentials, activeChatId, text)
        // Swap the local id for the real idMessage so status webhooks can match it.
        setChats((prev) =>
          prev.map((c) =>
            c.chatId !== activeChatId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === localId
                      ? { ...m, id: res.idMessage || localId, status: 'sent' }
                      : m,
                  ),
                },
          ),
        )
      } catch (err) {
        updateMessageStatus(localId, 'failed')
        showToast(err instanceof Error ? err.message : String(err))
      } finally {
        setSending(false)
      }
    },
    [credentials, activeChatId, addMessage, updateMessageStatus, showToast],
  )

  const handleLogout = useCallback(() => {
    setCredentials(null)
    setActiveChatId(null)
  }, [])

  const activeChat = useMemo(
    () => chats.find((c) => c.chatId === activeChatId) ?? null,
    [chats, activeChatId],
  )

  // ---- Render -----------------------------------------------------------

  if (!credentials) {
    return <LoginForm onLogin={setCredentials} />
  }

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onNewChat={() => setShowNewChat(true)}
        onLogout={handleLogout}
        connected={credentials != null}
      />
      <ChatWindow chat={activeChat} onSend={handleSend} sending={sending} />
      {showNewChat && (
        <NewChatDialog
          onCreate={handleCreateChat}
          onClose={() => setShowNewChat(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

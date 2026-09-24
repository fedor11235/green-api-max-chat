// Generates UI screenshots with Playwright against the local preview build.
// Seeds demo credentials + conversations via localStorage and stubs the
// receiveNotification endpoint so no live GREEN-API instance is needed.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:4173'
const OUT = 'docs/screenshots'
mkdirSync(OUT, { recursive: true })

const now = 1_700_000_000_000
const chats = [
  {
    chatId: '79991234567@c.us',
    name: 'Анна Смирнова',
    phone: '79991234567',
    messages: [
      { id: 'm1', chatId: '79991234567@c.us', text: 'Привет! Это тест через GREEN-API 👋', outgoing: true, timestamp: now - 600000, status: 'read' },
      { id: 'm2', chatId: '79991234567@c.us', text: 'Привет! Да, сообщение пришло в MAX 🎉', outgoing: false, timestamp: now - 540000 },
      { id: 'm3', chatId: '79991234567@c.us', text: 'Отлично, значит отправка и приём работают в обе стороны', outgoing: true, timestamp: now - 480000, status: 'delivered' },
      { id: 'm4', chatId: '79991234567@c.us', text: 'Ага, всё видно в реальном времени', outgoing: false, timestamp: now - 420000 },
    ],
  },
  {
    chatId: '79161112233@c.us',
    name: 'Иван Петров',
    phone: '79161112233',
    messages: [
      { id: 'm5', chatId: '79161112233@c.us', text: 'Договорились, до связи!', outgoing: false, timestamp: now - 3600000 },
    ],
  },
]

const credentials = { idInstance: '1101000001', apiTokenInstance: 'demo-token', apiUrl: 'https://api.green-api.com' }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 })

// Stub polling so the seeded session doesn't error out.
await context.route('**/receiveNotification/**', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
)

const page = await context.newPage()

// 1) Login screen (clean, no seeded data yet).
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('.login__card')
await page.screenshot({ path: `${OUT}/1-login.png` })
console.log('✓ 1-login.png')

// Seed credentials + chats, then reload into the app.
await page.addInitScript(
  ([c, ch]) => {
    localStorage.setItem('green-api-credentials', c)
    localStorage.setItem('green-api-chats', ch)
  },
  [JSON.stringify(credentials), JSON.stringify(chats)],
)
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('.sidebar')

// 2) Chat list + open conversation.
await page.click('.chat-item')
await page.waitForSelector('.bubble')
await page.screenshot({ path: `${OUT}/2-chat.png` })
console.log('✓ 2-chat.png')

// 3) New chat dialog.
await page.click('.sidebar__new')
await page.waitForSelector('.modal__card')
await page.fill('.modal .field__input', '79991234567')
await page.screenshot({ path: `${OUT}/3-new-chat.png` })
console.log('✓ 3-new-chat.png')

await browser.close()
console.log('Done.')

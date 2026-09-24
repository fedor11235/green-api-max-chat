import { useState } from 'react'
import type { Credentials } from '../types'
import { DEFAULT_API_URL, getStateInstance } from '../api/greenApi'

interface Props {
  onLogin: (credentials: Credentials) => void
}

/** Screen 1 — the user enters their GREEN-API instance credentials. */
export function LoginForm({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const credentials: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
    }

    if (!credentials.idInstance || !credentials.apiTokenInstance) {
      setError('Заполните idInstance и apiTokenInstance')
      return
    }

    setChecking(true)
    try {
      const state = await getStateInstance(credentials)
      if (state.stateInstance !== 'authorized') {
        setError(
          `Инстанс не авторизован (состояние: ${state.stateInstance}). ` +
            'Проверьте авторизацию инстанса в консоли GREEN-API.',
        )
        return
      }
      onLogin(credentials)
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : String(err)) +
          '\nПроверьте idInstance, apiTokenInstance и apiUrl.',
      )
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">MAX</div>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__subtitle">
          Введите данные вашего инстанса из{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            консоли GREEN-API
          </a>
        </p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000001"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field__label">apiUrl</span>
          <input
            className="field__input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder={DEFAULT_API_URL}
            autoComplete="off"
          />
        </label>

        {error && <div className="login__error">{error}</div>}

        <button className="btn btn--primary login__submit" type="submit" disabled={checking}>
          {checking ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}

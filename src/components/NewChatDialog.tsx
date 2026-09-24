import { useState } from 'react'

interface Props {
  onCreate: (phone: string) => void
  onClose: () => void
}

/** Modal for starting a new chat by entering a recipient phone number. */
export function NewChatDialog({ onCreate, onClose }: Props) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Введите номер телефона в международном формате, например 79991234567')
      return
    }
    onCreate(digits)
  }

  return (
    <div className="modal" onClick={onClose}>
      <form
        className="modal__card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="modal__title">Новый чат</h2>
        <p className="modal__hint">Номер телефона получателя в международном формате</p>
        <label className="field">
          <span className="field__label">Телефон</span>
          <input
            className="field__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79991234567"
            autoFocus
            inputMode="tel"
          />
        </label>
        {error && <div className="login__error">{error}</div>}
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn--primary">
            Создать
          </button>
        </div>
      </form>
    </div>
  )
}

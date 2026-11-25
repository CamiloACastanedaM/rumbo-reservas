import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'
  const [values, setValues] = useState({ email: location.state?.email ?? '', password: '' })
  const [touched, setTouched] = useState({})
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (user && !sending) return <Navigate to={from} replace />

  const errors = {}
  if (!values.email.trim()) errors.email = 'Escribe tu correo electrónico.'
  if (!values.password) errors.password = 'Escribe tu contraseña.'
  const shown = (name) => (touched[name] ? errors[name] : undefined)

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    setError(null)
  }
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (Object.keys(errors).length) return
    setSending(true)
    try {
      const session = await api('/auth/login', { method: 'POST', json: values })
      login(session)
      toast.success(`Hola de nuevo, ${session.user.firstName}.`)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <AuthCard title="Iniciar sesión" intro={location.state?.message ?? 'Entra con el correo y la contraseña de tu cuenta.'}>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <Field values={values} onChange={onChange} onBlur={onBlur} shown={shown}
          name="email" label="Correo electrónico" type="email" autoComplete="email" />
        <Field values={values} onChange={onChange} onBlur={onBlur} shown={shown}
          name="password" label="Contraseña" type="password" autoComplete="current-password" />
        <button type="submit" className="btn btn-solid btn-block" disabled={sending}>
          {sending ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="auth-switch">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
    </AuthCard>
  )
}

export function AuthCard({ title, intro, children }) {
  return (
    <div className="container auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">{title}</h1>
        {intro && <p className="intro">{intro}</p>}
        {children}
      </section>
    </div>
  )
}

/** Labelled input with its inline error; password fields get a show/hide toggle. */
export function Field({ values, onChange, onBlur, shown, name, label, type = 'text', hint, ...rest }) {
  const [visible, setVisible] = useState(false)
  const error = shown(name)
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  const input = (
    <input id={name} name={name} type={type === 'password' && visible ? 'text' : type} value={values[name]}
      onChange={onChange} onBlur={onBlur} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
  )
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {type === 'password' ? (
        <div className="password-wrap">
          {input}
          <button type="button" className="password-toggle" onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}>
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      ) : input}
      {hint && !error && <p id={`${name}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${name}-error`} className="error">{error}</p>}
    </div>
  )
}

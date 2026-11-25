import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../api.js'
import { AuthCard, Field } from './Login.jsx'

const NAME = /^\p{L}+(?:[ '-]\p{L}+)*$/u
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Same rules as the API, so the visitor sees each problem while typing instead of after sending. */
export function validateRegister({ firstName, lastName, email, password }) {
  const errors = {}
  const name = (value, label) => {
    const v = value.trim()
    if (!v) return `Escribe tu ${label}.`
    if (v.length > 60) return `El ${label} admite hasta 60 caracteres.`
    if (!NAME.test(v)) return `El ${label} solo puede tener letras.`
  }
  errors.firstName = name(firstName, 'nombre')
  errors.lastName = name(lastName, 'apellido')
  if (!email.trim()) errors.email = 'Escribe tu correo electrónico.'
  else if (!EMAIL.test(email.trim())) errors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.'
  if (!password) errors.password = 'Crea una contraseña.'
  else if (password.length < 8 || password.length > 72) errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.'
  else if (!/\p{L}/u.test(password) || !/\d/.test(password)) errors.password = 'La contraseña debe tener al menos una letra y un número.'
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v))
}

const EMPTY = { firstName: '', lastName: '', email: '', password: '' }

export default function Register() {
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(null)

  const errors = { ...validateRegister(values), ...serverErrors }
  const shown = (name) => (touched[name] ? errors[name] : undefined)

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setServerErrors(({ [name]: _cleared, ...rest }) => rest)
  }
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched({ firstName: true, lastName: true, email: true, password: true })
    const found = validateRegister(values)
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    setSending(true)
    try {
      const user = await api('/auth/register', { method: 'POST', json: values })
      setDone(user)
    } catch (err) {
      if (err.status === 409) setServerErrors({ email: err.message })
      else if (Object.keys(err.fields).length) setServerErrors(err.fields)
      else toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  if (done) return <RegisterDone user={done} />

  const field = { values, onChange, onBlur, shown }
  return (
    <AuthCard title="Crear cuenta" intro="Guarda tus favoritos y reserva en pocos pasos.">
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field-row field-row-2">
          <Field {...field} name="firstName" label="Nombre" autoComplete="given-name" maxLength={60} />
          <Field {...field} name="lastName" label="Apellido" autoComplete="family-name" maxLength={60} />
        </div>
        <Field {...field} name="email" label="Correo electrónico" type="email" autoComplete="email" maxLength={120} />
        <Field {...field} name="password" label="Contraseña" type="password" autoComplete="new-password" maxLength={72}
          hint="Mínimo 8 caracteres, con al menos una letra y un número." />
        <button type="submit" className="btn btn-solid btn-block" disabled={sending}>
          {sending ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="auth-switch">¿Ya tienes cuenta? <Link to="/iniciar-sesion">Iniciar sesión</Link></p>
    </AuthCard>
  )
}

function RegisterDone({ user }) {
  const [sending, setSending] = useState(false)
  const resend = async () => {
    setSending(true)
    try {
      await api('/auth/resend-confirmation', { method: 'POST', json: { email: user.email } })
      toast.success(`Te reenviamos el correo a ${user.email}.`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }
  return (
    <AuthCard title={`¡Listo, ${user.firstName}!`} intro="Tu cuenta quedó creada.">
      <div className="auth-done" role="status">
        <MailCheck size={32} aria-hidden="true" />
        <p>Te enviamos un correo de confirmación a <strong>{user.email}</strong> con el enlace para iniciar sesión.</p>
      </div>
      <Link to="/iniciar-sesion" state={{ email: user.email }} className="btn btn-solid btn-block">Iniciar sesión</Link>
      <p className="auth-switch">
        ¿No te llegó? Revisa la carpeta de spam o{' '}
        <button type="button" className="link-btn" onClick={resend} disabled={sending}>
          {sending ? 'reenviando…' : 'Reenviar correo'}
        </button>
      </p>
    </AuthCard>
  )
}

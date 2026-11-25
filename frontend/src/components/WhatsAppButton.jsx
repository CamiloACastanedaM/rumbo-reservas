import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

/** International number without the plus: 8 to 15 digits (E.164). */
const validNumber = (phone) => /^[1-9]\d{7,14}$/.test(phone ?? '')

/**
 * Floating button, bottom-right on every screen size: opens a WhatsApp chat with the host,
 * with a first message about this lodging already written. No sign-in needed.
 */
export default function WhatsAppButton({ phone, productName }) {
  const open = () => {
    if (!validNumber(phone)) {
      toast.error('Este alojamiento todavía no tiene un WhatsApp válido. Escríbenos desde la sección de contacto o elige otro alojamiento.')
      return
    }
    if (!navigator.onLine) {
      toast.error('No tienes conexión a internet. Conéctate y vuelve a intentarlo.')
      return
    }
    const text = `Hola, vi «${productName}» en Rumbo y quiero hacerte una pregunta.`
    const chat = window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    if (!chat) {
      toast.error('Tu navegador bloqueó la ventana de WhatsApp. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.')
      return
    }
    chat.opener = null
    toast.success('Abrimos WhatsApp con tu mensaje listo. Envíalo desde allí y el anfitrión te responderá por ese chat.')
  }

  return (
    <button type="button" className="whatsapp-fab" onClick={open} aria-label="Escribir al anfitrión por WhatsApp">
      <MessageCircle size={28} aria-hidden="true" />
      <span className="whatsapp-label">WhatsApp</span>
    </button>
  )
}

import { Resend } from 'resend'

const FROM_ADDRESS = 'Lunares <no-reply@lunares.mx>'
const VERIFICATION_EXPIRY_MINUTES = 10

let resendInstance: Resend | null = null

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!resendInstance) {
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getVerificationExpiry(): Date {
  return new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000)
}

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.error('[Email] RESEND_API_KEY not configured')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Tu código de verificación — Lunares',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px 0;">
          <p style="margin: 0 0 16px; color: #374151;">Tu código de verificación es:</p>
          <p style="margin: 0 0 24px; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; color: #111827;">${code}</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Expira en ${VERIFICATION_EXPIRY_MINUTES} minutos. Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    })

    if (error) {
      console.error('[Email] Failed to send verification code:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[Email] Failed to send verification code:', err)
    return false
  }
}

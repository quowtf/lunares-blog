export const AUTH_ERROR_MESSAGES = {
  pending: 'Tu cuenta aún no está verificada. Revisa tu correo.',
  blocked: 'Tu cuenta está bloqueada. Contacta al administrador.',
} as const

export const AUTH_NOTICES = {
  verifiedPleaseLogin: 'Cuenta verificada. Inicia sesión para continuar.',
} as const

export function isAuthErrorMessage(message: string): boolean {
  return message === AUTH_ERROR_MESSAGES.pending || message === AUTH_ERROR_MESSAGES.blocked
}

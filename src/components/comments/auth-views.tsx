'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { AUTH_ERROR_MESSAGES, AUTH_NOTICES } from '@/utilities/authMessages'

import { loginUser, resendVerificationCode, signupUser, verifyEmail as verifyEmailApi } from './api'
import { COMMENT_ERROR_MESSAGE } from './constants'
import type { AuthUser, AuthView } from './types'

type AuthPanelProps = {
  view: AuthView
  onViewChange: (view: AuthView) => void
  /** Called after login/signup succeed with the authenticated user. */
  onUserChange: (user: AuthUser) => void
  /** Called when the auth flow finishes with an active session. */
  onComplete: (user: AuthUser | null) => void
  /** Current user, used to mark the session as active after verification. */
  user?: AuthUser | null
  /** Email to prefill in the verify form (e.g. a pending session loaded on mount). */
  verifyEmailSeed?: string
}

/**
 * Shared inline login / signup / email-verification forms.
 * Extracted from CommentPanel so other surfaces (e.g. /momentos) can reuse it.
 * The surrounding component owns the header, close button and error slot for
 * non-auth views; this component renders its own error above the forms.
 */
export function AuthPanel({
  view,
  onViewChange,
  onUserChange,
  onComplete,
  user,
  verifyEmailSeed,
}: AuthPanelProps) {
  const id = useId()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [verifyCode, setVerifyCode] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [resendDisabled, setResendDisabled] = useState(false)

  const currentVerifyEmail = verifyEmail || verifyEmailSeed || signupEmail

  function errorText(error: unknown): string {
    return error instanceof Error && error.message ? error.message : COMMENT_ERROR_MESSAGE
  }

  function resetMessages() {
    setErrorMessage(null)
    setNoticeMessage(null)
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const authenticatedUser = await loginUser(loginEmail, loginPassword)
      onUserChange(authenticatedUser)
      onComplete(authenticatedUser)
    } catch (error) {
      const message = errorText(error)

      if (message === AUTH_ERROR_MESSAGES.pending) {
        setVerifyEmail(loginEmail)
        setErrorMessage(message)
        onViewChange('verify')
      } else {
        setErrorMessage(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const createdUser = await signupUser({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      })

      setVerifyEmail(createdUser.email)
      onViewChange('verify')
    } catch (error) {
      setErrorMessage(errorText(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      await verifyEmailApi(currentVerifyEmail, verifyCode)

      const passwordForLogin =
        currentVerifyEmail === signupEmail
          ? signupPassword
          : currentVerifyEmail === loginEmail
            ? loginPassword
            : ''

      if (passwordForLogin) {
        try {
          const authenticatedUser = await loginUser(currentVerifyEmail, passwordForLogin)
          setLoginPassword('')
          setSignupPassword('')
          onUserChange(authenticatedUser)
          onComplete(authenticatedUser)
        } catch (loginError) {
          setNoticeMessage(AUTH_NOTICES.verifiedPleaseLogin)
          setErrorMessage(errorText(loginError))
          onViewChange('login')
        }
        return
      }

      if (user && user.email === currentVerifyEmail) {
        const activeUser: AuthUser = { ...user, status: 'active' }
        onUserChange(activeUser)
        onComplete(activeUser)
        return
      }

      setNoticeMessage(AUTH_NOTICES.verifiedPleaseLogin)
      onViewChange('login')
    } catch (error) {
      setErrorMessage(errorText(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    resetMessages()
    setResendDisabled(true)

    try {
      await resendVerificationCode(currentVerifyEmail)
    } catch (error) {
      setErrorMessage(errorText(error))
    }

    // Cooldown 30 seconds
    window.setTimeout(() => setResendDisabled(false), 30_000)
  }

  return (
    <>
      {errorMessage ? (
        <p className="mb-3 text-sm text-muted-foreground">{errorMessage}</p>
      ) : null}

      {noticeMessage ? (
        <p className="mb-3 text-sm text-muted-foreground">{noticeMessage}</p>
      ) : null}

      {view === 'login' ? (
        <form className="space-y-3" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor={`${id}-login-email`}>
              Correo
            </Label>
            <Input
              autoComplete="email"
              id={`${id}-login-email`}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
              type="email"
              value={loginEmail}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor={`${id}-login-password`}>
              Contraseña
            </Label>
            <Input
              autoComplete="current-password"
              id={`${id}-login-password`}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
              type="password"
              value={loginPassword}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <button
                className="text-foreground underline-offset-4 transition hover:text-muted-foreground hover:underline"
                onClick={() => {
                  resetMessages()
                  onViewChange('signup')
                }}
                type="button"
              >
                Regístrate
              </button>
            </p>

            <Button disabled={isSubmitting} size="sm" type="submit">
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </div>
        </form>
      ) : null}

      {view === 'signup' ? (
        <form className="space-y-3" onSubmit={handleSignup}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor={`${id}-signup-name`}>
              Nombre
            </Label>
            <Input
              autoComplete="name"
              id={`${id}-signup-name`}
              onChange={(event) => setSignupName(event.target.value)}
              required
              type="text"
              value={signupName}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor={`${id}-signup-email`}>
              Correo
            </Label>
            <Input
              autoComplete="email"
              id={`${id}-signup-email`}
              onChange={(event) => setSignupEmail(event.target.value)}
              required
              type="email"
              value={signupEmail}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor={`${id}-signup-password`}>
              Contraseña
            </Label>
            <Input
              autoComplete="new-password"
              id={`${id}-signup-password`}
              minLength={8}
              onChange={(event) => setSignupPassword(event.target.value)}
              required
              type="password"
              value={signupPassword}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <button
                className="text-foreground underline-offset-4 transition hover:text-muted-foreground hover:underline"
                onClick={() => {
                  resetMessages()
                  onViewChange('login')
                }}
                type="button"
              >
                Inicia sesión
              </button>
            </p>

            <Button disabled={isSubmitting} size="sm" type="submit">
              {isSubmitting ? 'Creando…' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      ) : null}

      {view === 'verify' ? (
        <form className="space-y-3" onSubmit={handleVerify}>
          <p className="text-sm text-muted-foreground">
            Enviamos un código de 6 dígitos a tu correo.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor={`${id}-verify-code`}>
              Código
            </Label>
            <Input
              autoComplete="one-time-code"
              id={`${id}-verify-code`}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setVerifyCode(event.target.value.replace(/\D/g, ''))}
              pattern="[0-9]{6}"
              placeholder="000000"
              required
              type="text"
              value={verifyCode}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              className="text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline disabled:opacity-50 disabled:no-underline"
              disabled={resendDisabled}
              onClick={handleResend}
              type="button"
            >
              {resendDisabled ? 'Código reenviado' : 'Reenviar código'}
            </button>

            <Button disabled={isSubmitting || verifyCode.length !== 6} size="sm" type="submit">
              {isSubmitting ? 'Verificando…' : 'Verificar'}
            </Button>
          </div>
        </form>
      ) : null}
    </>
  )
}

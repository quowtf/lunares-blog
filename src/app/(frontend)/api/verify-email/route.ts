import { NextResponse } from 'next/server'

import { getPayload } from 'payload'
import config from '@payload-config'

import {
  generateVerificationCode,
  getVerificationExpiry,
  sendVerificationCode,
} from '@/utilities/email'

const MAX_ATTEMPTS = 3

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, action } = body as {
      email?: string
      code?: string
      action?: 'verify' | 'resend'
    }

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Find user by email
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    })

    const user = docs[0]

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (user.status === 'active') {
      return NextResponse.json({ error: 'La cuenta ya está verificada' }, { status: 400 })
    }

    // Resend code
    if (action === 'resend') {
      const newCode = generateVerificationCode()
      const expiry = getVerificationExpiry()

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          verificationCode: newCode,
          verificationExpiry: expiry.toISOString(),
          verificationAttempts: 0,
        },
        context: { skipVerificationEmail: true },
      })

      await sendVerificationCode(email, newCode)

      return NextResponse.json({ message: 'Código reenviado' })
    }

    // Verify code
    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    // Check attempts
    if ((user.verificationAttempts ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Reenvía un nuevo código.' },
        { status: 429 },
      )
    }

    // Check expiry
    if (!user.verificationExpiry || new Date(user.verificationExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'El código ha expirado. Reenvía un nuevo código.' },
        { status: 410 },
      )
    }

    // Check code match
    if (user.verificationCode !== code) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          verificationAttempts: (user.verificationAttempts ?? 0) + 1,
        },
        context: { skipVerificationEmail: true },
      })

      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 })
    }

    // Code is correct — activate account
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        status: 'active',
        verificationCode: null,
        verificationExpiry: null,
        verificationAttempts: 0,
      },
      context: { skipVerificationEmail: true },
    })

    return NextResponse.json({ message: 'Cuenta verificada', verified: true })
  } catch (error) {
    console.error('[verify-email] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

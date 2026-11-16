import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import { getMexicoCityDay } from '@/utilities/stats/date'
import { isStatType } from '@/utilities/stats/config'
import { toNonNegativeNumber } from '@/utilities/stats/numbers'

export const normalizeActivity: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data !== 'object') return data

  if (!isStatType(data.type)) {
    throw new APIError('Tipo de actividad inválido.', 400)
  }

  const occurredAt = data.occurredAt ? new Date(String(data.occurredAt)) : new Date()

  if (Number.isNaN(occurredAt.getTime())) {
    throw new APIError('Fecha inválida.', 400)
  }

  data.occurredAt = occurredAt.toISOString()
  data.day = getMexicoCityDay(occurredAt)

  if (data.type === 'boulder') {
    const attempts = toNonNegativeNumber(data.attempts)
    const failed = toNonNegativeNumber(data.failed)

    if (attempts === null || failed === null) {
      throw new APIError('Boulder requiere attempts y failed.', 422)
    }

    if (!Number.isInteger(attempts) || !Number.isInteger(failed)) {
      throw new APIError('attempts y failed deben ser enteros.', 422)
    }

    if (failed > attempts) {
      throw new APIError('failed no puede ser mayor que attempts.', 422)
    }

    data.attempts = attempts
    data.failed = failed
    data.value = attempts
  } else {
    const value = toNonNegativeNumber(data.value)

    if (value === null) {
      throw new APIError('El campo value es obligatorio.', 422)
    }

    data.value = value
    data.attempts = null
    data.failed = null
  }

  return data
}

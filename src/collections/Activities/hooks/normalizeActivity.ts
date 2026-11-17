import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import { getMexicoCityDay } from '@/utilities/stats/date'
import { parseStatType } from '@/utilities/stats/config'
import { parseBoulderValue, toNonNegativeNumber } from '@/utilities/stats/numbers'

export const normalizeActivity: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data !== 'object') return data

  const type = parseStatType(data.type)

  if (!type) {
    throw new APIError('Tipo de actividad inválido.', 400)
  }

  data.type = type

  const occurredAt = data.occurredAt ? new Date(String(data.occurredAt)) : new Date()

  if (Number.isNaN(occurredAt.getTime())) {
    throw new APIError('Fecha inválida.', 400)
  }

  data.occurredAt = occurredAt.toISOString()
  data.day = getMexicoCityDay(occurredAt)

  if (data.type === 'boulder') {
    const parsed = parseBoulderValue(data.value)

    if (!parsed) {
      throw new APIError('Boulder requiere value como tops.fallidos, ej. 11.99.', 422)
    }

    const explicitFailed = toNonNegativeNumber(data.failed)

    if (explicitFailed !== null && !Number.isInteger(explicitFailed)) {
      throw new APIError('failed debe ser un entero.', 422)
    }

    data.value = parsed.tops
    data.failed = explicitFailed ?? parsed.failed
  } else {
    const value = toNonNegativeNumber(data.value)

    if (value === null) {
      throw new APIError('El campo value es obligatorio.', 422)
    }

    if (data.type === 'code' && !Number.isInteger(value)) {
      throw new APIError('Código requiere value entero.', 422)
    }

    data.value = value
    data.failed = null
  }

  return data
}

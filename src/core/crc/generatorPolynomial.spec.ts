import { describe, expect, it } from 'vitest'

import { createGeneratorPolynomial } from '@/core'

describe('generator polynomial', () => {
  it('creates a valid binary generator', () => {
    expect(createGeneratorPolynomial('10011')).toEqual({
      bits: '10011',
      degree: 4,
    })
  })

  it.each([
    ['', 'no puede estar vacía'],
    ['1', 'al menos 2 bits'],
    ['0101', 'debe comenzar en 1'],
    ['1010', 'debe terminar en 1'],
    ['10x1', 'solo puede contener los caracteres 0 y 1'],
  ])('rejects generator %j', (input, expectedMessage) => {
    expect(() => createGeneratorPolynomial(input)).toThrowError(expectedMessage)
  })
})

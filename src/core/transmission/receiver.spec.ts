import { describe, expect, it } from 'vitest'

import {
  calculateCrc,
  createGeneratorPolynomial,
  decodeFrameText,
  encodeText,
  flipBit,
  parseBinaryInput,
  verifyFrame,
} from '@/core'

describe('frame verification', () => {
  it('produces a zero remainder for an unaltered generated frame', () => {
    const generator = createGeneratorPolynomial('1011')
    const sent = calculateCrc(parseBinaryInput('11010011101100'), generator)

    const verification = verifyFrame(sent.frame, generator)

    expect(verification.remainder).toBe('000')
    expect(verification.errorDetected).toBe(false)
  })

  it('detects a known single-bit alteration', () => {
    const generator = createGeneratorPolynomial('1011')
    const sent = calculateCrc(parseBinaryInput('11010011101100'), generator)
    const altered = flipBit(sent.frame, 0)

    const verification = verifyFrame(altered.frame, generator)

    expect(verification.remainder).not.toBe('000')
    expect(verification.errorDetected).toBe(true)
  })
})

describe('frame decoding', () => {
  const generator = createGeneratorPolynomial('10011')

  it('reconstructs the original text from a valid frame', () => {
    const sent = calculateCrc(encodeText('HOLA').bits, generator)

    const received = decodeFrameText(sent.frame, generator)

    expect(received.data).toBe('01001000010011110100110001000001')
    expect(received.message.text).toBe('HOLA')
  })

  it('can reconstruct a different message after a data-bit alteration', () => {
    const sent = calculateCrc(encodeText('HOLA').bits, generator)
    const altered = flipBit(sent.frame, 7)

    expect(verifyFrame(altered.frame, generator).errorDetected).toBe(true)
    expect(decodeFrameText(altered.frame, generator).message.text).toBe('IOLA')
  })

  it('reports invalid UTF-8 bytes instead of hiding the decoding failure', () => {
    const sent = calculateCrc(parseBinaryInput('11111111'), generator)

    expect(() => decodeFrameText(sent.frame, generator)).toThrowError(
      'Los bits de datos no representan una secuencia UTF-8 válida.',
    )
  })
})

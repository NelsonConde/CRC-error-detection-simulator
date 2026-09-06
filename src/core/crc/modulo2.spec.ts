import { describe, expect, it } from 'vitest'

import { createGeneratorPolynomial, divideModulo2, parseBinaryInput, xorBits } from '@/core'

describe('modulo-2 operations', () => {
  it('applies XOR bit by bit without numeric conversion', () => {
    expect(xorBits(parseBinaryInput('1101'), parseBinaryInput('1011'))).toBe('0110')
  })

  it('rejects XOR operands with different lengths', () => {
    expect(() => xorBits(parseBinaryInput('1'), parseBinaryInput('10'))).toThrowError(
      'Las secuencias deben tener la misma longitud para aplicar XOR.',
    )
  })

  it('divides a known CRC dividend with a verifiable remainder', () => {
    const dividend = parseBinaryInput('11010011101100000')
    const generator = createGeneratorPolynomial('1011')

    const division = divideModulo2(dividend, generator.bits)

    expect(division.remainder).toBe('100')
    expect(division.dividend).toBe(dividend)
    expect(division.divisor).toBe('1011')
  })

  it('produces ordered, self-contained division snapshots', () => {
    const division = divideModulo2(
      parseBinaryInput('11010011101100000'),
      createGeneratorPolynomial('1011').bits,
    )

    expect(division.steps).toHaveLength(14)
    expect(division.steps[0]).toEqual({
      index: 0,
      position: 0,
      activeWindow: '1101',
      divisorApplied: true,
      xorResult: '0110',
      nextBit: '0',
      intermediateDividend: '01100011101100000',
    })
    expect(division.steps.at(-1)?.intermediateDividend.endsWith('100')).toBe(true)
    expect(division.steps.map(({ position }) => position)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ])
  })

  it('records leading-zero steps without applying the generator', () => {
    const division = divideModulo2(
      parseBinaryInput('001011'),
      createGeneratorPolynomial('1011').bits,
    )

    expect(division.remainder).toBe('000')
    expect(division.steps).toHaveLength(3)
    expect(division.steps[0]).toMatchObject({
      activeWindow: '0010',
      divisorApplied: false,
      xorResult: '0010',
      intermediateDividend: '001011',
    })
    expect(division.steps[1]).toMatchObject({
      activeWindow: '0101',
      divisorApplied: false,
      xorResult: '0101',
    })
  })
})

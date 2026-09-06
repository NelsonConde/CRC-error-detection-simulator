import { describe, expect, it } from 'vitest'

import { calculateCrc, createGeneratorPolynomial, parseBinaryInput } from '@/core'

describe('CRC calculation', () => {
  it('calculates the classic CRC reference case', () => {
    const result = calculateCrc(
      parseBinaryInput('11010011101100'),
      createGeneratorPolynomial('1011'),
    )

    expect(result).toMatchObject({
      originalData: '11010011101100',
      generator: '1011',
      polynomialDegree: 3,
      augmentedData: '11010011101100000',
      crc: '100',
      frame: '11010011101100100',
    })
  })

  it('always creates a CRC whose length equals the generator degree', () => {
    const generator = createGeneratorPolynomial('10011')
    const result = calculateCrc(parseBinaryInput('1'), generator)

    expect(result.crc).toHaveLength(generator.degree)
    expect(result.frame).toHaveLength(result.originalData.length + generator.degree)
  })
})

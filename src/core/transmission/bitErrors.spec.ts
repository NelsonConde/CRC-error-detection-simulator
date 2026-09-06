import { describe, expect, it } from 'vitest'

import { flipBit, flipRandomBit, parseReceivedFrame } from '@/core'

describe('bit alteration', () => {
  it('flips 0 to 1 without changing the original frame', () => {
    const originalFrame = parseReceivedFrame('010')
    const result = flipBit(originalFrame, 0)

    expect(result).toEqual({
      originalFrame: '010',
      position: 0,
      previousBit: '0',
      newBit: '1',
      frame: '110',
    })
    expect(originalFrame).toBe('010')
  })

  it('flips 1 to 0', () => {
    expect(flipBit(parseReceivedFrame('110'), 0)).toMatchObject({
      previousBit: '1',
      newBit: '0',
      frame: '010',
    })
  })

  it.each([-1, 3, 1.5])('rejects invalid position %s', (position) => {
    expect(() => flipBit(parseReceivedFrame('010'), position)).toThrowError(
      'fuera del rango válido',
    )
  })

  it('uses an injected random source deterministically', () => {
    const result = flipRandomBit(parseReceivedFrame('0000'), () => 0.74)

    expect(result.position).toBe(2)
    expect(result.frame).toBe('0010')
  })

  it.each([-0.1, 1, Number.NaN])('rejects invalid random value %s', (randomValue) => {
    expect(() => flipRandomBit(parseReceivedFrame('0'), () => randomValue)).toThrowError(
      'mayor o igual que 0 y menor que 1',
    )
  })
})

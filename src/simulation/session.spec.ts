import { describe, expect, it } from 'vitest'

import { SimulationSession, createCrcSimulation } from '@/simulation'

function createSession(): SimulationSession {
  const simulation = createCrcSimulation({
    input: { kind: 'text', value: 'HOLA' },
    generator: '10011',
    channel: { mode: 'none' },
  })

  return new SimulationSession(simulation.steps)
}

describe('SimulationSession', () => {
  it('starts at the first step', () => {
    const session = createSession()

    expect(session.current.stage).toBe('initial')
    expect(session.currentIndex).toBe(0)
    expect(session.canGoPrevious).toBe(false)
    expect(session.canGoNext).toBe(true)
    expect(session.progress).toBe(0)
  })

  it('moves next and previous', () => {
    const session = createSession()
    const secondStep = session.steps[1]

    expect(session.next()).toBe(secondStep)
    expect(session.currentIndex).toBe(1)
    expect(session.canGoPrevious).toBe(true)
    expect(session.previous()).toBe(session.steps[0])
  })

  it('stays within sequence boundaries', () => {
    const session = createSession()

    expect(session.previous()).toBe(session.steps[0])
    session.goTo(session.steps.length - 1)

    expect(session.next()).toBe(session.steps.at(-1))
    expect(session.canGoNext).toBe(false)
    expect(session.progress).toBe(1)
  })

  it('jumps to a valid index and reports proportional progress', () => {
    const session = createSession()
    const targetIndex = Math.floor((session.steps.length - 1) / 2)

    expect(session.goTo(targetIndex)).toBe(session.steps[targetIndex])
    expect(session.progress).toBe(targetIndex / (session.steps.length - 1))
  })

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER])('rejects invalid index %s', (index) => {
    expect(() => createSession().goTo(index)).toThrowError(RangeError)
  })

  it('resets the cursor to the beginning', () => {
    const session = createSession()
    session.goTo(10)

    expect(session.reset()).toBe(session.steps[0])
    expect(session.currentIndex).toBe(0)
    expect(session.progress).toBe(0)
  })

  it('rejects an empty sequence', () => {
    expect(() => new SimulationSession([])).toThrowError(
      'La sesión de simulación necesita al menos un step.',
    )
  })
})

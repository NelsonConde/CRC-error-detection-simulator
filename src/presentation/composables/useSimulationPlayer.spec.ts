import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCrcSimulation } from '@/simulation'

import { useSimulationPlayer, type PlaybackSpeed } from './useSimulationPlayer'

function createPlayer(speed: PlaybackSpeed = 'manual') {
  const scope = effectScope()
  const player = scope.run(() => useSimulationPlayer(speed))

  if (player === undefined) {
    throw new Error('No se pudo crear el reproductor dentro del scope de prueba.')
  }

  const simulation = createCrcSimulation({
    input: { kind: 'binary', value: '01001000' },
    generator: '10011',
    channel: { mode: 'none' },
  })
  player.loadSteps(simulation.steps)

  return { player, scope }
}

describe('useSimulationPlayer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('navigates forward and backward while paused', () => {
    const { player, scope } = createPlayer()

    player.next()
    expect(player.currentIndex.value).toBe(1)
    expect(player.isPlaying.value).toBe(false)

    player.previous()
    expect(player.currentIndex.value).toBe(0)
    scope.stop()
  })

  it('plays with at most one active timer and pauses cleanly', () => {
    const { player, scope } = createPlayer('1x')

    player.play()
    player.play()
    expect(player.isPlaying.value).toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(900)
    expect(player.currentIndex.value).toBe(1)

    player.pause()
    expect(player.isPlaying.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('restarts the timer safely when speed changes during playback', () => {
    const { player, scope } = createPlayer('1x')
    player.play()

    player.setSpeed('2x')
    expect(player.speed.value).toBe('2x')
    expect(player.isPlaying.value).toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(450)
    expect(player.currentIndex.value).toBe(1)
    scope.stop()
  })

  it('stops automatically at the final step', () => {
    const { player, scope } = createPlayer('1x')
    player.goTo(player.totalSteps.value - 2)

    player.play()
    vi.advanceTimersByTime(900)

    expect(player.currentIndex.value).toBe(player.totalSteps.value - 1)
    expect(player.canGoNext.value).toBe(false)
    expect(player.isPlaying.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('reset returns to the first step and clears playback', () => {
    const { player, scope } = createPlayer('2x')
    player.goTo(4)
    player.play()

    player.reset()

    expect(player.currentIndex.value).toBe(0)
    expect(player.progress.value).toBe(0)
    expect(player.isPlaying.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('manual speed never starts automatic playback', () => {
    const { player, scope } = createPlayer('manual')

    player.play()

    expect(player.isPlaying.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('cleans its timer when the owning scope is disposed', () => {
    const { player, scope } = createPlayer('1x')
    player.play()
    expect(vi.getTimerCount()).toBe(1)

    scope.stop()

    expect(vi.getTimerCount()).toBe(0)
    expect(player.isPlaying.value).toBe(false)
  })
})

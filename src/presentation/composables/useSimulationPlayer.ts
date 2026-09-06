import { computed, onScopeDispose, ref, shallowRef } from 'vue'

import { SimulationSession, type SimulationStep } from '@/simulation'

export type PlaybackSpeed = 'manual' | '1x' | '2x'

const PLAYBACK_INTERVALS: Readonly<Record<Exclude<PlaybackSpeed, 'manual'>, number>> = {
  '1x': 900,
  '2x': 450,
}

export function useSimulationPlayer(initialSpeed: PlaybackSpeed = 'manual') {
  const session = shallowRef<SimulationSession | null>(null)
  const currentIndex = ref(0)
  const speed = ref<PlaybackSpeed>(initialSpeed)
  const isPlaying = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const current = computed<SimulationStep | null>(() => {
    const activeSession = session.value
    return activeSession?.steps[currentIndex.value] ?? null
  })
  const totalSteps = computed(() => session.value?.steps.length ?? 0)
  const canGoNext = computed(
    () => session.value !== null && currentIndex.value < totalSteps.value - 1,
  )
  const canGoPrevious = computed(() => session.value !== null && currentIndex.value > 0)
  const progress = computed(() => {
    if (totalSteps.value <= 1) return session.value === null ? 0 : 1
    return currentIndex.value / (totalSteps.value - 1)
  })
  const isReady = computed(() => session.value !== null)

  function loadSteps(steps: readonly SimulationStep[], startIndex = 0): void {
    pause()
    const nextSession = new SimulationSession(steps)
    nextSession.goTo(startIndex)
    session.value = nextSession
    syncIndex()
  }

  function play(): void {
    if (speed.value === 'manual' || !canGoNext.value || session.value === null) {
      return
    }

    clearTimer()
    isPlaying.value = true
    timer = setInterval(advanceAutomatically, PLAYBACK_INTERVALS[speed.value])
  }

  function pause(): void {
    clearTimer()
    isPlaying.value = false
  }

  function togglePlay(): void {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function next(): void {
    pause()
    session.value?.next()
    syncIndex()
  }

  function previous(): void {
    pause()
    session.value?.previous()
    syncIndex()
  }

  function goTo(index: number): void {
    pause()
    session.value?.goTo(index)
    syncIndex()
  }

  function reset(): void {
    pause()
    session.value?.reset()
    syncIndex()
  }

  function setSpeed(nextSpeed: PlaybackSpeed): void {
    const shouldResume = isPlaying.value
    speed.value = nextSpeed

    if (nextSpeed === 'manual') {
      pause()
      return
    }

    if (shouldResume) {
      play()
    }
  }

  function advanceAutomatically(): void {
    const activeSession = session.value
    if (activeSession === null) {
      pause()
      return
    }

    activeSession.next()
    syncIndex()

    if (!activeSession.canGoNext) {
      pause()
    }
  }

  function syncIndex(): void {
    currentIndex.value = session.value?.currentIndex ?? 0
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  onScopeDispose(pause)

  return {
    current,
    currentIndex,
    totalSteps,
    speed,
    isPlaying,
    isReady,
    canGoNext,
    canGoPrevious,
    progress,
    loadSteps,
    play,
    pause,
    togglePlay,
    next,
    previous,
    goTo,
    reset,
    setSpeed,
  }
}

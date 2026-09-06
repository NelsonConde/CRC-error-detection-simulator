import type { SimulationStep } from './models'

export class SimulationSession {
  readonly steps: readonly SimulationStep[]
  #currentIndex = 0

  constructor(steps: readonly SimulationStep[]) {
    if (steps.length === 0) {
      throw new Error('La sesión de simulación necesita al menos un step.')
    }

    this.steps = steps
  }

  get current(): SimulationStep {
    return this.steps[this.#currentIndex] as SimulationStep
  }

  get currentIndex(): number {
    return this.#currentIndex
  }

  get canGoNext(): boolean {
    return this.#currentIndex < this.steps.length - 1
  }

  get canGoPrevious(): boolean {
    return this.#currentIndex > 0
  }

  get progress(): number {
    if (this.steps.length === 1) {
      return 1
    }

    return this.#currentIndex / (this.steps.length - 1)
  }

  next(): SimulationStep {
    if (this.canGoNext) {
      this.#currentIndex += 1
    }

    return this.current
  }

  previous(): SimulationStep {
    if (this.canGoPrevious) {
      this.#currentIndex -= 1
    }

    return this.current
  }

  goTo(index: number): SimulationStep {
    if (!Number.isInteger(index) || index < 0 || index >= this.steps.length) {
      throw new RangeError(`El índice ${index} está fuera de la secuencia de simulación.`)
    }

    this.#currentIndex = index
    return this.current
  }

  reset(): SimulationStep {
    this.#currentIndex = 0
    return this.current
  }
}

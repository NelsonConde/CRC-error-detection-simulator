import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'

async function advanceToEnd(wrapper: VueWrapper): Promise<void> {
  const maximumSteps = 200

  for (let attempt = 0; attempt < maximumSteps; attempt += 1) {
    const nextButton = wrapper.get('button[aria-label="Siguiente paso"]')
    if (nextButton.attributes('disabled') !== undefined) return
    await nextButton.trigger('click')
  }

  throw new Error('La simulación no alcanzó su último paso.')
}

async function advanceToManualChannel(wrapper: VueWrapper): Promise<void> {
  const maximumSteps = 200

  for (let attempt = 0; attempt < maximumSteps; attempt += 1) {
    const editableBit = wrapper
      .findAll('button[aria-label^="Cambiar bit"]')
      .find((button) => button.attributes('disabled') === undefined)

    if (editableBit !== undefined) return
    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')
  }

  throw new Error('La simulación no alcanzó el canal manual.')
}

async function advanceToSenderDivision(wrapper: VueWrapper): Promise<void> {
  const maximumSteps = 200

  for (let attempt = 0; attempt < maximumSteps; attempt += 1) {
    if (wrapper.find('[data-testid="crc-division-visualizer"]').exists()) return
    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')
  }

  throw new Error('La simulación no alcanzó la división del emisor.')
}

describe('CRC simulator UI', () => {
  it('starts the default simulation', async () => {
    const wrapper = mount(App)

    await wrapper.get('button[type="submit"]').trigger('submit')

    expect(wrapper.text()).toContain('Entrada preparada')
    expect(wrapper.text()).toContain('Paso 1 de')
    expect(wrapper.text()).toContain('HOLA')
  })

  it('switches between Learn and Laboratory without changing engines', async () => {
    const wrapper = mount(App)
    await wrapper.get('button[type="submit"]').trigger('submit')

    expect(wrapper.text()).toContain('La simulación conserva la entrada antes de transformarla.')
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('HOLA')
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('10011')
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('Sin error')
    const stepBeforeModeChange = wrapper.get('[data-testid="playback-step"]').text()

    const laboratoryButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Laboratorio'))
    if (laboratoryButton === undefined) throw new Error('No se encontró el selector Laboratorio.')

    await laboratoryButton.trigger('click')

    expect(laboratoryButton.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('details').attributes('open')).toBeDefined()
    expect(wrapper.get('[aria-label="Contexto técnico del laboratorio"]').text()).toContain(
      'Generador',
    )
    expect(wrapper.get('[data-testid="playback-step"]').text()).toBe(stepBeforeModeChange)
    expect(wrapper.text()).not.toContain(
      'La simulación conserva la entrada antes de transformarla.',
    )
  })

  it('expands the Learn configuration without losing its values', async () => {
    const wrapper = mount(App)
    await wrapper.get('textarea[aria-label="Mensaje"]').setValue('HOLA CRC')
    await wrapper.get('button[type="submit"]').trigger('submit')

    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('HOLA CRC')

    await wrapper.get('summary').trigger('click')

    expect(wrapper.get('details').attributes('open')).toBeDefined()
    expect(
      (wrapper.get('textarea[aria-label="Mensaje"]').element as HTMLTextAreaElement).value,
    ).toBe('HOLA CRC')
    expect(
      (wrapper.get('input[aria-label="Polinomio generador"]').element as HTMLInputElement).value,
    ).toBe('10011')
  })

  it('shows domain validation errors without breaking the application', async () => {
    const wrapper = mount(App)
    await wrapper.get('input[aria-label="Polinomio generador"]').setValue('1010')

    await wrapper.get('button[type="submit"]').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain('debe terminar en 1')
    expect(wrapper.text()).toContain('Iniciar simulación')
  })

  it('shows the final no-error result', async () => {
    const wrapper = mount(App)
    await wrapper.get('button[type="submit"]').trigger('submit')

    await advanceToEnd(wrapper)

    const currentStepPanel = wrapper.get('[data-testid="current-step-panel"]')
    expect(currentStepPanel.text()).toContain('No se detectaron errores')
    expect(currentStepPanel.text()).toContain('Mensaje original')
    expect(currentStepPanel.text()).toContain('Mensaje recibido')
    expect(currentStepPanel.text()).toContain('Frame enviado')
    expect(currentStepPanel.text()).toContain('Frame recibido')
    expect(currentStepPanel.text()).toContain('Residuo')
  })

  it('allows a manual bit alteration and reflects the received message', async () => {
    const wrapper = mount(App)
    await wrapper.get('select[aria-label="Modo del canal"]').setValue('manual')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await advanceToManualChannel(wrapper)

    const eighthBit = wrapper.get('button[aria-label="Cambiar bit 8, valor actual 0"]')
    await eighthBit.trigger('click')

    expect(
      wrapper.get('button[aria-label="Cambiar bit 8, valor actual 1"]').attributes('data-altered'),
    ).toBe('true')
    expect(wrapper.text()).toContain('Bits alterados: 8')

    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')
    await advanceToEnd(wrapper)

    expect(wrapper.text()).toContain('IOLA')
    expect(wrapper.text()).toContain('Error detectado')
  })

  it('pauses automatic playback when the manual channel becomes editable', async () => {
    vi.useFakeTimers()
    const wrapper = mount(App)

    try {
      await wrapper.get('select[aria-label="Modo del canal"]').setValue('manual')
      await wrapper.get('select[aria-label="Velocidad de reproducción"]').setValue('2x')
      await wrapper.get('button[type="submit"]').trigger('submit')
      await wrapper.get('button[aria-label="Reproducir"]').trigger('click')

      for (let attempt = 0; attempt < 200; attempt += 1) {
        const editableBit = wrapper
          .findAll('button[aria-label^="Cambiar bit"]')
          .find((button) => button.attributes('disabled') === undefined)
        if (editableBit !== undefined) break
        await vi.advanceTimersByTimeAsync(450)
      }

      expect(
        wrapper
          .findAll('button[aria-label^="Cambiar bit"]')
          .some((button) => button.attributes('disabled') === undefined),
      ).toBe(true)
      expect(wrapper.get('button[aria-label="Reproducir"]').text()).toContain('Play')
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      wrapper.unmount()
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })

  it('keeps the CRC visualizer mounted between consecutive division steps', async () => {
    const wrapper = mount(App)
    await wrapper.get('button[type="submit"]').trigger('submit')
    await advanceToSenderDivision(wrapper)

    const visualizer = wrapper.get('[data-testid="crc-division-visualizer"]').element
    const globalTrack = wrapper.get(
      '[aria-label="Cadena binaria desplazable con ventana activa"]',
    ).element
    const activePosition = wrapper.get('[data-active-window="start"]').attributes('data-bit-index')
    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')

    expect(wrapper.get('[data-testid="crc-division-visualizer"]').element).toBe(visualizer)
    expect(
      wrapper.get('[aria-label="Cadena binaria desplazable con ventana activa"]').element,
    ).toBe(globalTrack)
    expect(wrapper.get('[data-active-window="start"]').attributes('data-bit-index')).not.toBe(
      activePosition,
    )
  })
})

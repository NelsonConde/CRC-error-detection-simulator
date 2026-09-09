import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'

async function advanceToEnd(wrapper: VueWrapper): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const nextButton = wrapper.get('button[aria-label="Siguiente paso"]')
    if (nextButton.attributes('disabled') !== undefined) return
    await nextButton.trigger('click')
  }

  throw new Error('La simulación no alcanzó su último paso.')
}

async function advanceToManualChannel(wrapper: VueWrapper): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const editableBit = wrapper
      .findAll('button[aria-label^="Cambiar bit"]')
      .find((button) => button.attributes('disabled') === undefined)

    if (editableBit !== undefined) return
    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')
  }

  throw new Error('La simulación no alcanzó el canal manual.')
}

async function advanceToSenderDivision(wrapper: VueWrapper): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (wrapper.find('[data-testid="crc-division-visualizer"]').exists()) return
    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')
  }

  throw new Error('La simulación no alcanzó la división del emisor.')
}

async function switchToLaboratory(wrapper: VueWrapper): Promise<void> {
  const laboratoryButton = wrapper
    .findAll('button')
    .find((button) => button.text().includes('Laboratorio'))
  if (laboratoryButton === undefined) throw new Error('No se encontró el selector Laboratorio.')

  await laboratoryButton.trigger('click')
}

async function calculateLaboratory(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('button[type="submit"]').trigger('submit')
}

describe('CRC simulator UI', () => {
  it('starts the default simulation', async () => {
    const wrapper = mount(App)
    await wrapper.get('button[type="submit"]').trigger('submit')

    expect(wrapper.text()).toContain('Entrada preparada')
    expect(wrapper.text()).toContain('Paso 1 de')
    expect(wrapper.text()).toContain('HOLA')
  })

  it('starts a long text simulation and keeps the current step available', async () => {
    const wrapper = mount(App)
    const longMessage =
      'CRC permite detectar alteraciones durante una transmisión de datos extensa.'

    await wrapper.get('textarea[aria-label="Mensaje"]').setValue(longMessage)
    await wrapper.get('button[type="submit"]').trigger('submit')

    expect(wrapper.get('[data-testid="current-step-panel"]').text()).toContain(longMessage)
    expect(wrapper.get('[data-testid="playback-step"]').text()).toMatch(/^Paso 1 de \d+$/)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('preserves the Learn session and configuration when switching modes', async () => {
    const wrapper = mount(App)
    await wrapper.get('textarea[aria-label="Mensaje"]').setValue('HOLA CRC')
    await wrapper.get('input[aria-label="Polinomio generador"]').setValue('1011')
    await wrapper.get('select[aria-label="Modo del canal"]').setValue('manual')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await wrapper.get('button[aria-label="Siguiente paso"]').trigger('click')

    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('HOLA CRC')
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('1011')
    expect(wrapper.get('[aria-label="Resumen de configuración"]').text()).toContain('Error manual')
    const stepBeforeModeChange = wrapper.get('[data-testid="playback-step"]').text()

    await switchToLaboratory(wrapper)

    expect(wrapper.get('button[aria-pressed="true"]').text()).toContain('Laboratorio')
    expect(
      (wrapper.get('textarea[aria-label="Mensaje de laboratorio"]').element as HTMLTextAreaElement)
        .value,
    ).toBe('HOLA CRC')
    expect(
      (
        wrapper.get('input[aria-label="Polinomio generador del laboratorio"]')
          .element as HTMLInputElement
      ).value,
    ).toBe('1011')
    expect(
      (
        wrapper.get('select[aria-label="Modo del canal del laboratorio"]')
          .element as HTMLSelectElement
      ).value,
    ).toBe('manual')

    const learnButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Aprender'))
    if (learnButton === undefined) throw new Error('No se encontró el selector Aprender.')
    await learnButton.trigger('click')

    expect(wrapper.get('[data-testid="playback-step"]').text()).toBe(stepBeforeModeChange)
    expect(wrapper.text()).toContain('Codificación de H')
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

    await wrapper.get('button[aria-label="Cambiar bit 8, valor actual 0"]').trigger('click')

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

describe('CRC laboratory UI', () => {
  it('is a direct calculator without timeline or playback controls', async () => {
    const wrapper = mount(App)
    await switchToLaboratory(wrapper)

    expect(wrapper.find('[aria-label="Controles de reproducción"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Progreso de la simulación"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="current-step-panel"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Calcular CRC')
    expect(wrapper.text()).not.toContain('Paso 0 de')
  })

  it('calculates and exposes sender, channel, and receiver results immediately', async () => {
    const wrapper = mount(App)
    await switchToLaboratory(wrapper)
    await calculateLaboratory(wrapper)

    expect(wrapper.get('[aria-label="Resultados del laboratorio"]').text()).toContain(
      'EMISOR — CÁLCULO CRC',
    )
    expect(wrapper.get('[data-testid="lab-sender-crc"]').text()).toBe('1111')
    expect(wrapper.get('[data-testid="lab-sender-frame"]').attributes('data-bits')).toBe(
      '010010000100111101001100010000011111',
    )
    expect(wrapper.get('[data-testid="lab-received-frame"]').attributes('data-bits')).toBe(
      '010010000100111101001100010000011111',
    )
    expect(wrapper.get('[data-testid="lab-receiver-remainder"]').text()).toBe('0000')
    expect(wrapper.text()).toContain('NO SE DETECTARON ERRORES')
    expect(wrapper.text()).toContain('no garantiza ausencia absoluta de corrupción')
  })

  it('shows a detectable random channel alteration without exposing steps', async () => {
    const wrapper = mount(App)
    await switchToLaboratory(wrapper)
    await wrapper.get('select[aria-label="Modo del canal del laboratorio"]').setValue('random')
    await calculateLaboratory(wrapper)

    expect(wrapper.text()).toContain('Error aleatorio')
    expect(wrapper.text()).toContain('ERROR DETECTADO')
    expect(
      wrapper.get('[data-testid="lab-received-frame"]').findAll('[data-altered="true"]'),
    ).toHaveLength(1)
    expect(wrapper.find('[data-testid="playback-step"]').exists()).toBe(false)
  })

  it('updates frame, remainder, message, and multiple alterations in manual mode', async () => {
    const wrapper = mount(App)
    await switchToLaboratory(wrapper)
    await wrapper.get('select[aria-label="Modo del canal del laboratorio"]').setValue('manual')
    await calculateLaboratory(wrapper)

    const originalFrame = wrapper.get('[data-testid="lab-received-frame"]').attributes('data-bits')
    expect(wrapper.text()).toContain('Bits alterados: Ninguno')

    await wrapper
      .get('button[aria-label="Alterar bit de laboratorio 8, valor actual 0"]')
      .trigger('click')

    const firstAlteredFrame = wrapper
      .get('[data-testid="lab-received-frame"]')
      .attributes('data-bits')
    expect(firstAlteredFrame).not.toBe(originalFrame)
    expect(wrapper.get('[data-testid="lab-receiver-remainder"]').text()).not.toBe('0000')
    expect(wrapper.text()).toContain('IOLA')
    expect(wrapper.text()).toContain('ERROR DETECTADO')
    expect(wrapper.text()).toContain('Bits alterados: 8')

    await wrapper
      .get('button[aria-label="Alterar bit de laboratorio 9, valor actual 0"]')
      .trigger('click')

    expect(wrapper.text()).toContain('Bits alterados: 8, 9')
    expect(
      wrapper
        .get('[aria-label="Editor manual de bits del laboratorio"]')
        .findAll('[data-altered="true"]'),
    ).toHaveLength(2)
    expect(wrapper.get('[data-testid="lab-received-frame"]').attributes('data-bits')).not.toBe(
      firstAlteredFrame,
    )
  })

  it('supports a 256-bit manual scenario without losing its technical results', async () => {
    const wrapper = mount(App)
    const longBinaryInput = '01001101'.repeat(32)

    await switchToLaboratory(wrapper)
    const binaryButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Binario')
    if (binaryButton === undefined) throw new Error('No se encontró el selector Binario.')
    await binaryButton.trigger('click')
    await wrapper.get('textarea[aria-label="Bits de laboratorio"]').setValue(longBinaryInput)
    await wrapper.get('select[aria-label="Modo del canal del laboratorio"]').setValue('manual')
    await calculateLaboratory(wrapper)

    expect(wrapper.get('[data-testid="lab-sender-frame"]').attributes('data-bits')).toHaveLength(
      260,
    )
    expect(wrapper.get('[data-testid="lab-sender-crc"]').text()).toHaveLength(4)
    expect(wrapper.get('[data-testid="lab-received-frame"]').attributes('data-bits')).toHaveLength(
      260,
    )
    expect(wrapper.get('[data-testid="lab-receiver-remainder"]').text()).toBe('0000')

    await wrapper
      .get('button[aria-label="Alterar bit de laboratorio 200, valor actual 1"]')
      .trigger('click')

    expect(wrapper.text()).toContain('Bits alterados: 200')
    expect(wrapper.get('[data-testid="lab-receiver-remainder"]').text()).not.toBe('0000')
  })

  it('lets a manual bit be restored while retaining a coherent history', async () => {
    const wrapper = mount(App)
    await switchToLaboratory(wrapper)
    await wrapper.get('select[aria-label="Modo del canal del laboratorio"]').setValue('manual')
    await calculateLaboratory(wrapper)

    const originalFrame = wrapper.get('[data-testid="lab-received-frame"]').attributes('data-bits')
    await wrapper
      .get('button[aria-label="Alterar bit de laboratorio 8, valor actual 0"]')
      .trigger('click')
    await wrapper
      .get('button[aria-label="Alterar bit de laboratorio 8, valor actual 1"]')
      .trigger('click')

    expect(wrapper.get('[data-testid="lab-received-frame"]').attributes('data-bits')).toBe(
      originalFrame,
    )
    expect(wrapper.text()).toContain('Bits alterados: Ninguno')
    expect(wrapper.get('[data-testid="lab-receiver-remainder"]').text()).toBe('0000')
    expect(wrapper.get('[aria-label="Editor manual de bits del laboratorio"]').text()).toContain(
      '#8: 0 → 1',
    )
    expect(wrapper.get('[aria-label="Editor manual de bits del laboratorio"]').text()).toContain(
      '#8: 1 → 0',
    )
  })

  it('validates calculations and clears only laboratory results', async () => {
    const wrapper = mount(App)
    await switchToLaboratory(wrapper)
    await wrapper.get('input[aria-label="Polinomio generador del laboratorio"]').setValue('1010')
    await calculateLaboratory(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain('debe terminar en 1')
    expect(wrapper.find('[aria-label="Resultados del laboratorio"]').exists()).toBe(false)

    await wrapper.get('input[aria-label="Polinomio generador del laboratorio"]').setValue('10011')
    await calculateLaboratory(wrapper)
    const clearButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Limpiar'))
    if (clearButton === undefined) throw new Error('No se encontró el botón Limpiar.')
    await clearButton.trigger('click')

    expect(wrapper.find('[aria-label="Resultados del laboratorio"]').exists()).toBe(false)
    expect(
      (wrapper.get('textarea[aria-label="Mensaje de laboratorio"]').element as HTMLTextAreaElement)
        .value,
    ).toBe('HOLA')
  })
})

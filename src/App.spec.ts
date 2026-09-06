import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import App from '@/App.vue'

describe('test infrastructure', () => {
  it('mounts a Vue component in jsdom', () => {
    const wrapper = mount(App)

    expect(wrapper.find('main').exists()).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { App } from './App'

describe('popup entrypoints', () => {
  it('exposes both organizer and settings actions', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('Open organizer')
    expect(html).toContain('Open settings')
  })
})

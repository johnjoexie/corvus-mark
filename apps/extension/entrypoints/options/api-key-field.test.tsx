import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ApiKeyField } from './api-key-field'

describe('ApiKeyField', () => {
  it('renders only the masked key placeholder into the DOM markup', () => {
    const html = renderToStaticMarkup(
      <ApiKeyField inputRef={createRef<HTMLInputElement>()} apiKeyMasked="sk-1********cdef" />,
    )

    expect(html).toContain('sk-1********cdef')
    expect(html).not.toContain('sk-1234567890abcdef')
  })
})

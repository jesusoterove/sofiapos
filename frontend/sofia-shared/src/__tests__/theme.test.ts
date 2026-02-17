import { describe, expect, it } from 'vitest'
import { themeTokens, sofiaTokens } from '../theme'

describe('theme tokens', () => {
  it('matches snapshot', () => {
    expect(themeTokens).toMatchSnapshot()
  })

  it('exposes the Sofia token set', () => {
    expect(sofiaTokens.colors.primary[500]).toBe('#3b82f6')
    expect(sofiaTokens.spacing.scale.md).toBe(12)
  })
})

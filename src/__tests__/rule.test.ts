import * as osutils from '../utils/os'
import { OSType, Rule as RuleType } from '../version/version'
import { Rule } from '../version/Rule'

describe('Version Rule', () => {
  const mockVersion = (version: string) => {
    jest.mock('os', () => ({
      release: version
    }))
  }
  it('Should parse rule for windows 10', () => {
    jest.spyOn(osutils, 'os').mockReturnValue('windows')
    jest.spyOn(osutils, 'arch').mockReturnValue('x64')
    mockVersion('10.0.11111')
    const rule: RuleType = {
      action: 'allow',
      os: {
        name: 'windows'
      },
      value: ['example']
    }
    const result = Rule(rule)
    expect(result.allow).toBe(true)
    expect(result.reasons).toHaveLength(0)
  })

  it('Should disallow for windows 10', () => {
    jest.spyOn(osutils, 'os').mockReturnValue('windows')
    jest.spyOn(osutils, 'arch').mockReturnValue('x64')
    mockVersion('10.0.11111')
    const rule: RuleType = {
      action: 'allow',
      os: {
        name: 'linux'
      },
      value: ['example']
    }
    const result = Rule(rule)
    expect(result.allow).toBe(false)
    expect(result.reasons).toHaveLength(1)
  })

  it('Should disallow for x86', () => {
    jest.spyOn(osutils, 'os').mockReturnValue('linux')
    jest.spyOn(osutils, 'arch').mockReturnValue('x86')
    mockVersion('10.0.11111')
    const rule: RuleType = {
      action: 'allow',
      os: {
        name: 'linux',
        arch: 'x64'
      },
      value: ['example']
    }
    const result = Rule(rule)
    expect(result.allow).toBe(false)
    expect(result.reasons).toHaveLength(1)
  })

  it('Should disallow for platform', () => {
    jest.spyOn(osutils, 'os').mockReturnValue('linux')
    jest.spyOn(osutils, 'arch').mockReturnValue('x86')
    mockVersion('10.0.11111')
    const rule: RuleType = {
      action: 'allow',
      os: {
        name: 'windows',
      },
      value: ['example']
    }
    const result = Rule(rule)
    expect(result.allow).toBe(false)
    expect(result.reasons).toHaveLength(1)
  })

  it('Should disallow for version', () => {
    jest.spyOn(osutils, 'os').mockReturnValue('windows')
    jest.spyOn(osutils, 'arch').mockReturnValue('x64')
    mockVersion('7.0')
    const rule: RuleType = {
      action: 'allow',
      os: {
        name: 'windows',
        version: '10.0.11111'
      },
      value: ['example']
    }
    const result = Rule(rule)
    expect(result.allow).toBe(false)
    expect(result.reasons).toHaveLength(1)
  })

  it('Should allow without os parameter', () => {
    const rule: RuleType = {
      action: 'allow',
      value: ['example']
    }
    const result = Rule(rule)
    expect(result.allow).toBe(true)
    expect(result.reasons).toHaveLength(0)
  })
})
import { Rule as RuleType } from './version'
import { arch, os } from '../utils/os'
import nodeos from 'os'

export interface RuleResult {
  allow: boolean
  reasons?: string[]
  values?: string[]
  features?: RuleType['features']
}

export const Rule = (rule: RuleType): RuleResult => {
  const currentOs = rule.os ? os() : null
  const currentArch = rule.os ? arch() : null
  const osVersion = rule.os ? nodeos.release() : null
  let reasons: string[] = []
  if(rule.os) {
    const ruleOs = rule.os
    if(ruleOs.arch === 'x86') ruleOs.arch = 'x32'
    if(currentOs === 'unknown') reasons.push('Unknown platform. Supported platforms: Windows, Macos, Linux')
    else if(currentOs !== ruleOs.name) reasons.push(`Incompatible platform. Expected: ${ruleOs.name}`)
    if(ruleOs.version && osVersion && !RegExp(ruleOs.version).test(osVersion))
      reasons.push(`Incompatible os version. Expected: ${ruleOs.name} v${ruleOs.version}`)
    if(ruleOs.arch && currentArch && currentArch !== ruleOs.arch)
      reasons.push(`Incompatible arch. Expected: ${ruleOs.arch}`)
  }
  const allow = reasons.length === 0
  return {
    allow: rule.action === 'allow' ? allow : !allow,
    reasons,
    values: typeof rule.value === 'string' ? [rule.value] : rule.value,
    features: rule.features
  }
}
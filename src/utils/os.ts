import { OSType } from '../version/version'
import iarch from 'arch'

export const os = (): OSType => {
  switch (process.platform) {
  case 'linux':
    return 'linux'
  case 'win32':
    return 'windows'
  case 'darwin':
    return 'osx'
  case 'android':
    return 'linux'
  default:
    return 'unknown'
  }
}

export const arch = iarch
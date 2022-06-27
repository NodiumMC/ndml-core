export type OSType = 'osx' | 'windows' | 'linux' | 'unknown'
export type ArchType = string
export type NativesType =
  | 'javadoc'
  | 'natives-linux'
  | 'natives-windows'
  | 'natives-macos'
  | 'natives-osx'

export interface Rule {
  action: 'allow' | 'disallow'
  features?: {
    is_demo_user?: boolean
    has_custom_resolution?: boolean
  }
  value?: string | string[]
  os?: {
    name?: OSType
    arch?: ArchType
    version?: string
  }
}

export type ArgumentsArray = (string | Rule)[]

export interface AssetIndex {
  id: string
  sha1: string
  size: number
  totalSize: number
  url: string
}

export interface DownloadItem {
  sha1: string
  size: number
  url: string
}

export interface Artifact {
  path: string
  sha1: string
  size: number
  url: string
}

export interface Library {
  name?: string
  url?: string
  natives?: Record<OSType, NativesType>
  downloads?: {
    name: string
    artifact: Artifact
    classifiers?: Record<NativesType, Artifact>
  }
  extract?: {
    exclude?: string[]
  }
  rules?: Rule[]
}

export interface Logging {
  client: ClientLogging
}

export interface MojangFile {
  id: string
  sha1: string
  size: number
  url: string
}

export interface ClientLogging {
  argument: string
  file: MojangFile
  type: string
}

export interface VersionFile {
  arguments: {
    game: ArgumentsArray
    jvm: ArgumentsArray
  }
  assetIndex: AssetIndex
  assets: string
  complianceLevel: number
  downloads: {
    client: DownloadItem
    client_mappings?: DownloadItem
    server: DownloadItem
    server_mappings?: DownloadItem
    windows_server?: DownloadItem
  }
  id: string
  javaVersion: {
    component: string
    majorVersion: number
  }
  libraries: Library[]
  logging: Logging
  mainClass: string
  minimumLauncherVersion: number
  releaseTime: string
  time: string
  type: 'release' | 'snapshot'
  minecraftArguments?: string
}

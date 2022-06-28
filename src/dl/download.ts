import { map, Observable } from 'rxjs'
import axios from 'axios'
import * as fsx from 'fs'
import * as fs from 'fs/promises'
import { Stream } from 'stream'
import path from 'path'
import { checksumAsync } from '../utils/utils'
import Zip from 'adm-zip'

export interface DownloadableResource {
  url: string
  sha1?: string
  local: string
}

export interface DownloadResult {
  local?: string
  sha1?: string
  size?: number
  error?: string
}

export const download = async (resource: DownloadableResource): Promise<DownloadResult> => {
  try {
    if (fsx.existsSync(resource.local)) {
      const sha1 = await checksumAsync(resource.local) as string
      const size = await fs.stat(resource.local).then(res => res.size)
      if (resource.sha1 === sha1) return { size, sha1, local: resource.local }
    }
    const streamSource = await axios.get<Stream>(resource.url, { responseType: 'stream' })
      .then(res => res.data)
    if (streamSource === null) return { error: 'Received empty stream', local: resource.local }
    const stream = new Observable<Buffer>(s => {
      streamSource.on('data', chunk => s.next(chunk))
      streamSource.on('error', err => s.error(err))
      streamSource.on('close', () => s.complete())
    })
    let size = 0
    await fs.mkdir(path.dirname(resource.local), { recursive: true })
    const writeable = fsx.createWriteStream(resource.local)
    await new Promise<void>((resolve, reject) => stream.subscribe({
      next: chunk => {
        size += chunk.length
        writeable.write(chunk, err => err !== null ?? reject(err))
      },
      complete: () => {
        writeable.close(err => err !== null ?? reject(err))
        resolve()
      },
      error: err => reject(err),
    }))
    const sha1 = await checksumAsync(resource.local) as string
    if (!sha1) return { error: `Failed calculate sha1 for file: ${resource.local}` }
    return { sha1, size, local: resource.local }
  } catch (e: any) {
    return { error: e.message }
  }
}

export const batchDownload = (resources: DownloadableResource[], _retries = 0): Observable<DownloadResult> =>
  new Observable<DownloadResult>(subscribe => {
    const failed: DownloadableResource[] = []
    if(_retries > 10) return subscribe.error(new Error('Too many retries. Please check your network'))
    Promise.all(resources.map(r =>
      download(r).then(res => res.error ? failed.push(r) : subscribe.next(res))))
      .then(() => failed.length > 0 ? batchDownload(failed, _retries + 1).subscribe(subscribe) : subscribe.complete())
  })

export const downloadAndExtract = (resources: DownloadableResource[]): Observable<DownloadResult> =>
  batchDownload(resources)
    .pipe(map(res => {
      try {
        new Zip(res.local).extractAllTo(path.dirname(res.local ?? '/'), true)
      } catch (e) {}
      return res
    }))

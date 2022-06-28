import mockfs from 'mock-fs'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import { batchDownload, download, DownloadableResource } from '../dl/download'
import EventEmitter from 'events'
import * as utils from '../utils/utils'
import * as fs from 'fs'
import { lastValueFrom } from 'rxjs'

class MockStream extends EventEmitter {
  pipe() {/***/}
}

describe('Downloader', () => {
  afterEach(() => mockfs.restore())
  const aximock = new MockAdapter(axios)
  it('Should download (normal)', async () => {
    mockfs({ save: {} })
    const chfile = jest.spyOn(utils, 'checksumAsync').mockImplementation(() => Promise.resolve('thisisshaone'))
    const resource: DownloadableResource = {
      url: '/resources/file.jar',
      local: 'save/to/file.jar',
    }
    const mockStream = new MockStream()
    aximock.onGet('/resources/file.jar').reply(200, mockStream)
    const resultPromise = download(resource)
    setImmediate(() => {
      mockStream.emit('data', Buffer.from('This is '))
      mockStream.emit('data', Buffer.from('resource'))
      mockStream.emit('close')
    })
    const result = await resultPromise
    expect(result.error).toBeUndefined()
    expect(result.size).toBe(16)
    expect(chfile).toHaveBeenCalled()
    expect(result.sha1).toBe('thisisshaone')
    expect(fs.readFileSync('save/to/file.jar')).toHaveLength(16)
  })

  it('Should skip existent file', async () => {
    mockfs({ 'save/to/file.jar': 'This is resource' })
    const chfile = jest.spyOn(utils, 'checksumAsync').mockImplementation(() => Promise.resolve('thisisshaone'))
    const resource: DownloadableResource = {
      url: '/resources/file.jar',
      local: 'save/to/file.jar',
      sha1: 'thisisshaone'
    }
    const result = await download(resource)
    expect(result.error).toBeUndefined()
    expect(result.size).toBe(16)
    expect(chfile).toHaveBeenCalled()
    expect(result.sha1).toBe('thisisshaone')
    expect(fs.readFileSync('save/to/file.jar')).toHaveLength(16)
  })

  it('Should catch errors', async () => {
    mockfs({ 'save/to/file.jar': 'This is resource' })
    const chfile = jest.spyOn(utils, 'checksumAsync').mockImplementation(() => {
      throw new Error('Test error')
    })
    const resource: DownloadableResource = {
      url: '/resources/file.jar',
      local: 'save/to/file.jar',
    }
    const result = await download(resource)
    expect(result.error).toBe('Test error')
    expect(chfile).toHaveBeenCalled()
  })

  it('Should catch stream errors', async () => {
    mockfs()
    jest.spyOn(utils, 'checksumAsync').mockImplementation(() => Promise.resolve('thisisshaone'))
    const resource: DownloadableResource = {
      url: '/resources/file.jar',
      local: 'save/to/file.jar',
    }
    const mockStream = new MockStream()
    aximock.onGet('/resources/file.jar').reply(200, mockStream)
    const resultPromise = download(resource)
    setImmediate(() => {
      mockStream.emit('data', Buffer.from('This is '))
      mockStream.emit('error', new Error('Test stream error'))
      mockStream.emit('close')
    })
    const result = await resultPromise
    expect(result.error).toBe('Test stream error')
    expect(fs.readFileSync('save/to/file.jar')).toHaveLength(8)
  })

  it('Should batch download (normal)', async () => {
    mockfs()
    jest.spyOn(utils, 'checksumAsync').mockImplementation(() => Promise.resolve('thisisshaone'))
    const resources: DownloadableResource[] = [{
      url: '/resources/file.jar',
      local: 'save/to/file.jar',
    }, {
      url: '/resources/file2.jar',
      local: 'save/another/file2.jar',
    }]
    const mockStream1 = new MockStream()
    aximock.onGet('/resources/file.jar').reply(200, mockStream1)
    const mockStream2 = new MockStream()
    aximock.onGet('/resources/file2.jar').reply(200, mockStream2)
    const resultObservable = batchDownload(resources)
    setImmediate(() => {
      mockStream1.emit('data', Buffer.from('Length: 9'))
      mockStream1.emit('close')
      mockStream2.emit('data', Buffer.from('More Length: 15'))
      mockStream2.emit('close')
    })
    await lastValueFrom(resultObservable)
    expect(fs.readFileSync('save/to/file.jar')).toHaveLength(9)
    expect(fs.readFileSync('save/another/file2.jar')).toHaveLength(15)
  })

  // TODO: test with retries
})

import util from 'util'
import checksum from 'checksum'

export const checksumAsync = util.promisify(checksum.file)

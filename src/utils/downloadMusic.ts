import { getMusicUrl } from '@/core/music/online'
import settingState from '@/store/setting/state'
import { downloadFile, existsFile, mkdir, privateStorageDirectoryPath, unlink } from '@/utils/fs'
import { getDownloadedMusicPath, saveDownloadedMusicPath } from '@/utils/downloadStore'
import { formatMusicName } from '@/utils/tools'

const getDownloadDirectory = () => `${privateStorageDirectoryPath}/Music`

const getFileExtension = (url: string) => {
  const extension = url.split(/[?#]/, 1)[0].match(/\.([a-z\d]{2,5})$/i)?.[1]?.toLowerCase()
  return extension && ['mp3', 'flac', 'wav', 'ape', 'm4a', 'aac', 'ogg'].includes(extension) ? extension : 'mp3'
}

const sanitizeFileName = (name: string) => name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim() || 'music'

export const downloadMusic = async(musicInfo: LX.Music.MusicInfo): Promise<string> => {
  if (musicInfo.source === 'local') throw new Error('本地歌曲无需下载')
  const onlineMusicInfo = musicInfo as LX.Music.MusicInfoOnline
  const existingPath = await getDownloadedMusicPath(onlineMusicInfo)
  if (existingPath) return existingPath

  const url = await getMusicUrl({ musicInfo: onlineMusicInfo, isRefresh: false })
  const directory = getDownloadDirectory()
  if (!await existsFile(directory)) await mkdir(directory)

  const title = formatMusicName(settingState.setting['download.fileName'], musicInfo.name, musicInfo.singer)
  const extension = getFileExtension(url)
  const filePath = `${directory}/${sanitizeFileName(title)}-${musicInfo.id.replace(/[^\w-]/g, '_')}.${extension}`
  const { promise } = downloadFile(url, filePath)
  try {
    const result = await promise
    if (result.statusCode < 200 || result.statusCode >= 300) throw new Error(`HTTP ${result.statusCode}`)
    await saveDownloadedMusicPath(musicInfo.id, filePath)
    return filePath
  } catch (error) {
    if (await existsFile(filePath)) {
      try { await unlink(filePath) } catch {}
    }
    throw error
  }
}

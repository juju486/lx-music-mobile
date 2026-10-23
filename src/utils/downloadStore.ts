import { storageDataPrefix } from '@/config/constant'
import { getData, saveData } from '@/plugins/storage'
import { existsFile } from '@/utils/fs'

const getDownloadedFiles = async(): Promise<Record<string, string>> => {
  return await getData<Record<string, string>>(storageDataPrefix.downloadedMusic) ?? {}
}

export const getDownloadedMusicPath = async(musicInfo: LX.Music.MusicInfoOnline): Promise<string | null> => {
  const files = await getDownloadedFiles()
  const path = files[musicInfo.id]
  if (!path) return null
  if (await existsFile(path)) return path
  delete files[musicInfo.id]
  await saveData(storageDataPrefix.downloadedMusic, files)
  return null
}

export const saveDownloadedMusicPath = async(id: string, path: string) => {
  const files = await getDownloadedFiles()
  files[id] = path
  await saveData(storageDataPrefix.downloadedMusic, files)
}

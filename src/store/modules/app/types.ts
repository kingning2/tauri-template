export type Languages = 'cn' | 'en'

export interface AppInitialState {
  initialized: boolean
  titleBarHeight: number
  mainWindowGlobalGg: string
  supportLanguages: { label: string; value: Languages }[]
  currentLanguage: Languages
}

import { createSlice } from '@reduxjs/toolkit'

import { localCache } from '@/utils/cache'

import type { AppInitialState } from './types'
import type { IAction } from '@/store/types'

const initialState: AppInitialState = {
  initialized: false,
  titleBarHeight: 40,
  mainWindowGlobalGg: '#f0f4f8',
  supportLanguages: [
    { label: '简体中文', value: 'cn' },
    { label: 'English', value: 'en' }
  ],
  currentLanguage: (localCache.getCache('language') as AppInitialState['currentLanguage']) ?? 'cn'
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    changeInitializedAction(
      state,
      { payload }: IAction<AppInitialState['initialized']>
    ) {
      state.initialized = payload
    },
    changeMainWindowGlobalGgAction(
      state,
      { payload }: IAction<AppInitialState['mainWindowGlobalGg']>
    ) {
      state.mainWindowGlobalGg = payload
    },
    changeCurrentLanguageAction(
      state,
      { payload }: IAction<AppInitialState['currentLanguage']>
    ) {
      state.currentLanguage = payload
      localCache.setCache('language', payload)
    }
  }
})

export const {
  changeInitializedAction,
  changeMainWindowGlobalGgAction,
  changeCurrentLanguageAction
} = appSlice.actions

export default appSlice.reducer

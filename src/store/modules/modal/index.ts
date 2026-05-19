import { createSlice } from '@reduxjs/toolkit'

import type { ModalInitialState } from './types'
import type { IAction } from '@/store/types'

const initialState: ModalInitialState = {
  openLabels: []
}

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    modalOpenedAction(state, { payload }: IAction<string>) {
      if (!state.openLabels.includes(payload)) {
        state.openLabels.push(payload)
      }
    },
    modalClosedAction(state, { payload }: IAction<string>) {
      state.openLabels = state.openLabels.filter((label) => label !== payload)
    }
  }
})

export const { modalOpenedAction, modalClosedAction } = modalSlice.actions

export default modalSlice.reducer

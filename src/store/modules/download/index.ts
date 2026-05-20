import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { type DownloadState, type ToolDownloadEntry } from "./types";

export type { ToolDownloadEntry };

const initialState: DownloadState = {
  byToolId: {}
};

const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {
    downloadSnapshotApplied(
      state,
      { payload }: PayloadAction<{ byToolId: Record<string, ToolDownloadEntry> }>
    ) {
      state.byToolId = { ...state.byToolId, ...payload.byToolId };
    }
  }
});

export const { downloadSnapshotApplied } = downloadSlice.actions;

export default downloadSlice.reducer;

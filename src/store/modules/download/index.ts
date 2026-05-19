import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DownloadPhase } from "@/enums/download-phase";

import { createIdleDownloadEntry, type DownloadState, type ToolDownloadEntry } from "./types";

const initialState: DownloadState = {
  byToolId: {}
};

function ensureEntry(state: DownloadState, toolId: string): ToolDownloadEntry {
  if (!state.byToolId[toolId]) {
    state.byToolId[toolId] = createIdleDownloadEntry();
  }
  return state.byToolId[toolId];
}

const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {
    downloadStarted(state, { payload }: PayloadAction<{ toolId: string }>) {
      const entry = ensureEntry(state, payload.toolId);
      entry.phase = DownloadPhase.Downloading;
      entry.downloadedBytes = 0;
      entry.totalBytes = null;
      entry.savedPath = null;
      entry.error = null;
      entry.inFlight = true;
    },
    downloadProgressUpdated(
      state,
      { payload }: PayloadAction<{ toolId: string; downloaded: number; total?: number }>
    ) {
      const entry = ensureEntry(state, payload.toolId);
      entry.downloadedBytes = payload.downloaded;
      if (payload.total != null) {
        entry.totalBytes = payload.total;
      }
    },
    downloadCompleted(
      state,
      { payload }: PayloadAction<{ toolId: string; savedPath: string }>
    ) {
      const entry = ensureEntry(state, payload.toolId);
      entry.savedPath = payload.savedPath;
      entry.phase = DownloadPhase.Completed;
      entry.inFlight = false;
    },
    downloadFailed(state, { payload }: PayloadAction<{ toolId: string; error: string }>) {
      const entry = ensureEntry(state, payload.toolId);
      entry.error = payload.error;
      entry.phase = DownloadPhase.Error;
      entry.inFlight = false;
    },
    downloadReset(state, { payload }: PayloadAction<{ toolId: string }>) {
      state.byToolId[payload.toolId] = createIdleDownloadEntry();
    }
  }
});

export const {
  downloadStarted,
  downloadProgressUpdated,
  downloadCompleted,
  downloadFailed,
  downloadReset
} = downloadSlice.actions;

export default downloadSlice.reducer;

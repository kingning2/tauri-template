import { Channel } from "@tauri-apps/api/core";

import { invokeWrapper } from "@/cmd";
import type {
  OpenToolExecutableArgs,
  PlatformDownloadSpec,
  ToolInstallState,
  ToolManifest
} from "@/config/tools-manifest";
import type { HostDesktopPlatform, ToolDownloadProgress } from "@/generated/contracts";

export type { ToolDownloadProgress };

export async function getToolsDownloadDir() {
  return await invokeWrapper<string>("get_tools_download_dir");
}

export async function getToolsManifest() {
  return await invokeWrapper<ToolManifest[]>("get_tools_manifest");
}

export async function getToolsInstallState() {
  return await invokeWrapper<ToolInstallState[]>("get_tools_install_state");
}

export async function getRuntimeHostPlatform() {
  return await invokeWrapper<HostDesktopPlatform>("runtime_host_platform");
}

export async function getToolExecutablePath(toolId: string) {
  return await invokeWrapper<string>("get_tool_executable_path", { toolId });
}

export async function openToolExecutable(args: OpenToolExecutableArgs) {
  // Rust 签名为 `open_tool_executable(_app, args: OpenToolExecutableArgs)`，payload 须含键 `args`
  return await invokeWrapper<void>("open_tool_executable", { args });
}

export async function downloadToolStream(args: {
  downloadSpec: PlatformDownloadSpec;
  relativeDir: string;
  onProgress: (p: ToolDownloadProgress) => void;
}) {
  const channel = new Channel<ToolDownloadProgress>();
  channel.onmessage = (p) => {
    args.onProgress(p);
  };

  return await invokeWrapper<string>("download_tool", {
    downloadSpec: args.downloadSpec,
    relativeDir: args.relativeDir,
    onProgress: channel
  });
}

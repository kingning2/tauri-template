import type { Metadata } from "next";

import SessionBridgeProvider from "@/providers/session-bridge-provider";
import StoreProvider from "@/providers/store";
import TauriEventProvider from "@/providers/tauri-event-provider";

import GlobalProvider from "./global-provider";

import "@/assets/globals.css";

export const metadata: Metadata = {
  title: "MobiXpert",
  description: "iOS utility toolkit"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <StoreProvider>
          <TauriEventProvider>
            <SessionBridgeProvider>
              <GlobalProvider>{children}</GlobalProvider>
            </SessionBridgeProvider>
          </TauriEventProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

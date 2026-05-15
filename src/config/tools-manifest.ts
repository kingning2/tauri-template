export type ToolManifest = {
  id: string
  title: string
  description: string
  /** small public file for demo; replace with real installer URLs */
  downloadUrl: string
  fileName: string
  hot?: boolean
  /** layout hint */
  variant: 'hero-left' | 'medium' | 'small'
}

export const TOOLS_MANIFEST: ToolManifest[] = [
  {
    id: 'system-repair',
    title: '系統修復',
    description:
      '修復 iOS/iPad 問題和 iTunes 錯誤，升級/降級系統。',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'system-repair-sample.pdf',
    hot: true,
    variant: 'hero-left'
  },
  {
    id: 'phone-unlock',
    title: '手機解鎖',
    description: '無需密碼，即可移除鎖定和 Apple ID',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'phone-unlock-sample.pdf',
    variant: 'medium'
  },
  {
    id: 'virtual-location',
    title: '虛擬定位',
    description: '在 iPhone、iPad 或 iPod touch 上設置虛擬位置',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'virtual-location-sample.pdf',
    variant: 'medium'
  },
  {
    id: 'data-transfer',
    title: '數據傳輸和備份',
    description: '管理、傳輸和備份你的 iPhone/iPad/iPod touch 數據。',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'data-transfer-sample.pdf',
    variant: 'small'
  },
  {
    id: 'data-recovery',
    title: '資料復原',
    description:
      '直接從 iPhone/iPad/iPod Touch 以及 iTunes 和 iCloud 備份中還原資料',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'data-recovery-sample.pdf',
    variant: 'small'
  },
  {
    id: 'social-transfer',
    title: '社群 App 資料傳輸',
    description:
      '傳輸、備份與還原 WhatsApp、LINE、Kik、Viber 的訊息和附件',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'social-transfer-sample.pdf',
    variant: 'small'
  },
  {
    id: 'ringtone',
    title: '鈴聲編輯',
    description: '以喜歡的方式為你的 iPhone 製作鈴聲',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'ringtone-sample.pdf',
    variant: 'small'
  }
]

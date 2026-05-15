export type ToolManifest = {
  id: string
  /** small public file for demo; replace with real installer URLs */
  downloadUrl: string
  fileName: string
  hot?: boolean
  /** layout hint */
  variant: 'hero-left' | 'medium' | 'small'
}

/** i18n key suffix under namespace `tools`, e.g. system_repair -> tools:system_repair.title */
export function toolIdToI18nKey(id: string): string {
  return id.replace(/-/g, '_')
}

export const TOOLS_MANIFEST: ToolManifest[] = [
  {
    id: 'system-repair',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'system-repair-sample.pdf',
    hot: true,
    variant: 'hero-left'
  },
  {
    id: 'phone-unlock',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'phone-unlock-sample.pdf',
    variant: 'medium'
  },
  {
    id: 'virtual-location',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'virtual-location-sample.pdf',
    variant: 'medium'
  },
  {
    id: 'data-transfer',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'data-transfer-sample.pdf',
    variant: 'small'
  },
  {
    id: 'data-recovery',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'data-recovery-sample.pdf',
    variant: 'small'
  },
  {
    id: 'social-transfer',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'social-transfer-sample.pdf',
    variant: 'small'
  },
  {
    id: 'ringtone',
    downloadUrl:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'ringtone-sample.pdf',
    variant: 'small'
  }
]

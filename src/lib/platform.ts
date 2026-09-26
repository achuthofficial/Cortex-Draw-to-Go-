/**
 * Platform adapter. Everything that touches the host OS (file pickers, saving,
 * PDF export, opening mail clients) goes through here so the browser
 * implementation can be swapped for Tauri or Electron APIs later.
 */

export interface PickedFile {
  name: string
  size: number
  type: string
}

export interface PlatformAdapter {
  name: 'browser' | 'tauri' | 'electron'
  pickFiles(opts: { accept: string[]; multiple: boolean }): Promise<PickedFile[]>
  saveTextFile(fileName: string, contents: string, mime?: string): Promise<void>
  /** Mock: renders a printable view. Desktop builds would call a native PDF writer. */
  exportPdf(fileName: string, elementId: string): Promise<void>
  openExternal(url: string): Promise<void>
}

const browserAdapter: PlatformAdapter = {
  name: 'browser',
  pickFiles({ accept, multiple }) {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept.join(',')
      input.multiple = multiple
      input.onchange = () => {
        const files = Array.from(input.files ?? []).map((f) => ({ name: f.name, size: f.size, type: f.type }))
        resolve(files)
      }
      input.click()
    })
  },
  async saveTextFile(fileName, contents, mime = 'text/plain') {
    const blob = new Blob([contents], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  async exportPdf(fileName, elementId) {
    // Prototype: no real PDF. We just confirm the element exists.
    void fileName
    if (!document.getElementById(elementId)) throw new Error('Nothing to export')
    await new Promise((r) => setTimeout(r, 700))
  },
  async openExternal(url) {
    window.open(url, '_blank', 'noopener')
  },
}

export const platform: PlatformAdapter = browserAdapter

export const APP_VERSION = '0.1.0-prototype'

import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import type { WorkerMessage, WorkerMessageType } from '../types'

/**
 * Markdown解析Worker
 * 在独立线程中执行解析，避免阻塞主线程
 */

// 配置marked
const renderer = new marked.Renderer()

renderer.code = (code: string, language: string | undefined) => {
  if (language && hljs.getLanguage(language)) {
    try {
      const highlighted = hljs.highlight(code, { language }).value
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
    } catch (err) {
      console.error('Highlight error:', err)
    }
  }
  return `<pre><code>${escapeHtml(code)}</code></pre>`
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
  pedantic: false
})

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// 监听主线程消息
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  try {
    if (type === 'parse' as WorkerMessageType) {
      const { blocks } = payload
      const results = []

      for (const block of blocks) {
        const rawHtml = await marked.parse(block.content, { async: true })
        const html = DOMPurify.sanitize(rawHtml)
        
        results.push({
          ...block,
          html
        })
      }

      self.postMessage({
        type: 'parse_result' as WorkerMessageType,
        payload: results
      })
    }
  } catch (error) {
    self.postMessage({
      type: 'error' as WorkerMessageType,
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

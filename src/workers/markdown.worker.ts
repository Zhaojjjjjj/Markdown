import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import markdown from 'highlight.js/lib/languages/markdown'
import type { WorkerMessage, WorkerMessageType } from '../types'

// 注册常用语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('markdown', markdown)

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

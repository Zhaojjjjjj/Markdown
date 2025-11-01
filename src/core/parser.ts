import { marked, type Renderer } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import type { MarkdownBlock, BlockType } from '../types'

/**
 * Markdown解析器
 * 核心思想：分块解析，避免一次性解析大文档
 */
export class MarkdownParser {
  private renderer: Renderer

  constructor() {
    this.renderer = new marked.Renderer()
    this.setupRenderer()
    this.configureMarked()
  }

  private setupRenderer() {
    // 自定义代码块渲染，支持语法高亮
    this.renderer.code = (code: string, language: string | undefined) => {
      if (language && hljs.getLanguage(language)) {
        try {
          const highlighted = hljs.highlight(code, { language }).value
          return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
        } catch (err) {
          console.error('Highlight error:', err)
        }
      }
      return `<pre><code>${this.escapeHtml(code)}</code></pre>`
    }
  }

  private configureMarked() {
    marked.setOptions({
      renderer: this.renderer,
      gfm: true,
      breaks: true,
      pedantic: false
    })
  }

  /**
   * 将Markdown文本分割成块
   * 策略：按段落、代码块、表格等自然边界分割
   */
  splitIntoBlocks(markdown: string): string[] {
    const blocks: string[] = []
    const lines = markdown.split('\n')
    let currentBlock: string[] = []
    let inCodeBlock = false
    let inTable = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // 代码块检测
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          currentBlock.push(line)
          blocks.push(currentBlock.join('\n'))
          currentBlock = []
          inCodeBlock = false
        } else {
          if (currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'))
            currentBlock = []
          }
          currentBlock.push(line)
          inCodeBlock = true
        }
        continue
      }

      // 在代码块内
      if (inCodeBlock) {
        currentBlock.push(line)
        continue
      }

      // 表格检测
      if (trimmed.includes('|') && (trimmed.startsWith('|') || trimmed.endsWith('|'))) {
        if (!inTable && currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'))
          currentBlock = []
        }
        currentBlock.push(line)
        inTable = true
        continue
      } else if (inTable) {
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
        inTable = false
      }

      // 空行 - 段落分隔符
      if (trimmed === '') {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'))
          currentBlock = []
        }
        continue
      }

      // 标题、分隔线 - 独立块
      if (trimmed.startsWith('#') || trimmed.match(/^[-*_]{3,}$/)) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'))
          currentBlock = []
        }
        blocks.push(line)
        continue
      }

      // 普通行
      currentBlock.push(line)
    }

    // 处理剩余内容
    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'))
    }

    return blocks.filter(b => b.trim().length > 0)
  }

  /**
   * 解析单个块
   */
  async parseBlock(content: string, index: number): Promise<MarkdownBlock> {
    const id = `block-${index}-${Date.now()}`
    const type = this.detectBlockType(content)
    
    // 解析HTML
    const rawHtml = await marked.parse(content, { async: true })
    const html = DOMPurify.sanitize(rawHtml)

    return {
      id,
      type,
      content,
      html,
      startIndex: index,
      endIndex: index,
      language: this.extractLanguage(content),
      level: this.extractHeadingLevel(content)
    }
  }

  /**
   * 批量解析块
   */
  async parseBlocks(blocks: string[]): Promise<MarkdownBlock[]> {
    const results: MarkdownBlock[] = []
    
    for (let i = 0; i < blocks.length; i++) {
      const block = await this.parseBlock(blocks[i], i)
      results.push(block)
    }

    return results
  }

  /**
   * 检测块类型
   */
  private detectBlockType(content: string): BlockType {
    const trimmed = content.trim()
    
    if (trimmed.startsWith('#')) return 'heading' as BlockType
    if (trimmed.startsWith('```')) return 'code' as BlockType
    if (trimmed.startsWith('>')) return 'blockquote' as BlockType
    if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) return 'list' as BlockType
    if (trimmed.includes('|') && trimmed.match(/\|.*\|/)) return 'table' as BlockType
    if (trimmed.match(/^[-*_]{3,}$/)) return 'hr' as BlockType
    if (trimmed.startsWith('<')) return 'html' as BlockType
    
    return 'paragraph' as BlockType
  }

  /**
   * 提取代码语言
   */
  private extractLanguage(content: string): string | undefined {
    const match = content.match(/^```(\w+)/)
    return match ? match[1] : undefined
  }

  /**
   * 提取标题级别
   */
  private extractHeadingLevel(content: string): number | undefined {
    const match = content.match(/^(#{1,6})\s/)
    return match ? match[1].length : undefined
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }
}

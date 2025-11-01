import { MarkdownParser } from './parser'
import { IncrementalRenderer } from './renderer'
import type { MarkdownBlock, RenderConfig } from '../types'

/**
 * 流式处理器
 * 核心职责：协调解析和渲染，实现流式输入的增量处理
 */
export class StreamProcessor {
  private parser: MarkdownParser
  private renderer: IncrementalRenderer
  private buffer: string = ''
  private processedBlocks: MarkdownBlock[] = []

  constructor(container: HTMLElement, config?: RenderConfig) {
    this.parser = new MarkdownParser()
    this.renderer = new IncrementalRenderer(container, config)
  }

  /**
   * 追加流式内容
   * 策略：只渲染完整的块，避免过度分割
   */
  async append(chunk: string): Promise<void> {
    this.buffer += chunk

    // 尝试提取完整的块
    const newBlocks = this.extractCompleteBlocks()
    
    if (newBlocks.length > 0) {
      const parsedBlocks = await this.parser.parseBlocks(newBlocks)
      this.processedBlocks.push(...parsedBlocks)
      this.renderer.appendBlocks(parsedBlocks)
    }
  }

  /**
   * 提取完整的块
   * 策略：等待句号、换行或特定标记才认为块完整
   */
  private extractCompleteBlocks(): string[] {
    // 检查是否有完整的段落（以双换行结束）
    const doubleNewlineIndex = this.buffer.indexOf('\n\n')
    if (doubleNewlineIndex !== -1) {
      const completeContent = this.buffer.substring(0, doubleNewlineIndex)
      this.buffer = this.buffer.substring(doubleNewlineIndex + 2)
      return completeContent.trim() ? [completeContent] : []
    }
    
    // 检查是否有以句号结尾的完整句子
    const sentences = this.buffer.split(/([.!?。！？])\s+/)
    if (sentences.length > 2) {
      // 保留最后一个可能不完整的句子
      const lastSentence = sentences.pop() || ''
      const lastPunctuation = sentences.pop() || ''
      this.buffer = lastSentence
      
      const completeContent = sentences.join('')
      if (lastPunctuation) {
        return [completeContent + lastPunctuation]
      }
    }
    
    // 检查特殊块（标题、代码块等）
    const lines = this.buffer.split('\n')
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim()
      if (line.startsWith('#') || line.startsWith('```') || line.includes('|')) {
        const blockContent = lines.slice(0, i + 1).join('\n')
        this.buffer = lines.slice(i + 1).join('\n')
        return [blockContent]
      }
    }
    
    return []
  }


  /**
   * 完成流式输入
   * 处理buffer中剩余的内容
   */
  async finish(): Promise<void> {
    if (this.buffer.trim().length > 0) {
      const remainingBlocks = this.parser.splitIntoBlocks(this.buffer)
      if (remainingBlocks.length > 0) {
        const parsedBlocks = await this.parser.parseBlocks(remainingBlocks)
        this.processedBlocks.push(...parsedBlocks)
        this.renderer.appendBlocks(parsedBlocks)
      }
      this.buffer = ''
    }
  }

  /**
   * 清空所有内容
   */
  clear(): void {
    this.buffer = ''
    this.processedBlocks = []
    this.renderer.clear()
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      bufferSize: this.buffer.length,
      processedBlocks: this.processedBlocks.length,
      ...this.renderer.getStats()
    }
  }
}

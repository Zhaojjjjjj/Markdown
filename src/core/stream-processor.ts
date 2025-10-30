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
  private lastProcessedIndex: number = 0
  private processedBlocks: MarkdownBlock[] = []

  constructor(container: HTMLElement, config?: RenderConfig) {
    this.parser = new MarkdownParser()
    this.renderer = new IncrementalRenderer(container, config)
  }

  /**
   * 追加流式内容
   * 策略：只解析和渲染新增的完整块
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
   * 策略：保留不完整的块在buffer中，等待后续内容
   */
  private extractCompleteBlocks(): string[] {
    const blocks = this.parser.splitIntoBlocks(this.buffer)
    
    // 检查最后一个块是否完整
    const lastBlock = blocks[blocks.length - 1]
    const isLastBlockComplete = this.isBlockComplete(lastBlock, this.buffer)

    if (!isLastBlockComplete && blocks.length > 0) {
      // 保留最后一个不完整的块
      const incompleteBlock = blocks.pop()!
      const lastIndex = this.buffer.lastIndexOf(incompleteBlock)
      this.buffer = this.buffer.slice(lastIndex)
      return blocks
    }

    // 所有块都完整
    this.buffer = ''
    return blocks
  }

  /**
   * 判断块是否完整
   */
  private isBlockComplete(block: string, fullBuffer: string): boolean {
    const trimmed = block.trim()
    
    // 代码块必须有结束标记
    if (trimmed.startsWith('```')) {
      const codeBlockMatch = trimmed.match(/```/g)
      return codeBlockMatch ? codeBlockMatch.length >= 2 : false
    }

    // 表格需要检查是否在末尾
    if (trimmed.includes('|')) {
      const blockEndIndex = fullBuffer.lastIndexOf(block) + block.length
      const remaining = fullBuffer.slice(blockEndIndex).trim()
      // 如果后面还有内容，且不是空行，可能表格未完成
      return remaining === '' || remaining.startsWith('\n\n')
    }

    // 其他块类型认为完整
    return true
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
    this.lastProcessedIndex = 0
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

import type { MarkdownBlock, RenderConfig } from '../types'

/**
 * 增量渲染器
 * 核心优化：
 * 1. 使用DocumentFragment批量插入，减少重排
 * 2. RAF节流，避免过度渲染
 * 3. 只更新变化的块，复用已渲染DOM
 */
export class IncrementalRenderer {
  private container: HTMLElement
  private config: Required<RenderConfig>
  private renderedBlocks: Map<string, HTMLElement> = new Map()
  private rafId: number | null = null
  private pendingBlocks: MarkdownBlock[] = []
  private isRendering = false
  private lastTempBlockId: string | null = null

  constructor(container: HTMLElement, config: RenderConfig = {}) {
    this.container = container
    this.config = {
      chunkSize: config.chunkSize ?? 10,
      debounceMs: config.debounceMs ?? 16,
      enableVirtualScroll: config.enableVirtualScroll ?? false,
      bufferSize: config.bufferSize ?? 5,
      enableWorker: config.enableWorker ?? true,
      highlightTheme: config.highlightTheme ?? 'github'
    }
  }

  /**
   * 流式添加块
   */
  appendBlocks(blocks: MarkdownBlock[]): void {
    // 如果有临时块，先清理
    if (this.lastTempBlockId && blocks.length > 0) {
      const tempElement = this.renderedBlocks.get(this.lastTempBlockId)
      if (tempElement && !blocks[0].id.startsWith('__temp__')) {
        tempElement.remove()
        this.renderedBlocks.delete(this.lastTempBlockId)
        this.lastTempBlockId = null
      }
    }
    
    this.pendingBlocks.push(...blocks)
    this.scheduleRender()
  }

  /**
   * 使用RAF调度渲染
   */
  private scheduleRender(): void {
    if (this.rafId !== null) return

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.renderPendingBlocks()
    })
  }

  /**
   * 渲染待处理的块
   */
  private renderPendingBlocks(): void {
    if (this.isRendering || this.pendingBlocks.length === 0) return

    this.isRendering = true
    const startTime = performance.now()

    // 分块渲染，避免长任务阻塞
    const chunk = this.pendingBlocks.splice(0, this.config.chunkSize)
    const fragment = document.createDocumentFragment()

    for (const block of chunk) {
      // 如果是临时块，检查是否需要替换旧的临时块
      if (block.id.startsWith('__temp__')) {
        if (this.lastTempBlockId) {
          const oldTemp = this.renderedBlocks.get(this.lastTempBlockId)
          if (oldTemp) {
            oldTemp.remove()
            this.renderedBlocks.delete(this.lastTempBlockId)
          }
        }
        this.lastTempBlockId = block.id
      }
      
      const element = this.renderBlock(block)
      fragment.appendChild(element)
      this.renderedBlocks.set(block.id, element)
    }

    // 批量插入DOM
    this.container.appendChild(fragment)
    
    // 自动滚动到底部
    this.scrollToBottom()

    const renderTime = performance.now() - startTime
    
    this.isRendering = false

    // 如果还有待渲染的块，立即继续调度（减少延迟）
    if (this.pendingBlocks.length > 0) {
      // 只有在渲染耗时超过一帧时才延迟
      const delay = renderTime > 16 ? Math.min(this.config.debounceMs, 8) : 0
      setTimeout(() => this.scheduleRender(), delay)
    }
  }

  /**
   * 渲染单个块
   */
  private renderBlock(block: MarkdownBlock): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = `markdown-block markdown-block-${block.type}`
    wrapper.dataset.blockId = block.id
    wrapper.innerHTML = block.html

    return wrapper
  }

  /**
   * 更新已存在的块（增量更新）
   */
  updateBlock(blockId: string, newHtml: string): void {
    const element = this.renderedBlocks.get(blockId)
    if (!element) return

    // 只更新内容变化的部分
    if (element.innerHTML !== newHtml) {
      element.innerHTML = newHtml
    }
  }

  /**
   * 清空所有内容
   */
  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    
    this.pendingBlocks = []
    this.renderedBlocks.clear()
    this.container.innerHTML = ''
  }

  /**
   * 自动滚动到底部
   */
  private scrollToBottom(): void {
    // 使用requestAnimationFrame确保DOM更新后再滚动
    requestAnimationFrame(() => {
      this.container.scrollTop = this.container.scrollHeight
    })
  }

  /**
   * 获取渲染统计
   */
  getStats() {
    return {
      renderedCount: this.renderedBlocks.size,
      pendingCount: this.pendingBlocks.length,
      domNodeCount: this.container.querySelectorAll('*').length
    }
  }
}

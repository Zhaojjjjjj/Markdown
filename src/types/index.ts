/**
 * Markdown块类型定义
 */
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  CODE = 'code',
  BLOCKQUOTE = 'blockquote',
  LIST = 'list',
  TABLE = 'table',
  HR = 'hr',
  HTML = 'html'
}

/**
 * 单个Markdown块
 */
export interface MarkdownBlock {
  id: string
  type: BlockType
  content: string
  html: string
  startIndex: number
  endIndex: number
  level?: number // for headings
  language?: string // for code blocks
}

/**
 * 渲染配置
 */
export interface RenderConfig {
  chunkSize?: number // 每次渲染的块数量
  debounceMs?: number // 防抖延迟
  enableVirtualScroll?: boolean // 是否启用虚拟滚动
  bufferSize?: number // 虚拟滚动缓冲区大小
  enableWorker?: boolean // 是否使用WebWorker
  highlightTheme?: string // 代码高亮主题
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  fps: number
  avgCpu: number
  peakCpu: number
  jsHeapSize: number
  domNodeCount: number
  renderTime: number
  parseTime: number
}

/**
 * Worker消息类型
 */
export enum WorkerMessageType {
  PARSE = 'parse',
  PARSE_RESULT = 'parse_result',
  ERROR = 'error'
}

export interface WorkerMessage {
  type: WorkerMessageType
  payload: any
}

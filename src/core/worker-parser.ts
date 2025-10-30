import type { MarkdownBlock, WorkerMessage, WorkerMessageType } from '../types'
import MarkdownWorker from '../workers/markdown.worker?worker'

/**
 * Worker包装器
 * 提供Promise接口，简化Worker通信
 */
export class WorkerParser {
  private worker: Worker
  private pendingRequests: Map<number, {
    resolve: (value: MarkdownBlock[]) => void
    reject: (reason: any) => void
  }> = new Map()
  private requestId = 0

  constructor() {
    this.worker = new MarkdownWorker()
    this.worker.addEventListener('message', this.handleMessage.bind(this))
  }

  /**
   * 解析块（在Worker中执行）
   */
  async parseBlocks(blocks: Partial<MarkdownBlock>[]): Promise<MarkdownBlock[]> {
    return new Promise((resolve, reject) => {
      const id = this.requestId++
      this.pendingRequests.set(id, { resolve, reject })

      const message: WorkerMessage = {
        type: 'parse' as WorkerMessageType,
        payload: { blocks, id }
      }

      this.worker.postMessage(message)
    })
  }

  /**
   * 处理Worker返回的消息
   */
  private handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { type, payload } = event.data

    if (type === 'parse_result' as WorkerMessageType) {
      const { id, ...rest } = payload
      const request = this.pendingRequests.get(id)
      
      if (request) {
        request.resolve(payload)
        this.pendingRequests.delete(id)
      }
    } else if (type === 'error' as WorkerMessageType) {
      const { id, message } = payload
      const request = this.pendingRequests.get(id)
      
      if (request) {
        request.reject(new Error(message))
        this.pendingRequests.delete(id)
      }
    }
  }

  /**
   * 终止Worker
   */
  terminate(): void {
    this.worker.terminate()
    this.pendingRequests.clear()
  }
}

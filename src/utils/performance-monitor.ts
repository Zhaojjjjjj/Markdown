import type { PerformanceMetrics } from '../types'

/**
 * 性能监控工具
 * 实时追踪FPS、CPU、内存、DOM节点等指标
 */
export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60
  private rafId: number | null = null
  private observers: ((metrics: PerformanceMetrics) => void)[] = []

  /**
   * 开始监控
   */
  start(): void {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.measureFPS()
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * 订阅性能指标更新
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  /**
   * 测量FPS
   */
  private measureFPS(): void {
    this.rafId = requestAnimationFrame(() => {
      this.frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - this.lastTime

      // 每秒更新一次
      if (elapsed >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastTime = currentTime

        // 发布指标
        this.publishMetrics()
      }

      this.measureFPS()
    })
  }

  /**
   * 收集并发布性能指标
   */
  private publishMetrics(): void {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      avgCpu: this.getAverageCPU(),
      peakCpu: this.getPeakCPU(),
      jsHeapSize: this.getJSHeapSize(),
      domNodeCount: this.getDOMNodeCount(),
      renderTime: this.getRenderTime(),
      parseTime: this.getParseTime()
    }

    this.observers.forEach(observer => observer(metrics))
  }

  /**
   * 获取平均CPU使用率（近似值）
   */
  private getAverageCPU(): number {
    // 通过FPS推算CPU占用（简化模型）
    // FPS越低，CPU占用越高
    return Math.max(0, Math.min(100, 100 - (this.fps / 60) * 100))
  }

  /**
   * 获取峰值CPU使用率
   */
  private getPeakCPU(): number {
    // 简化实现，实际应该记录历史峰值
    return this.getAverageCPU() * 1.2
  }

  /**
   * 获取JS堆内存大小
   */
  private getJSHeapSize(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
    }
    return 0
  }

  /**
   * 获取DOM节点数量
   */
  private getDOMNodeCount(): number {
    return document.querySelectorAll('*').length
  }

  /**
   * 获取渲染时间
   */
  private getRenderTime(): number {
    const entries = performance.getEntriesByType('measure')
    const renderEntries = entries.filter(e => e.name.includes('render'))
    if (renderEntries.length > 0) {
      return renderEntries[renderEntries.length - 1].duration
    }
    return 0
  }

  /**
   * 获取解析时间
   */
  private getParseTime(): number {
    const entries = performance.getEntriesByType('measure')
    const parseEntries = entries.filter(e => e.name.includes('parse'))
    if (parseEntries.length > 0) {
      return parseEntries[parseEntries.length - 1].duration
    }
    return 0
  }

  /**
   * 标记性能测量点
   */
  static mark(name: string): void {
    performance.mark(name)
  }

  /**
   * 测量两个标记点之间的时间
   */
  static measure(name: string, startMark: string, endMark: string): void {
    try {
      performance.measure(name, startMark, endMark)
    } catch (e) {
      // 标记点可能不存在
    }
  }
}

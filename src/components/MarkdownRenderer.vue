<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { StreamProcessor } from '../core/stream-processor'
import { PerformanceMonitor } from '../utils/performance-monitor'
import type { RenderConfig, PerformanceMetrics } from '../types'

/**
 * 高性能流式Markdown渲染组件
 */

interface Props {
  content?: string
  config?: RenderConfig
  enableMetrics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  enableMetrics: false
})

const emit = defineEmits<{
  (e: 'metrics', metrics: PerformanceMetrics): void
  (e: 'render-complete'): void
}>()

const containerRef = ref<HTMLElement>()
const metrics = ref<PerformanceMetrics | null>(null)

let processor: StreamProcessor | null = null
let monitor: PerformanceMonitor | null = null

/**
 * 初始化渲染器
 */
const initRenderer = () => {
  if (!containerRef.value) return

  processor = new StreamProcessor(containerRef.value, props.config)

  // 启用性能监控
  if (props.enableMetrics) {
    monitor = new PerformanceMonitor()
    monitor.subscribe((m) => {
      metrics.value = m
      emit('metrics', m)
    })
    monitor.start()
  }
}

/**
 * 流式追加内容
 */
const append = async (chunk: string) => {
  if (!processor) return
  await processor.append(chunk)
}

/**
 * 完成流式输入
 */
const finish = async () => {
  if (!processor) return
  await processor.finish()
  emit('render-complete')
}

/**
 * 清空内容
 */
const clear = () => {
  if (processor) {
    processor.clear()
  }
}

/**
 * 获取统计信息
 */
const getStats = () => {
  return processor?.getStats() || null
}

// 监听content变化
watch(() => props.content, async (newContent) => {
  if (!processor || !newContent) return
  
  clear()
  
  // 模拟流式输入
  const chunkSize = 100
  for (let i = 0; i < newContent.length; i += chunkSize) {
    const chunk = newContent.slice(i, i + chunkSize)
    await append(chunk)
    // 添加小延迟模拟网络流式传输
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  await finish()
})

onMounted(() => {
  initRenderer()
  
  // 如果有初始内容，立即渲染
  if (props.content) {
    watch(() => props.content, async (newContent) => {
      if (newContent) {
        await append(newContent)
        await finish()
      }
    }, { immediate: true })
  }
})

onUnmounted(() => {
  if (monitor) {
    monitor.stop()
  }
})

// 暴露方法给父组件
defineExpose({
  append,
  finish,
  clear,
  getStats
})
</script>

<template>
  <div class="markdown-renderer">
    <div 
      ref="containerRef" 
      class="markdown-content"
    />
    
    <!-- 性能指标显示 -->
    <div v-if="enableMetrics && metrics" class="metrics-panel">
      <div class="metric">
        <span class="metric-label">FPS:</span>
        <span class="metric-value" :class="{ 'metric-warning': metrics.fps < 30 }">
          {{ metrics.fps }}
        </span>
      </div>
      <div class="metric">
        <span class="metric-label">CPU:</span>
        <span class="metric-value">{{ metrics.avgCpu.toFixed(1) }}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Memory:</span>
        <span class="metric-value">{{ metrics.jsHeapSize }}MB</span>
      </div>
      <div class="metric">
        <span class="metric-label">DOM:</span>
        <span class="metric-value">{{ metrics.domNodeCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-renderer {
  position: relative;
  width: 100%;
  height: 100%;
}

.markdown-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
}

.markdown-content :deep(.markdown-block) {
  margin-bottom: 16px;
}

.markdown-content :deep(h1) {
  font-size: 2em;
  font-weight: 600;
  margin: 24px 0 16px;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 24px 0 16px;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.markdown-content :deep(h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 24px 0 16px;
}

.markdown-content :deep(code) {
  background-color: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  color: #6a737d;
  margin: 16px 0;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}

.markdown-content :deep(table th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

.metrics-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 12px;
}

.metric:last-child {
  margin-bottom: 0;
}

.metric-label {
  color: #999;
}

.metric-value {
  font-weight: bold;
  color: #0f0;
}

.metric-warning {
  color: #f00 !important;
}
</style>

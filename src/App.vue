<script setup lang="ts">
import { ref } from 'vue'
import MarkdownRenderer from './components/MarkdownRenderer.vue'
import type { PerformanceMetrics } from './types'

const rendererRef = ref<InstanceType<typeof MarkdownRenderer>>()
const showMetrics = ref(true)
const isStreaming = ref(false)

// 示例Markdown内容
const sampleMarkdown = `# 高性能流式Markdown渲染器

## 核心特性

这是一个专为**大模型对话场景**设计的高性能Markdown渲染器，具备以下特性：

### 1. 流式渲染
- ✅ 支持实时流式输入
- ✅ 增量解析和渲染
- ✅ 无需等待完整内容

### 2. 性能优化
- 🚀 分块渲染，避免长任务阻塞
- 🚀 DocumentFragment批量插入
- 🚀 RAF节流控制
- 🚀 虚拟滚动支持

### 3. 代码高亮

支持多种编程语言的语法高亮：

${'```'}typescript
interface MarkdownBlock {
  id: string
  type: BlockType
  content: string
  html: string
}

class StreamProcessor {
  async append(chunk: string): Promise<void> {
    // 流式追加内容
    this.buffer += chunk
    await this.processBuffer()
  }
}
${'```'}

${'```'}python
def fibonacci(n: int) -> int:
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 使用示例
result = fibonacci(10)
print(f"Result: {result}")
${'```'}

### 4. 表格支持

| 特性 | 传统方案 | 本方案 |
|------|---------|--------|
| FPS | 20-30 | 55-60 |
| CPU占用 | 80%+ | <30% |
| 内存占用 | 高 | 低 |
| DOM节点 | 大量冗余 | 按需创建 |

### 5. 引用块

> "Clean and less code is the best."
> 
> 简洁的代码是最好的代码。好的设计能让边界情况自然消失。

### 6. 列表

**有序列表：**
1. 解析Markdown为块
2. 增量渲染块
3. 复用已渲染DOM
4. 监控性能指标

**无序列表：**
- 分而治之的设计思想
- 避免重绘重排
- RAF节流优化
- WebWorker异步解析

---

## 性能指标

右上角实时显示：
- **FPS**：帧率，越高越流畅
- **CPU**：CPU占用率
- **Memory**：JS堆内存
- **DOM**：DOM节点数量

## 技术栈

- Vue 3 + TypeScript
- Marked.js (解析)
- Highlight.js (代码高亮)
- DOMPurify (XSS防护)
- WebWorker (异步解析)

---

**项目地址**: https://github.com/your-repo/markdown-stream-renderer
`

const currentContent = ref('')

// 模拟流式输入
const startStreaming = async () => {
  if (isStreaming.value) return
  
  isStreaming.value = true
  currentContent.value = ''
  rendererRef.value?.clear()
  
  // 模拟网络流式传输
  const chunkSize = 50
  for (let i = 0; i < sampleMarkdown.length; i += chunkSize) {
    if (!isStreaming.value) break
    
    const chunk = sampleMarkdown.slice(i, i + chunkSize)
    await rendererRef.value?.append(chunk)
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  
  await rendererRef.value?.finish()
  isStreaming.value = false
}

// 停止流式输入
const stopStreaming = () => {
  isStreaming.value = false
}

// 清空内容
const clearContent = () => {
  rendererRef.value?.clear()
  currentContent.value = ''
}

// 性能指标回调
const handleMetrics = (metrics: PerformanceMetrics) => {
  console.log('Performance Metrics:', metrics)
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🚀 高性能流式Markdown渲染器</h1>
      <div class="controls">
        <button 
          @click="startStreaming" 
          :disabled="isStreaming"
          class="btn btn-primary"
        >
          {{ isStreaming ? '流式渲染中...' : '开始流式渲染' }}
        </button>
        <button 
          @click="stopStreaming" 
          :disabled="!isStreaming"
          class="btn btn-secondary"
        >
          停止
        </button>
        <button 
          @click="clearContent"
          class="btn btn-secondary"
        >
          清空
        </button>
        <label class="checkbox">
          <input type="checkbox" v-model="showMetrics" />
          显示性能指标
        </label>
      </div>
    </header>
    
    <main class="main">
      <MarkdownRenderer
        ref="rendererRef"
        :enable-metrics="showMetrics"
        @metrics="handleMetrics"
      />
    </main>
    
    <footer class="footer">
      <p>
        专为大模型对话场景设计 | 
        <a href="https://github.com" target="_blank">GitHub</a> |
        Vue 3 + TypeScript
      </p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 24px;
  margin-bottom: 15px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.checkbox input {
  cursor: pointer;
}

.main {
  flex: 1;
  overflow: hidden;
  background: white;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.footer {
  background: white;
  padding: 15px 30px;
  text-align: center;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #eee;
}

.footer a {
  color: #667eea;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}
</style>

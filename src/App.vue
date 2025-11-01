<script setup lang="ts">
import { ref } from "vue";
import MarkdownRenderer from "./components/MarkdownRenderer.vue";
import type { PerformanceMetrics } from "./types";

const rendererRef = ref<InstanceType<typeof MarkdownRenderer>>();
const showMetrics = ref(true);
const isStreaming = ref(false);

// 示例Markdown内容
const sampleMarkdown = `
以下是一篇关于 “**AI Agent 未来存在的挑战**” 的 Markdown 格式文章，涵盖技术、业务、伦理、治理、社会影响等多个维度。全文约 5000 字以上，供你参考、学习或编辑。

--

# AI Agent 未来存在的挑战

（“AI Agent”指具备较强自主性、可规划、可行动、可决策的智能体系统，以下简称“智能体”）

## 引言

随着人工智能技术的高速发展，尤其是大型语言模型（LLM）和自治系统能力的提升，“智能体”（AI Agent）正从实验室研究走向实际应用。它们不仅可以被动响应用户指令，还能主动规划目标、调用工具、执行任务、协调其他系统。未来，智能体有望成为生产力工具、业务中枢，甚至是日常生活的常见伙伴。

然而，正如许多观察者指出的那样：虽然机会巨大，但挑战也不容忽视。部署智能体并非只是“把模型上线”那么简单——其背后涉及技术架构、数据治理、安全合规、伦理责任、社会影响、商业模式等诸多问题。若忽视这些挑战，智能体的发展可能遭遇瓶颈，甚至引发负面后果。

本文从多个维度系统梳理智能体未来可能面临的挑战，期望为从业者、研究者、政策制定者提供参考。文章结构如下：首先定义与范围界定；接着逐项展开挑战（按技术、数据、系统、业务、伦理/社会、治理/政策、未来趋势）；最后做一个总结与展望。

---

## 一、定义与范围界定

在深入探讨挑战之前，先明确本文所说的“智能体”含义、应用场景，并界定讨论范围。

### 1. 智能体的定义

智能体（AI Agent）在这里指的是：能够在一定环境中 **自主地** 接受任务、理解目标、规划步骤、调用工具或系统接口、调整策略并执行任务的 AI 系统。与传统的“助手”或“模型”相比，智能体更多具备 **主动性**、**执行性**、**跨系统交互能力**。例如，一款智能客服机器人不仅回答问题，还能自主调度系统工单、跟进进度、协调相关人员。([IBM][1])

### 2. 应用场景

智能体的应用正在迅速扩展，涵盖但不限于：

* 企业业务流程自动化（客服、销售跟进、合同管理）
* 供应链优化、自动调度、库存管理  ([reworked.co][2])
* 企业内部知识库问答、文档生成、代码辅助、运维监控
* 消费者产品中的智能助理、家居控制、个性化推荐
* 多智能体系统与协作平台（多个智能体互通、协作）

### 3. 讨论范围

本文重点聚焦“未来可规模化部署”的智能体系统所面临挑战，而不仅限于原型或研究阶段。我们关注技术成熟度、商业化／应用化、治理与社会层面的问题。

`;

const currentContent = ref("");

// 模拟流式输入
const startStreaming = async () => {
  if (isStreaming.value) return;

  isStreaming.value = true;
  currentContent.value = "";
  rendererRef.value?.clear();

  // 模拟网络流式传输 - 更小的chunk和更短的延迟实现丝滑效果
  const chunkSize = 10; // 减小chunk大小，实现更细粒度的流式输出
  for (let i = 0; i < sampleMarkdown.length; i += chunkSize) {
    if (!isStreaming.value) break;

    const chunk = sampleMarkdown.slice(i, i + chunkSize);
    await rendererRef.value?.append(chunk);

    // 减少延迟，实现丝滑的打字机效果
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  await rendererRef.value?.finish();
  isStreaming.value = false;
};

// 停止流式输入
const stopStreaming = () => {
  isStreaming.value = false;
};

// 清空内容
const clearContent = () => {
  rendererRef.value?.clear();
  currentContent.value = "";
};

// 性能指标回调
const handleMetrics = (metrics: PerformanceMetrics) => {
  console.log("Performance Metrics:", metrics);
};
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
          {{ isStreaming ? "流式渲染中..." : "开始流式渲染" }}
        </button>
        <button
          @click="stopStreaming"
          :disabled="!isStreaming"
          class="btn btn-secondary"
        >
          停止
        </button>
        <button @click="clearContent" class="btn btn-secondary">清空</button>
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
        <a href="https://github.com" target="_blank">GitHub</a> | Vue 3 +
        TypeScript
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
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

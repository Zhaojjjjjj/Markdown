<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

/**
 * 虚拟滚动组件
 * 只渲染可视区域内的内容，大幅减少DOM节点数量
 */

interface Props {
  items: any[]
  itemHeight?: number
  bufferSize?: number
  containerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 100,
  bufferSize: 5,
  containerHeight: 600
})

const emit = defineEmits<{
  (e: 'visible-change', indices: { start: number; end: number }): void
}>()

const scrollTop = ref(0)
const containerRef = ref<HTMLElement>()

// 计算可视区域
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  const end = start + visibleCount

  // 添加缓冲区
  const bufferedStart = Math.max(0, start - props.bufferSize)
  const bufferedEnd = Math.min(props.items.length, end + props.bufferSize)

  return { start: bufferedStart, end: bufferedEnd }
})

// 可见项
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end).map((item, index) => ({
    item,
    index: start + index
  }))
})

// 总高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 偏移量
const offsetY = computed(() => visibleRange.value.start * props.itemHeight)

// 滚动处理
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// 监听可视范围变化
watch(visibleRange, (newRange) => {
  emit('visible-change', newRange)
}, { deep: true })

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<template>
  <div 
    ref="containerRef"
    class="virtual-scroller"
    :style="{ height: `${containerHeight}px`, overflow: 'auto' }"
  >
    <div 
      class="virtual-scroller-phantom"
      :style="{ height: `${totalHeight}px` }"
    >
      <div 
        class="virtual-scroller-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="{ item, index } in visibleItems"
          :key="index"
          class="virtual-scroller-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-scroller {
  position: relative;
  will-change: scroll-position;
}

.virtual-scroller-phantom {
  position: relative;
}

.virtual-scroller-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-scroller-item {
  overflow: hidden;
}
</style>

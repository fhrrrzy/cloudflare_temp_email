<template>
  <span>
    {{ displayText }}
    <span class="cursor-pulse">{{ cursor }}</span>
  </span>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  text: {
    type: [String, Array],
    required: true
  },
  speed: {
    type: Number,
    default: 100
  },
  cursor: {
    type: String,
    default: '|'
  },
  loop: {
    type: Boolean,
    default: false
  },
  deleteSpeed: {
    type: Number,
    default: 50
  },
  delay: {
    type: Number,
    default: 1500
  }
})

const displayText = ref('')
const currentIndex = ref(0)
const isDeleting = ref(false)
const textArrayIndex = ref(0)
let timeoutId = null

const textArray = computed(() => {
  return Array.isArray(props.text) ? props.text : [props.text]
})

const currentText = computed(() => {
  return textArray.value[textArrayIndex.value] || ''
})

const tick = () => {
  if (!currentText.value) return

  let delayTime = isDeleting.value ? props.deleteSpeed : props.speed

  if (!isDeleting.value) {
    if (currentIndex.value < currentText.value.length) {
      displayText.value += currentText.value[currentIndex.value]
      currentIndex.value += 1
    } else if (props.loop) {
      delayTime = props.delay
      timeoutId = setTimeout(() => {
        isDeleting.value = true
        tick()
      }, delayTime)
      return
    }
  } else {
    if (displayText.value.length > 0) {
      displayText.value = displayText.value.slice(0, -1)
    } else {
      isDeleting.value = false
      currentIndex.value = 0
      textArrayIndex.value = (textArrayIndex.value + 1) % textArray.value.length
    }
  }

  timeoutId = setTimeout(tick, delayTime)
}

watch(
  () => props.text,
  () => {
    if (timeoutId) clearTimeout(timeoutId)
    displayText.value = ''
    currentIndex.value = 0
    isDeleting.value = false
    textArrayIndex.value = 0
    tick()
  },
  { immediate: true }
)

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.cursor-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  color: var(--primary-color, #10b981);
  font-weight: bold;
}
</style>

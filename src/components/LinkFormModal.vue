<script setup>
import { App as AntApp } from 'ant-design-vue'
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  linkForm: { type: Object, required: true },
  linkRules: { type: Object, default: () => ({}) },
  formLayout: { type: Object, default: () => ({}) },
  menus: { type: Array, default: () => [] },
  tagOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'submit'])
const linkFormRef = ref(null)
const quickPasteFocused = ref(false)
const quickPasteText = ref('')
const quickPasteInputRef = ref(null)
const { message } = AntApp.useApp()

watch(
  () => props.open,
  (open) => {
    if (!open) {
      quickPasteFocused.value = false
      quickPasteText.value = ''
    }
  },
)

const handleCancel = () => emit('update:open', false)

function focusQuickPaste() {
  quickPasteFocused.value = true
  nextTick(() => quickPasteInputRef.value?.focus?.())
}

function extractUrl(value) {
  const match = value.match(/(?:https?:\/\/|www\.)[^\s<>]+/i)
  if (!match) return ''
  return match[0].replace(/[，。！？、；：）】）》]+$/u, '')
}

function getTitleFromPaste(value, url) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== url && line.replace(/^https?:\/\//i, '') !== url.replace(/^https?:\/\//i, ''))
    .join(' ')
}

function recognizeQuickPaste(text) {
  const value = text?.trim()
  if (!value) return false
  const pastedUrl = extractUrl(value)
  if (!pastedUrl) return false

  const url = pastedUrl.startsWith('www.') ? `https://${pastedUrl}` : pastedUrl
  props.linkForm.url = url
  const pastedTitle = getTitleFromPaste(value, pastedUrl)
  if (pastedTitle) {
    props.linkForm.title = pastedTitle
  } else if (!props.linkForm.title.trim()) {
    try {
      props.linkForm.title = new URL(url).hostname.replace(/^www\./i, '')
    } catch {
      // URL 解析失败时保留标题为空，让表单校验提示用户补充。
    }
  }
  message?.success?.('已识别链接和标题')
  return true
}

function handleQuickPaste(event) {
  const text = event.clipboardData?.getData('text/plain')?.trim()
  if (!text || !extractUrl(text)) return
  event.preventDefault()
  quickPasteText.value = text
  recognizeQuickPaste(text)
}

function handleQuickPasteBlur() {
  if (!quickPasteText.value.trim()) {
    quickPasteFocused.value = false
  }
}

async function handleOk() {
  try {
    await linkFormRef.value?.validate()
    emit('submit')
  } catch (err) {
    message?.error?.('请完善必填项')
  }
}

defineExpose({ validate: () => linkFormRef.value?.validate() })
</script>

<template>
  <a-modal
    class="form-modal form-modal--link"
    :open="open"
    :title="title"
    :mask-closable="false"
    ok-text="保存"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="linkFormRef"
      :model="linkForm"
      :rules="linkRules"
      layout="horizontal"
      :label-col="formLayout.labelCol"
      :wrapper-col="formLayout.wrapperCol"
      :label-align="formLayout.labelAlign"
    >
      <a-form-item label="标题" name="title">
        <a-input v-model:value="linkForm.title" placeholder="展示的名称" />
      </a-form-item>
      <a-form-item label="链接" name="url">
        <a-input v-model:value="linkForm.url" placeholder="https://" />
      </a-form-item>
      <a-form-item label="所属菜单" name="menuId">
        <a-select
          v-model:value="linkForm.menuId"
          show-search
          option-filter-prop="label"
          placeholder="选择菜单"
        >
          <a-select-option v-for="menu in menus" :key="menu.id" :value="menu.id" :label="menu.name">
            {{ menu.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="标签">
        <a-select
          v-model:value="linkForm.tags"
          mode="multiple"
          :show-arrow="true"
          placeholder="选择标签"
          :options="tagOptions.map((tag) => ({ label: tag, value: tag }))"
        />
      </a-form-item>
      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="linkForm.description"
          rows="2"
          placeholder="一句话介绍用途"
          :maxlength="100"
          show-count
        />
      </a-form-item>
      <a-form-item label="快捷识别">
        <a-input
          v-if="!quickPasteFocused"
          v-model:value="quickPasteText"
          placeholder="粘贴文本，智能识别链接信息"
          @focus="focusQuickPaste"
        />
        <a-textarea
          v-else
          ref="quickPasteInputRef"
          v-model:value="quickPasteText"
          rows="2"
          placeholder="粘贴文本，智能识别链接信息"
          :maxlength="100"
          show-count
          @paste="handleQuickPaste"
          @blur="handleQuickPasteBlur"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

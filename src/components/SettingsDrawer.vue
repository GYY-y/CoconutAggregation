<script setup>
import { ref } from 'vue'
import { DeleteOutlined, ExportOutlined, ImportOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons-vue'
import auroraBackground from '../assets/backgrounds/aurora.svg'
import forestBackground from '../assets/backgrounds/forest.svg'
import sandBackground from '../assets/backgrounds/sand.svg'

const defaultContentBackground = '#fcfcfc'
const recommendedBackgrounds = [
  { id: 'aurora', label: '极光夜色', src: auroraBackground },
  { id: 'sand', label: '暖沙薄荷', src: sandBackground },
  { id: 'forest', label: '森林湖光', src: forestBackground },
]

const props = defineProps({
  open: { type: Boolean, default: false },
  formLayout: { type: Object, default: () => ({}) },
  settings: { type: Object, required: true },
  themeValue: { type: [String, Number], default: 'system' },
})

const emit = defineEmits(['update:open', 'update:themeValue', 'export', 'import', 'clear'])
const backgroundInput = ref(null)

const triggerBackgroundUpload = () => {
  backgroundInput.value?.click()
}

const handleBackgroundUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      // 保留更高分辨率和更高 JPEG 质量，避免在 0 模糊度时仍显得发虚。
      const maxSize = 2400
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.86)
      const images = Array.isArray(props.settings.backgroundImages) ? props.settings.backgroundImages : []
      props.settings.backgroundImages = images.includes(dataUrl) ? images : [...images, dataUrl]
      props.settings.backgroundImage = dataUrl
      props.settings.backgroundMode = 'image'
    }
    image.src = reader.result
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const clearCustomBackground = () => {
  const selected = props.settings.backgroundImage
  props.settings.backgroundImages = []
  if (selected && !recommendedBackgrounds.some((item) => item.src === selected)) {
    props.settings.backgroundImage = ''
    props.settings.backgroundMode = 'color'
  }
}

const selectBackground = (image) => {
  props.settings.backgroundImage = image
  props.settings.backgroundMode = 'image'
}

const selectRecommendedBackground = (image) => {
  selectBackground(image)
}

const removeBackgroundImage = (image) => {
  const images = (props.settings.backgroundImages || []).filter((item) => item !== image)
  props.settings.backgroundImages = images
  if (props.settings.backgroundImage === image) {
    props.settings.backgroundImage = images[0] || ''
  }
  if (!props.settings.backgroundImage) props.settings.backgroundMode = 'color'
}

const resetContentBackground = () => {
  props.settings.contentBackground = defaultContentBackground
}
</script>

<template>
  <a-drawer
    :open="open"
    title="设置"
    placement="right"
    :width="'40%'"
    :closable="true"
    @close="emit('update:open', false)"
  >
    <a-form
      layout="horizontal"
      class="drawer-form"
      :label-col="formLayout.labelCol"
      :wrapper-col="formLayout.wrapperCol"
      :label-align="formLayout.labelAlign"
    >
      <a-form-item label="主题模式">
        <a-select :value="themeValue" @update:value="emit('update:themeValue', $event)">
          <a-select-option value="light">明亮</a-select-option>
          <a-select-option value="dark">暗色</a-select-option>
          <a-select-option value="system">跟随系统</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="卡片列数">
        <a-slider v-model:value="settings.columns" :min="2" :max="5" />
      </a-form-item>
      <a-form-item label="紧凑布局">
        <a-checkbox v-model:checked="settings.dense" />
      </a-form-item>
      <a-form-item label="显示链接描述">
        <a-checkbox v-model:checked="settings.showDescription" />
      </a-form-item>
      <a-form-item label="显示链接数量">
        <a-checkbox v-model:checked="settings.showMenuCount" />
      </a-form-item>
      <a-form-item label="数据管理">
        <a-space>
          <a-button size="middle" @click="emit('export')"><ExportOutlined />导出配置</a-button>
          <a-button size="middle" @click="emit('import')"><ImportOutlined />导入配置</a-button>
          <a-button size="middle" danger ghost @click="emit('clear')">清除缓存</a-button>
        </a-space>
      </a-form-item>
      <a-form-item class="storage-warning-item" :wrapper-col="formLayout.wrapperCol">
        <a-alert
          class="storage-warning"
          type="warning"
          show-icon
          message="数据保存在当前浏览器"
          description="清理浏览器缓存前，请先导出配置。浏览器无法在网页未打开时通知本站，因此导出文件是最可靠的备份方式。"
        />
      </a-form-item>
      <a-form-item class="background-form-item" :wrapper-col="{ span: 24 }">
        <a-tabs v-model:active-key="settings.backgroundMode" class="background-tabs">
          <a-tab-pane key="color" tab="内容背景色">
            <div class="color-setting">
              <input v-model="settings.contentBackground" type="color" aria-label="选择内容背景色" />
              <span>{{ settings.contentBackground }}</span>
              <a-tooltip title="恢复默认背景色">
                <a-button class="reset-color-btn" size="small" aria-label="恢复默认背景色" @click="resetContentBackground">
                  <ReloadOutlined />
                  <span>恢复默认</span>
                </a-button>
              </a-tooltip>
            </div>
          </a-tab-pane>
          <a-tab-pane key="image" tab="页面背景图">
            <div class="background-section">
              <div class="background-section__header">
                <div>
                  <strong>推荐背景</strong>
                  <span>选择一张内置背景，立即应用</span>
                </div>
              </div>
              <div class="background-gallery background-gallery--recommended" aria-label="推荐背景">
                <div
                  v-for="background in recommendedBackgrounds"
                  :key="background.id"
                  class="background-thumb"
                  :class="{ 'background-thumb--active': background.src === settings.backgroundImage }"
                >
                  <button class="background-thumb__select" type="button" :aria-label="`使用${background.label}`" @click="selectRecommendedBackground(background.src)">
                    <img :src="background.src" :alt="background.label" />
                    <span class="background-thumb__name">{{ background.label }}</span>
                    <span v-if="background.src === settings.backgroundImage" class="background-thumb__badge">使用中</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="background-section background-section--custom">
              <div class="background-section__header">
                <div>
                  <strong>自定义背景</strong>
                  <span>上传并管理你自己的背景图片</span>
                </div>
              </div>
            <div class="background-setting">
              <input ref="backgroundInput" class="background-file-input" type="file" accept="image/*" aria-label="上传页面背景图" @change="handleBackgroundUpload" />
              <a-button size="middle" @click="triggerBackgroundUpload"><UploadOutlined />上传一张图片</a-button>
              <a-button v-if="settings.backgroundImages?.length" size="middle" @click="clearCustomBackground"><DeleteOutlined />清空图片</a-button>
              <span v-else class="background-setting__hint">可上传多张，每次上传一张</span>
            </div>
            <div v-if="settings.backgroundImages?.length" class="background-gallery background-gallery--custom" aria-label="已上传的页面背景图">
              <div
                v-for="(image, index) in settings.backgroundImages"
                :key="`${image.slice(-24)}-${index}`"
                class="background-thumb"
                :class="{ 'background-thumb--active': image === settings.backgroundImage }"
              >
                <button class="background-thumb__select" type="button" :aria-label="`使用第 ${index + 1} 张背景图`" @click="selectBackground(image)">
                  <img :src="image" :alt="`背景图 ${index + 1}`" />
                  <span v-if="image === settings.backgroundImage" class="background-thumb__badge">使用中</span>
                </button>
                <button class="background-thumb__remove" type="button" :aria-label="`删除第 ${index + 1} 张背景图`" @click="removeBackgroundImage(image)">×</button>
              </div>
            </div>
            </div>
            <div v-if="settings.backgroundImage" class="slider-setting">
              <span class="slider-setting__label">模糊度</span>
              <a-slider v-model:value="settings.backgroundBlur" :min="0" :max="20" :step="1" />
              <span>{{ settings.backgroundBlur }}</span>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<style scoped>
.color-setting {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.storage-warning {
  margin-bottom: 0;
}

.storage-warning-item {
  margin-top: -8px;
}

.background-form-item :deep(.ant-form-item-control) {
  min-width: 0;
}

.background-form-item :deep(.ant-form-item-row) {
  flex-wrap: nowrap;
  align-items: flex-start;
}

.background-form-item :deep(.ant-form-item-control-input-content),
.background-form-item :deep(.background-tabs) {
  width: 100%;
}

.color-setting input {
  width: 36px;
  height: 30px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.color-setting span {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

.color-setting :deep(.ant-btn) {
  color: var(--muted);
}

.color-setting :deep(.ant-btn:hover) {
  color: var(--text);
  background: var(--surface-alt);
}

.reset-color-btn {
  color: var(--muted);
}

.reset-color-btn :deep(.anticon) {
  font-size: 12px;
}

.background-setting {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.background-setting input {
  color: var(--muted);
  font-size: 12px;
}

.background-setting .background-file-input {
  display: none;
}

.background-setting__hint {
  color: var(--muted);
  font-size: 12px;
}

.background-section {
  margin-top: 2px;
}

.background-section--custom {
  margin-top: 22px;
}

.background-section__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.background-section__header div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.background-section__header strong {
  color: var(--text);
  font-size: 13px;
}

.background-section__header span {
  color: var(--muted);
  font-size: 12px;
}

.background-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 10px;
  margin-top: 14px;
  max-height: 240px;
  padding: 2px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.background-gallery--recommended {
  max-height: none;
  margin-top: 0;
  overflow: visible;
}

.background-gallery--custom {
  margin-top: 14px;
}

.background-thumb {
  position: relative;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-alt);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.background-thumb:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
}

.background-thumb--active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 24%, transparent);
}

.background-thumb__select {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.background-thumb__select img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.background-thumb__badge {
  position: absolute;
  right: 5px;
  bottom: 5px;
  padding: 2px 5px;
  border-radius: 5px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  line-height: 1.2;
}

.background-thumb__name {
  display: block;
  padding: 6px 8px 7px;
  color: var(--text);
  font-size: 11px;
  text-align: left;
}

.background-thumb__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: 16px;
  line-height: 20px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 160ms ease, background-color 160ms ease;
}

.background-thumb:hover .background-thumb__remove,
.background-thumb__remove:focus-visible {
  opacity: 1;
}

.background-thumb__remove:hover {
  background: #d9363e;
}

.slider-setting {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.slider-setting__label {
  color: var(--muted);
  font-size: 12px;
}

.slider-setting :deep(.ant-slider) {
  flex: 1;
  min-width: 120px;
}

.slider-setting span {
  min-width: 36px;
  color: var(--muted);
  font-size: 12px;
  text-align: right;
}
</style>

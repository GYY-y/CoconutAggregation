export const CONFIG_VERSION = 1

const validThemes = new Set(['light', 'dark', 'system'])

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

export function normalizeImportedConfig(input, defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('配置必须是对象')
  if (!Array.isArray(input.menus) || !Array.isArray(input.links)) throw new Error('配置缺少菜单或链接列表')

  const menus = []
  const menuIds = new Set()
  input.menus.forEach((item) => {
    const id = cleanText(item?.id)
    if (!id || id === '__home__' || id === '__about__' || menuIds.has(id)) return
    menuIds.add(id)
    menus.push({ id, name: cleanText(item?.name).slice(0, 4) || '未命名', icon: cleanText(item?.icon, 'AppstoreOutlined') })
  })

  const links = []
  const linkIds = new Set()
  input.links.forEach((item, index) => {
    const id = cleanText(item?.id) || `imported-${index + 1}`
    const title = cleanText(item?.title)
    const url = cleanText(item?.url)
    const menuId = cleanText(item?.menuId)
    if (!title || !url || !menuIds.has(menuId) || linkIds.has(id)) return
    linkIds.add(id)
    links.push({
      id,
      menuId,
      title,
      url,
      description: cleanText(item?.description).slice(0, 100),
      tags: Array.isArray(item?.tags) ? [...new Set(item.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))] : [],
      favorite: item?.favorite === true,
    })
  })

  const settings = { ...defaults, ...(input.settings || {}) }
  settings.theme = validThemes.has(settings.theme) ? settings.theme : 'system'
  settings.columns = Math.min(6, Math.max(2, Number(settings.columns) || defaults.columns))
  settings.backgroundImages = Array.isArray(settings.backgroundImages) ? settings.backgroundImages.filter((image) => typeof image === 'string' && image) : []
  return {
    version: CONFIG_VERSION,
    menus,
    links,
    settings,
    activeMenuId: menuIds.has(input.activeMenuId) ? input.activeMenuId : '__home__',
  }
}

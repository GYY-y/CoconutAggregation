import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeImportedConfig } from '../src/utils/config.js'

const defaults = { theme: 'system', columns: 4, backgroundImages: [] }

test('normalizes imported config and drops invalid references', () => {
  const result = normalizeImportedConfig({
    version: 0,
    menus: [
      { id: 'tools', name: '工具', icon: 'ToolOutlined' },
      { id: 'tools', name: '重复' },
      { id: '__home__', name: '首页' },
    ],
    links: [
      { id: 'ok', menuId: 'tools', title: '文档', url: 'https://example.com', tags: ['资料', '资料'], favorite: true },
      { id: 'orphan', menuId: 'missing', title: '孤立', url: 'https://example.com' },
      { id: 'invalid', menuId: 'tools', title: '', url: 'https://example.com' },
    ],
    settings: { columns: 99, theme: 'invalid' },
    activeMenuId: 'missing',
  }, defaults)

  assert.equal(result.menus.length, 1)
  assert.equal(result.links.length, 1)
  assert.deepEqual(result.links[0].tags, ['资料'])
  assert.equal(result.links[0].favorite, true)
  assert.equal(result.settings.columns, 6)
  assert.equal(result.settings.theme, 'system')
  assert.equal(result.activeMenuId, '__home__')
})

test('rejects malformed top-level config', () => {
  assert.throws(() => normalizeImportedConfig({ menus: [] }, defaults), /菜单或链接/)
})

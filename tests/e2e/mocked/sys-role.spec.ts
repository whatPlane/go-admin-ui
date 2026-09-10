import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The role page: two dialogs on one screen, which is what the composable layer
 * was built for and what the Options API version could not express.
 */
test.describe('sys-role', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists roles', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: '系统管理员' })).toBeVisible()
  })

  test('sends paging keys with the list request', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    expect(calls.role.list).toBeGreaterThan(0)
    const sent = calls.role.listQueries.at(-1) ?? ''
    expect(sent).toContain('pageIndex=1')
    expect(sent).toContain('pageSize=')
  })

  test('deleting a row asks first, then reloads', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')
    const before = calls.role.list

    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.role.remove).toBe(1)
    await expect.poll(() => calls.role.list).toBeGreaterThan(before)
  })

  test('saving an edit reaches the update endpoint', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '修改' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '修改角色' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.role.update).toBe(1)
    await expect(dialog).toBeHidden()
  })

  // Before the migration this opened nothing at all: the dialog was gated on
  // `openDataScope` while its visibility was bound to the edit dialog's `open`,
  // which that path never set. Verified against the old page -- zero dialogs
  // reached the DOM on click.
  test('the data-scope dialog opens', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '数据权限' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '分配数据权限' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.el-form-item').filter({ hasText: '角色名称' })
      .locator('input')).toHaveValue('普通角色')
  })

  test('the department tree shows only for the custom scope', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    // 普通角色 is seeded with dataScope '2' -- the custom one
    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '数据权限' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '分配数据权限' })
    await expect(dialog.locator('.el-tree')).toBeVisible()

    // 系统管理员 is '1' -- all data, so there is nothing to pick
    await dialog.getByRole('button', { name: '取 消' }).click()
    await page.getByRole('row', { name: /系统管理员/ }).getByRole('button', { name: '数据权限' }).click()
    await expect(dialog.locator('.el-tree')).toBeHidden()
  })

  test('saving the data scope sends the ticked departments', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '数据权限' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '分配数据权限' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.extra.roleDataScope).toBe(1)
    await expect(dialog).toBeHidden()
  })

  // Two forms, two sets of state. Under the old structure they shared one.
  test('the two dialogs keep their own state', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '数据权限' }).click()
    const scope = page.getByRole('dialog').filter({ hasText: '分配数据权限' })
    await expect(scope).toBeVisible()
    await scope.getByRole('button', { name: '取 消' }).click()
    await expect(scope).toBeHidden()

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()
    const edit = page.getByRole('dialog').filter({ hasText: '添加角色' })
    await expect(edit).toBeVisible()
    await expect(edit.getByPlaceholder('请输入角色名称')).toHaveValue('')
    // The other dialog stays shut
    await expect(scope).toBeHidden()
  })

  test('editing loads the record and locks the identity fields', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /普通角色/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改角色' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入角色名称')).toHaveValue('普通角色')
    // Renaming a role or its key would orphan the permissions already granted
    await expect(dialog.getByPlaceholder('请输入角色名称')).toBeDisabled()
    await expect(dialog.getByPlaceholder('请输入权限字符')).toBeDisabled()
  })

  test('the super admin is told there is nothing to assign', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    // roleKey 'admin' holds everything implicitly
    await page.getByRole('row', { name: /系统管理员/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改角色' })
    await expect(dialog).toContainText('系统超级管理员无需此操作')
  })

  test('adding after editing admin restores the menu tree', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /系统管理员/ }).getByRole('button', { name: '修改' }).click()
    const editDialog = page.getByRole('dialog').filter({ hasText: '修改角色' })
    await expect(editDialog).toContainText('系统超级管理员无需此操作')
    await editDialog.getByRole('button', { name: '取 消' }).click()

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()
    const addDialog = page.getByRole('dialog').filter({ hasText: '添加角色' })
    await expect(addDialog).toBeVisible()
    await expect(addDialog).not.toContainText('系统超级管理员无需此操作')
    await expect(addDialog.locator('.el-tree-node')).not.toHaveCount(0)
    await expect(addDialog.locator('.el-tree-node.is-checked')).toHaveCount(0)
  })

  test('creating a role sends the default data scope', async({ page }) => {
    await installApiMocks(page)
    const bodies = await captureBodies(page, /\/api\/v1\/role(\?|$)/, 'POST')

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')
    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加角色' })
    await dialog.getByPlaceholder('请输入角色名称').fill('客服')
    await dialog.getByPlaceholder('请输入权限字符').fill('customer_service')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => bodies.length).toBe(1)
    expect(JSON.parse(bodies[0])).toMatchObject({ dataScope: '1' })
  })

  test('toggling status asks first and reverts on cancel', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table')

    const row = page.getByRole('row', { name: /普通角色/ })
    await row.locator('.el-switch').click()

    const confirm = page.locator('.el-message-box')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: '取消' }).click()

    // Put back, so the switch matches what the server still holds
    await expect(row.locator('.el-switch')).not.toHaveClass(/is-checked/)
  })
})

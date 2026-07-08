import StoreDelete from './delete.js'
import {deleteDevStore} from '../../services/store/delete/dev.js'
import {findStoreOwningOrganization} from '../../utilities/store-lookup/organization.js'
import {selectOrg} from '@shopify/organizations'
import {AbortError} from '@shopify/cli-kit/node/error'
import {outputResult} from '@shopify/cli-kit/node/output'
import {terminalSupportsPrompting} from '@shopify/cli-kit/node/system'
import {describe, expect, test, vi, beforeEach} from 'vitest'

vi.mock('../../services/store/delete/dev.js')
vi.mock('../../utilities/store-lookup/organization.js')
vi.mock('@shopify/cli-kit/node/system')

vi.mock('@shopify/organizations', () => ({
  selectOrg: vi.fn(),
}))

vi.mock('@shopify/cli-kit/node/output', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    outputResult: vi.fn(),
  }
})

const defaultOrg = {id: '12345', businessName: 'Test Org'}
const inferredOrg = {id: '67890', businessName: 'Inferred Org'}

beforeEach(() => {
  vi.mocked(selectOrg).mockResolvedValue(defaultOrg)
  vi.mocked(findStoreOwningOrganization).mockResolvedValue(inferredOrg)
  vi.mocked(terminalSupportsPrompting).mockReturnValue(true)
})

describe('store delete command', () => {
  test('resolves the organization and passes parsed flags through to the service', async () => {
    await StoreDelete.run(['--store', 'my-store.myshopify.com', '--organization-id', '12345'])

    expect(selectOrg).toHaveBeenCalledWith('12345')
    expect(deleteDevStore).toHaveBeenCalledWith({
      store: 'my-store.myshopify.com',
      organization: defaultOrg,
      json: false,
    })
  })

  test('normalizes the store flag before passing it to the service', async () => {
    await StoreDelete.run(['--store', 'my-store', '--organization-id', '12345'])

    expect(deleteDevStore).toHaveBeenCalledWith(expect.objectContaining({store: 'my-store.myshopify.com'}))
  })

  test('passes json flag through to the service', async () => {
    await StoreDelete.run(['--store', 'my-store.myshopify.com', '--json', '--organization-id', '12345'])

    expect(deleteDevStore).toHaveBeenCalledWith({
      store: 'my-store.myshopify.com',
      organization: defaultOrg,
      json: true,
    })
  })

  test('infers the organization from the store when --organization-id is omitted', async () => {
    await StoreDelete.run(['--store', 'my-store.myshopify.com'])

    expect(findStoreOwningOrganization).toHaveBeenCalledWith({store: 'my-store.myshopify.com', noPrompt: false})
    expect(selectOrg).not.toHaveBeenCalled()
    expect(deleteDevStore).toHaveBeenCalledWith(expect.objectContaining({organization: inferredOrg}))
  })

  test('falls back to prompting for the organization when store ownership cannot be inferred interactively', async () => {
    vi.mocked(findStoreOwningOrganization).mockResolvedValueOnce(undefined)

    await StoreDelete.run(['--store', 'my-store.myshopify.com'])

    expect(selectOrg).toHaveBeenCalledWith()
    expect(deleteDevStore).toHaveBeenCalledWith(expect.objectContaining({organization: defaultOrg}))
  })

  test('does not require --organization-id non-interactively when store ownership can be inferred', async () => {
    vi.mocked(terminalSupportsPrompting).mockReturnValue(false)

    await StoreDelete.run(['--store', 'my-store.myshopify.com'])

    expect(findStoreOwningOrganization).toHaveBeenCalledWith({store: 'my-store.myshopify.com', noPrompt: true})
    expect(selectOrg).not.toHaveBeenCalled()
    expect(deleteDevStore).toHaveBeenCalledWith(expect.objectContaining({organization: inferredOrg}))
  })

  test('fails in a non-interactive environment when store ownership cannot be inferred and --organization-id is missing', async () => {
    vi.mocked(terminalSupportsPrompting).mockReturnValue(false)
    vi.mocked(findStoreOwningOrganization).mockResolvedValueOnce(undefined)
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)

    await expect(StoreDelete.run(['--store', 'my-store.myshopify.com'])).rejects.toThrow('process.exit')
    expect(selectOrg).not.toHaveBeenCalled()
    expect(deleteDevStore).not.toHaveBeenCalled()
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('defines the expected flags', () => {
    expect(StoreDelete.flags.store).toBeDefined()
    expect(StoreDelete.flags['organization-id']).toBeDefined()
    expect(StoreDelete.flags.json).toBeDefined()
  })

  test('outputs structured JSON error when --json is active and service throws AbortError', async () => {
    vi.mocked(deleteDevStore).mockRejectedValueOnce(new AbortError('Something went wrong'))
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)

    await expect(
      StoreDelete.run(['--store', 'my-store.myshopify.com', '--organization-id', '12345', '--json']),
    ).rejects.toThrow('process.exit')

    const call = vi.mocked(outputResult).mock.calls[0]![0] as string
    const parsed = JSON.parse(call)
    expect(parsed).toEqual({
      error: true,
      message: 'Something went wrong',
      nextSteps: [],
      exitCode: 1,
    })
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('does not output JSON for non-AbortError even when --json is active', async () => {
    vi.mocked(deleteDevStore).mockRejectedValueOnce(new Error('unexpected'))

    await expect(
      StoreDelete.run(['--store', 'my-store.myshopify.com', '--organization-id', '12345', '--json']),
    ).rejects.toThrow()
    expect(vi.mocked(outputResult)).not.toHaveBeenCalled()
  })

  test('does not output JSON for AbortError when --json is not active', async () => {
    vi.mocked(deleteDevStore).mockRejectedValueOnce(new AbortError('Something went wrong'))

    await expect(StoreDelete.run(['--store', 'my-store.myshopify.com', '--organization-id', '12345'])).rejects.toThrow()
    expect(vi.mocked(outputResult)).not.toHaveBeenCalled()
  })
})

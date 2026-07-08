import {findStoreOwningOrganization} from './organization.js'
import {fetchDestinationsContext} from './destinations.js'
import {describe, expect, test, vi} from 'vitest'

vi.mock('./destinations.js')

const STORE = 'shop.myshopify.com'

describe('findStoreOwningOrganization', () => {
  test('maps the destination owning org into an organizations package Organization', async () => {
    vi.mocked(fetchDestinationsContext).mockResolvedValue({owningOrg: {id: '1234', name: 'Acme'}})

    const organization = await findStoreOwningOrganization({store: STORE, noPrompt: true})

    expect(fetchDestinationsContext).toHaveBeenCalledWith({store: STORE, noPrompt: true})
    expect(organization).toEqual({id: '1234', businessName: 'Acme'})
  })

  test('returns undefined when the destination lookup cannot resolve an org id', async () => {
    vi.mocked(fetchDestinationsContext).mockResolvedValue({owningOrg: {name: 'Acme'}})

    await expect(findStoreOwningOrganization({store: STORE})).resolves.toBeUndefined()
  })

  test('returns undefined when the destination lookup fails', async () => {
    vi.mocked(fetchDestinationsContext).mockRejectedValue(new Error('not found'))

    await expect(findStoreOwningOrganization({store: STORE})).resolves.toBeUndefined()
  })
})

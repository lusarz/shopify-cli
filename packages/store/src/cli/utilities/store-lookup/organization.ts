import {fetchDestinationsContext} from './destinations.js'
import {outputDebug} from '@shopify/cli-kit/node/output'
import type {Organization} from '@shopify/organizations'

interface FindStoreOwningOrganizationOptions {
  store: string
  token?: string
  noPrompt?: boolean
}

export async function findStoreOwningOrganization(
  options: FindStoreOwningOrganizationOptions,
): Promise<Organization | undefined> {
  const {store} = options

  try {
    const destinationsContext = await fetchDestinationsContext(options)
    const owningOrganization = destinationsContext.owningOrg

    if (!owningOrganization?.id) {
      outputDebug(`Could not infer an owning organization ID for ${store}.`)
      return undefined
    }

    return {id: owningOrganization.id, businessName: owningOrganization.name}
    // eslint-disable-next-line no-catch-all/no-catch-all
  } catch (error) {
    outputDebug(`Could not infer the owning organization for ${store}: ${errorMessage(error)}`)
    return undefined
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

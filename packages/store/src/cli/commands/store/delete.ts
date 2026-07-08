import {deleteDevStore} from '../../services/store/delete/dev.js'
import {storeFlags} from '../../flags.js'
import {findStoreOwningOrganization} from '../../utilities/store-lookup/organization.js'
import {selectOrg, type Organization} from '@shopify/organizations'
import Command from '@shopify/cli-kit/node/base-command'
import {globalFlags, jsonFlag} from '@shopify/cli-kit/node/cli'
import {AbortError} from '@shopify/cli-kit/node/error'
import {outputResult} from '@shopify/cli-kit/node/output'
import {terminalSupportsPrompting} from '@shopify/cli-kit/node/system'

export default class StoreDelete extends Command {
  static hidden = true

  static summary = 'Delete a development store.'

  static descriptionWithMarkdown = 'Deletes a development store from your organization.'

  static description = this.descriptionWithoutMarkdown()

  static examples = [
    '<%= config.bin %> <%= command.id %> --store shop.myshopify.com --organization-id 1234567',
    '<%= config.bin %> <%= command.id %> --store shop.myshopify.com --organization-id 1234567 --json',
  ]

  static flags = {
    ...globalFlags,
    ...jsonFlag,
    store: storeFlags.store,
    'organization-id': storeFlags['organization-id'],
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(StoreDelete)
    this.failMissingNonTTYFlags(flags, ['store'])

    const organization = await organizationForStoreDeletion(flags.store, flags['organization-id']?.toString())

    try {
      await deleteDevStore({
        store: flags.store,
        organization,
        json: flags.json,
      })
    } catch (error) {
      if (flags.json && error instanceof AbortError) {
        outputResult(
          JSON.stringify(
            {
              error: true,
              message: error.message,
              nextSteps: error.nextSteps ?? [],
              exitCode: 1,
            },
            null,
            2,
          ),
        )
        process.exit(1)
      }
      throw error
    }
  }
}

async function organizationForStoreDeletion(store: string, organizationId?: string): Promise<Organization> {
  if (organizationId) {
    return selectOrg(organizationId)
  }

  const canPrompt = terminalSupportsPrompting()
  const owningOrganization = await findStoreOwningOrganization({store, noPrompt: !canPrompt})
  if (owningOrganization) {
    return owningOrganization
  }

  if (!canPrompt) {
    throw new AbortError(
      `Could not determine which organization owns ${store}.`,
      'Provide `--organization-id`, for example `--organization-id 1234567`. Run `shopify organization list` to find IDs.',
    )
  }

  return selectOrg()
}

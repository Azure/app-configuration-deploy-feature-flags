import * as core from '@actions/core'
import { getActionInput } from './input'
import { loadConfigFiles, validateConfigs } from './config-loader'
import { updateFeatureFlags } from './update-feature-flags'

export async function run(): Promise<void> {
  try {
    const input = getActionInput()
    const config = await loadConfigFiles(input.configFile)
    validateConfigs(config)

    core.info('Configuration loaded')

    if (input.operation === 'deploy') {
      await updateFeatureFlags(input, config)
      core.info('Feature flags updated successfully')
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

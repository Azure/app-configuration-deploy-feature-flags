import { run } from '../src/main'
import * as core from '@actions/core'
import { getActionInput } from '../src/input'
import { loadConfigFiles } from '../src/config-loader'
import { updateFeatureFlags } from '../src/update-feature-flags'
import { FeatureFlag } from '../src/models/feature-flag.models'

jest.mock('@actions/core')
jest.mock('../src/input')
jest.mock('../src/config-loader')
jest.mock('../src/update-feature-flags')

describe('run', () => {
  const mockInput = {
    configFile: 'config.json',
    operation: 'deploy'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should load config and update feature flags successfully', async () => {
    ;(getActionInput as jest.Mock).mockReturnValue(mockInput)
    const flags: FeatureFlag[] = [
      getDummyFeatureFlagItem('flag1'),
      getDummyFeatureFlagItem('flag2')
    ]
    ;(loadConfigFiles as jest.Mock).mockResolvedValue(flags)
    ;(updateFeatureFlags as jest.Mock).mockResolvedValue(undefined)

    await run()

    expect(getActionInput).toHaveBeenCalled()
    expect(loadConfigFiles).toHaveBeenCalledWith(mockInput.configFile)
    expect(core.info).toHaveBeenCalledWith('Configuration loaded')
    expect(core.info).toHaveBeenCalledWith('Feature flags updated successfully')
  })

  it('error case', async () => {
    const mockError = new Error()
    ;(getActionInput as jest.Mock).mockReturnValue(mockInput)
    ;(loadConfigFiles as jest.Mock).mockRejectedValue(mockError)

    await run()

    expect(core.setFailed).toHaveBeenCalledTimes(1)
  })

  const getDummyFeatureFlagItem = (id: string) => ({
    id: id,
    enabled: false,
    variants: [
      {
        name: 'Off',
        configuration_value: false
      },
      {
        name: 'On',
        configuration_value: true
      }
    ],
    allocation: {
      percentile: [
        {
          variant: 'Off',
          from: 0,
          to: 100
        }
      ],
      default_when_enabled: 'Off',
      default_when_disabled: 'Off'
    },
    telemetry: {
      enabled: true
    }
  })
})

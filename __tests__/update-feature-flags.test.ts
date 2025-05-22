// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as core from '@actions/core'
import { Input } from '../src/models/models'
import { FeatureListResponse } from '../src/models/api-response.models'
import {
  createOrUpdateFeatureFlag,
  deleteFeatureFlag,
  listFeatureFlags
} from '../src/feature-flag-client'
import { updateFeatureFlags } from '../src/update-feature-flags'

jest.mock('@actions/core')
jest.mock('../src/feature-flag-client')

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let infoMock: jest.SpiedFunction<typeof core.info>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

describe('updateFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    infoMock = jest.spyOn(core, 'info').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  it('update feature flags should update feature flags', async () => {
    const input = getDummyInput()
    const configs = [
      getDummyFeatureFlagItem('featureFlagId1'),
      getDummyFeatureFlagItem('featureFlagId2')
    ]
    const existingFeatureListResponse: FeatureListResponse = {
      etag: 'etag',
      items: [getDummyFeatureFlagResponse('featureFlagId1')]
    }
    ;(listFeatureFlags as jest.Mock).mockResolvedValue(
      existingFeatureListResponse
    )

    await updateFeatureFlags(input, configs)

    expect(createOrUpdateFeatureFlag).toHaveBeenCalledTimes(1)
    expect(createOrUpdateFeatureFlag).toHaveBeenCalledWith(
      input.appConfigEndpoint,
      'featureFlagId2',
      configs[1],
      'test-label'
    )
    expect(infoMock).toHaveBeenCalledWith('Updated 1 feature flags')
  })

  it('update feature flags should update feature flags in strict mode and delete remanining flags', async () => {
    const input = { ...getDummyInput(), strictSync: true }
    const configs = [
      getDummyFeatureFlagItem('featureFlagId1'),
      getDummyFeatureFlagItem('featureFlagId2')
    ]
    const existingFeatureListResponse: FeatureListResponse = {
      etag: 'etag',
      items: [
        getDummyFeatureFlagResponse('featureFlagId1'),
        getDummyFeatureFlagResponse('featureFlagId3')
      ]
    }
    ;(listFeatureFlags as jest.Mock).mockResolvedValue(
      existingFeatureListResponse
    )

    await updateFeatureFlags(input, configs)

    expect(createOrUpdateFeatureFlag).toHaveBeenCalledTimes(1)
    expect(createOrUpdateFeatureFlag).toHaveBeenCalledWith(
      input.appConfigEndpoint,
      'featureFlagId2',
      configs[1],
      'test-label'
    )
    expect(infoMock).toHaveBeenCalledWith('Updated 1 feature flags')
    expect(infoMock).toHaveBeenCalledWith(
      'Strict sync enabled. Deleting flags that are not in the config'
    )
    expect(deleteFeatureFlag).toHaveBeenCalledTimes(1)
    expect(deleteFeatureFlag).toHaveBeenCalledWith(
      input.appConfigEndpoint,
      'featureFlagId3',
      'test-label'
    )
  })

  const getDummyInput = (): Input => {
    return {
      configFile: 'configFile',
      strictSync: false,
      appConfigEndpoint: 'https://example.com',
      operation: 'deploy',
      label: 'test-label'
    }
  }

  const getDummyFeatureFlagResponse = (id: string) => ({
    key: `.appconfig.featureflag/${id}`,
    content_type: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8',
    value: JSON.stringify(getDummyFeatureFlagItem(id))
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
  const featureListResponse: FeatureListResponse = {
    etag: 'etag',
    items: [
      {
        key: '.appconfig.featureflag/featureFlagId1',
        content_type:
          'application/vnd.microsoft.appconfig.ff+json;charset=utf-8',
        value: JSON.stringify(getDummyFeatureFlagItem('featureFlagId1'))
      }
    ]
  }
})

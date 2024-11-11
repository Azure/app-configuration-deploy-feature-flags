import axios from 'axios'
import { DefaultAzureCredential } from '@azure/identity'
import {
  createOrUpdateFeatureFlag,
  deleteFeatureFlag,
  listFeatureFlags
} from '../src/feature-flag-client'
import { FeatureListResponse } from '../src/models/api-response.models'
import { ApiError } from '../src/errors'

jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn()
}))
jest.mock('@actions/core')

describe('Feature Flag Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    DefaultAzureCredential.prototype.getToken = jest.fn().mockResolvedValue({
      token: 'token'
    })
  })

  it('should list feature flags', async () => {
    const appConfigEndpoint = 'https://example.com'
    const getMock = jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: featureListResponse
    })

    const results = await listFeatureFlags(appConfigEndpoint)
    expect(results.items.length).toEqual(1)
    expect(results.items[0].key).toEqual(
      '.appconfig.featureflag/featureFlagId1'
    )
  })

  it('should throw error when list api fails', async () => {
    const appConfigEndpoint = 'https://example.com'

    const getMock = jest.spyOn(axios, 'get').mockResolvedValue({
      status: 500,
      statusText: 'Internal Server Error'
    })

    await expect(listFeatureFlags(appConfigEndpoint)).rejects.toThrow(ApiError)
  })

  it('create or update feature flag', async () => {
    const appConfigEndpoint = 'https://example.com'
    const featureFlagId = 'featureFlagId1'
    const value = getDummyFeatureFlagItem(featureFlagId)

    const getMock = jest.spyOn(axios, 'put').mockResolvedValue({
      status: 200
    })

    await createOrUpdateFeatureFlag(appConfigEndpoint, featureFlagId, value)
    expect(getMock).toBeCalledWith(
      `${appConfigEndpoint}/kv/.appconfig.featureflag%2FfeatureFlagId1?api-version=2023-11-01`,
      {
        content_type:
          'application/vnd.microsoft.appconfig.ff+json;charset=utf-8',
        value: JSON.stringify(value)
      },
      {
        headers: {
          Accept: '*/*',
          Authorization: 'Bearer token',
          'Content-Type': 'application/vnd.microsoft.appconfig.kv+json'
        }
      }
    )
  })

  it('should throw error when create or update feature flag fails', async () => {
    const appConfigEndpoint = 'https://example.com'
    const featureFlagId = 'featureFlagId1'
    const value = getDummyFeatureFlagItem(featureFlagId)

    const getMock = jest.spyOn(axios, 'put').mockResolvedValue({
      status: 500,
      statusText: 'Internal Server Error'
    })

    await expect(
      createOrUpdateFeatureFlag(appConfigEndpoint, featureFlagId, value)
    ).rejects.toThrow(ApiError)
  })

  it('should delete feature flag', async () => {
    const appConfigEndpoint = 'https://example.com'
    const featureFlagId = 'featureFlagId1'

    const getMock = jest.spyOn(axios, 'delete').mockResolvedValue({
      status: 200
    })

    await deleteFeatureFlag(appConfigEndpoint, featureFlagId)
    expect(getMock).toBeCalledWith(
      `${appConfigEndpoint}/kv/.appconfig.featureflag%2FfeatureFlagId1?api-version=2023-11-01`,
      {
        headers: {
          Accept: '*/*',
          Authorization: 'Bearer token',
          'Content-Type': 'application/vnd.microsoft.appconfig.kv+json'
        }
      }
    )
  })

  it('should throw error when delete feature flag fails', async () => {
    const appConfigEndpoint = 'https://example.com'
    const featureFlagId = 'featureFlagId1'

    const getMock = jest.spyOn(axios, 'delete').mockResolvedValue({
      status: 500
    })

    await expect(
      deleteFeatureFlag(appConfigEndpoint, featureFlagId)
    ).rejects.toThrow(ApiError)
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
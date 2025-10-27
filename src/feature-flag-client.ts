// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import axios from 'axios'
import { DefaultAzureCredential } from '@azure/identity'
import { ApiError } from './errors'
import {
  FeatureFlagResponse,
  FeatureListResponse
} from './models/api-response.models'
import { FeatureFlag } from './models/feature-flag.models'

const apiVersion = '2023-11-01'

export const listFeatureFlags = async (
  appConfigEndpoint: string,
  label: string
): Promise<FeatureListResponse> => {
  const response = await axios.get<FeatureListResponse>(
    `${appConfigEndpoint}/kv?key=.appconfig.featureflag*&api-version=${apiVersion}&label=${encodeURIComponent(label)}`,
    { headers: await getHeaders(appConfigEndpoint) }
  )

  if (response.status >= 400) {
    throw new ApiError(
      `Failed to list feature flags: ${response.status} - ${response.statusText}`
    )
  }

  return response.data
}

export const createOrUpdateFeatureFlag = async (
  appConfigEndpoint: string,
  featureFlagId: string,
  value: FeatureFlag,
  label: string
): Promise<void> => {
  const payload: FeatureFlagResponse = {
    content_type: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8',
    value: JSON.stringify(value)
  }
  const response = await axios.put(
    `${appConfigEndpoint}/kv/${getAppConfigKey(encodeURIComponent(featureFlagId))}?api-version=${apiVersion}&label=${encodeURIComponent(label)}`,
    payload,
    { headers: await getHeaders(appConfigEndpoint) }
  )

  if (response.status >= 400) {
    throw new ApiError(
      `Failed to create or update feature flag: ${response.status} - ${response.statusText}`
    )
  }
}

export const deleteFeatureFlag = async (
  appConfigEndpoint: string,
  featureFlagId: string,
  label: string
): Promise<void> => {
  const response = await axios.delete(
    `${appConfigEndpoint}/kv/${getAppConfigKey(featureFlagId)}?api-version=${apiVersion}&label=${encodeURIComponent(label)}`,
    { headers: await getHeaders(appConfigEndpoint) }
  )

  if (response.status >= 400) {
    throw new ApiError(
      `Failed to delete feature flag: ${response.status} - ${response.statusText} - ${response.data}`
    )
  }
}

const getHeaders = async (appConfigEndpoint: string) => {
  const accessToken = await getToken(appConfigEndpoint)
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: '*/*',
    'Content-Type': 'application/vnd.microsoft.appconfig.kv+json'
  }
}

const getToken = async (appConfigEndpoint: string) => {
  const credential = new DefaultAzureCredential() // CodeQL [SM05138] GitHub Actions will run in a clean environment each time, no one can inject malicious credentials.
  const token = await credential.getToken(`${appConfigEndpoint}/.default`)
  return token.token
}

const getAppConfigKey = (featureFlagId: string) => {
  return encodeURIComponent(`.appconfig.featureflag/${featureFlagId}`)
}

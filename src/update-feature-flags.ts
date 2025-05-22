// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  createOrUpdateFeatureFlag,
  deleteFeatureFlag,
  listFeatureFlags
} from './feature-flag-client'
import { FeatureListResponse } from './models/api-response.models'
import { FeatureFlag } from './models/feature-flag.models'
import { Input } from './models/models'
import { deepEqualCheck } from './utils'
import * as core from '@actions/core'

export const updateFeatureFlags = async (
  input: Input,
  config: FeatureFlag[]
): Promise<void> => {
  const existingFeatureListResponse = await listFeatureFlags(
    input.appConfigEndpoint,
    input.label
  )
  const updatedFeatureFlags = getUpdatedFeatureFlags(
    config,
    existingFeatureListResponse
  )

  const promises = updatedFeatureFlags.map(featureFlag =>
    createOrUpdateFeatureFlag(
      input.appConfigEndpoint,
      featureFlag.id,
      featureFlag,
      input.label
    )
  )

  await Promise.all(promises)
  core.info(`Updated ${updatedFeatureFlags.length} feature flags`)

  if (input.strictSync) {
    core.info('Strict sync enabled. Deleting flags that are not in the config')
    const flagsToDelete = getFlagsToDelete(config, existingFeatureListResponse)

    core.info(`Deleting ${flagsToDelete.length} feature flags`)
    const deletePromises = flagsToDelete.map(flag =>
      deleteFeatureFlag(input.appConfigEndpoint, flag.id, input.label)
    )
    await Promise.all(deletePromises)
  } else {
    core.info(
      'Strict sync disabled. Not deleting flags that are not in the config'
    )
  }
}

export const getUpdatedFeatureFlags = (
  config: FeatureFlag[],
  existingFeatureListResponse: FeatureListResponse
): FeatureFlag[] => {
  const existingFeatureFlags = existingFeatureListResponse.items.map(
    r => JSON.parse(r.value ?? '{}') as FeatureFlag
  )

  const updatedFeatureFlags = config.filter(c => {
    const existingFeatureFlag = existingFeatureFlags.find(f => f.id === c.id)
    return !existingFeatureFlag || !deepEqualCheck(c, existingFeatureFlag)
  })
  return updatedFeatureFlags
}

export const getFlagsToDelete = (
  config: FeatureFlag[],
  existingFeatureListResponse: FeatureListResponse
): FeatureFlag[] => {
  const existingFeatureFlags = existingFeatureListResponse.items.map(
    r => JSON.parse(r.value ?? '{}') as FeatureFlag
  )
  const flagsToDelete = existingFeatureFlags.filter(
    f => !config.find(c => c.id === f.id)
  )
  return flagsToDelete
}

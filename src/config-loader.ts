// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as core from '@actions/core'
import * as glob from '@actions/glob'
import { ArgumentError, ParseError, ValidationError } from './errors'
import * as fs from 'fs'
import { FeatureFlag } from './models/feature-flag.models'
import Ajv from 'ajv'
import featureManagementSchema from '../schema/FeatureManagement.v2.0.0.schema.json'
import { FeatureManagementConfig } from './models/models'

const ajv = new Ajv({ allowUnionTypes: true })
const validator = ajv.compile(featureManagementSchema)

export async function loadConfigFiles(
  inputPattern: string
): Promise<FeatureFlag[]> {
  core.info('Loading configuration files from: ' + inputPattern)

  const patterns = inputPattern
    .split('\n')
    .map(s => s.replace(/^!\s+/, '!').trim())
    .filter(x => x !== '')
    .join('\n')

  const files = []
  const globber = await glob.create(patterns)
  for await (const file of globber.globGenerator()) {
    files.push(file)
    core.info(`Using configuration file: ${file}`)
  }

  if (files.length === 0) {
    throw new ArgumentError(`No configuration files found`)
  }

  const configPromises = files.map(async file => {
    core.info(`Parsing : ${file}`)

    const fileConfig = await parseConfigFile(file)
    const isValid = validator(fileConfig)
    if (!isValid) {
      const message = `Schema validation failed for file: ${file}. It should follow the schema defined in https://github.com/Azure/app-configuration-deploy-feature-flags/tree/main/schema/FeatureManagement.v2.0.0.schema.json. Error details: ${JSON.stringify(validator.errors)}`
      core.error(message)
      throw new ValidationError(message)
    }
    return fileConfig
  })

  const configs = await Promise.all(configPromises)

  core.info('Merging loaded configuration')

  const mergedFlags = configs
    .map(config => config?.feature_management?.feature_flags)
    .flat()
  return mergedFlags
}

export function validateConfigs(mergedFlags: FeatureFlag[]) {
  const duplicationFeatureFlags = mergedFlags.reduce<{ [key: string]: number }>(
    (acc, ff) => {
      if (!ff.id) {
        throw new ValidationError('Feature flag id is missing')
      }
      const { id } = ff
      acc[id] = (acc[id] || 0) + 1
      return acc
    },
    {}
  )

  const duplicates = mergedFlags.filter(
    ff => duplicationFeatureFlags[ff.id] > 1
  )

  if (duplicates.length > 0) {
    const duplicateIds = duplicates.map(ff => ff.id).join(', ')
    const message = `Feature flag is defined multiple times which is not allowed: ${duplicateIds}`
    core.error(message)
    throw new ArgumentError(message)
  }

  core.info(`Found ${mergedFlags.length} feature flags in configuration files`)

  // default_when_enabled is required
  const defaultWhenEnabledErrors = mergedFlags.map(f => {
    if (!f.allocation?.default_when_enabled) {
      const message = `Feature flag ${f.id} is missing default_when_enabled`
      core.error(message)
      return {
        message,
        isValid: false
      }
    }
    return { isValid: true }
  })

  if (defaultWhenEnabledErrors.some(e => !e.isValid)) {
    throw new ValidationError(
      'Default_when_enabled is required: ' +
        defaultWhenEnabledErrors.map(e => e.message).join(', ')
    )
  }

  const allocationErrors = mergedFlags.map(f => {
    // allocation should only refer to existing variants
    const variantNames = f.variants?.map(v => v.name) || []
    const allocationVariants =
      f.allocation?.percentile?.map(p => p.variant) || []
    if (!!f.allocation?.default_when_enabled) {
      allocationVariants.push(f.allocation.default_when_enabled)
    }
    if (!!f.allocation?.default_when_disabled) {
      allocationVariants.push(f.allocation.default_when_disabled)
    }

    const invalidVariants = allocationVariants.filter(
      v => !variantNames.includes(v)
    )

    if (invalidVariants.length > 0) {
      const message = `Feature flag ${f.id} has allocation to non-existing variants: ${invalidVariants}`
      core.error(message)
      return {
        message,
        isValid: false
      }
    }
    return { isValid: true }
  })

  if (allocationErrors.some(e => !e.isValid)) {
    throw new ValidationError(
      'Allocation error: ' + allocationErrors.map(e => e.message).join(', ')
    )
  }
}

async function parseConfigFile(file: string): Promise<FeatureManagementConfig> {
  try {
    const fileContent = (await fs.promises.readFile(file)).toString()
    return JSON.parse(fileContent)
  } catch (e) {
    throw new ParseError(`Failed to parse: ${file}.`)
  }
}

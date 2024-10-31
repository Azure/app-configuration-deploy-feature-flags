import { ArgumentError } from './errors'
import * as core from '@actions/core'
import { Input } from './models/models'

export function getActionInput(): Input {
  return {
    configFile: getRequiredInputString('path'),
    strictSync: getRequiredBooleanInput('strict'),
    appConfigEndpoint: getAppConfigEndpoint()
  }
}

function getAppConfigEndpoint() {
  const appConfigEndpoint = getRequiredInputString('app-configuration-endpoint')
  if (!isValidUrl(appConfigEndpoint)) {
    throw new ArgumentError(`Invalid URL: ${appConfigEndpoint}`)
  }

  core.info(`App Config endpoint: ${appConfigEndpoint}`)
  return removeTrailingSlash(appConfigEndpoint)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (_) {
    return false
  }
}

function removeTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const getRequiredInputString = (name: string): string => {
  const input = getNonRequiredInputString(name)
  if (!input) {
    throw new ArgumentError(`Required input is missing: ${name}`)
  }

  return input
}

const getNonRequiredInputString = (name: string): string | undefined => {
  return core.getInput(name, { required: false })
}

const getRequiredBooleanInput = (name: string): boolean => {
  let settingValue = getNonRequiredInputString(name)
  if (!settingValue) {
    throw new ArgumentError(`Required input is missing: ${name}`)
  }

  settingValue = settingValue.toLowerCase()
  if (settingValue !== 'true' && settingValue !== 'false') {
    throw new ArgumentError(
      `Invalid ${name} value: ${settingValue}. It should be either 'true' or 'false'`
    )
  }

  return settingValue === 'true'
}

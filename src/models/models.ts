import { FeatureFlag } from './feature-flag.models'

export interface FeatureFlagConfig {
  featureFlags: FeatureFlag[]
}

export interface Input {
  configFile: string
  strictSync: boolean
  appConfigEndpoint: string
}

export interface ApiResponse {
  status: number
  statusText: string
}

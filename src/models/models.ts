// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FeatureFlag } from './feature-flag.models'

export interface FeatureManagementConfig {
  feature_management: {
    feature_flags: FeatureFlag[]
  }
}

export interface Input {
  configFile: string
  strictSync: boolean
  appConfigEndpoint: string
  operation: string
  label: string
}

export interface ApiResponse {
  status: number
  statusText: string
}

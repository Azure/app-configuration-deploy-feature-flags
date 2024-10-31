export interface FeatureListResponse {
  items: FeatureFlagResponse[]
  etag: string
}

export interface FeatureFlagResponse {
  etag?: string
  key?: string
  label?: string
  content_type?: string
  value?: string
  tags?: any
  locked?: boolean
  last_modified?: string
}

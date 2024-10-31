import { loadConfigFiles, validateConfigs } from '../src/config-loader'
import { ArgumentError, ParseError, ValidationError } from '../src/errors'

jest.mock('@actions/core')

describe('loadConfigFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throw when no config files are found', async () => {
    const promise = loadConfigFiles(`${__dirname}/test-data/missing.json`)

    await expect(promise).rejects.toThrow(ArgumentError)
    await expect(promise).rejects.toThrow('No configuration files found')
  })

  it('throw when config is invalid json', async () => {
    const file = `${__dirname}/test-data/invalidjson.json1`
    const promise = loadConfigFiles(file)

    await expect(promise).rejects.toThrow(ParseError)
    await expect(promise).rejects.toThrow(`Failed to parse`)
  })

  it('throw when config format is invalid', async () => {
    const configPromise = loadConfigFiles(`${__dirname}/test-data/invalid.json`)

    await expect(configPromise).rejects.toThrow(ValidationError)
    await expect(configPromise).rejects.toThrow(
      'Schema validation failed for file:'
    )
  })

  it('throw when config format not following schema', async () => {
    const configPromise = loadConfigFiles(
      `${__dirname}/test-data/invalidjson2.json`
    )

    await expect(configPromise).rejects.toThrow(ValidationError)
    await expect(configPromise).rejects.toThrow(
      'Schema validation failed for file:'
    )
  })

  it('throw when duplicates are present', async () => {
    const config = await loadConfigFiles(
      `${__dirname}/test-data/valid.json
      ${__dirname}/test-data/duplicates.json`
    )

    expect(() => validateConfigs(config)).toThrow(ArgumentError)
    expect(() => validateConfigs(config)).toThrow(
      'Feature flag is defined multiple times which is not allowed: NewFlagv2, OpenAIConfig, TestNewModel, TestVariants, NewFlagv2, OpenAIConfig, TestNewModel, TestVariants'
    )
  })

  it('Read file correctly', async () => {
    const result = await loadConfigFiles(`${__dirname}/test-data/valid.json`)
    expect(result.length).toBe(4)
    expect(result[0].id).toBe('NewFlagv2')
    expect(result[1].id).toBe('OpenAIConfig')
  })

  it('throw when allocation variants are not present in variants', async () => {
    const config = await loadConfigFiles(
      `${__dirname}/test-data/invalidallocationvariants.json`
    )

    expect(() => validateConfigs(config)).toThrow(ValidationError)
    expect(() => validateConfigs(config)).toThrow(
      'Allocation error: Feature flag NewFlagv2 has allocation to non-existing variants: gpt-4o123,gpt-35123'
    )
  })

  it('throw when default_when_enabled is not present in variants', async () => {
    const config = await loadConfigFiles(
      `${__dirname}/test-data/invalid_default_not_present.json`
    )

    expect(() => validateConfigs(config)).toThrow(ValidationError)
    expect(() => validateConfigs(config)).toThrow(
      'Default_when_enabled is required: Feature flag TestNewModel is missing default_when_enabled'
    )
  })

  it('valid config should pass validation', async () => {
    const config = await loadConfigFiles(`${__dirname}/test-data/valid.json`)

    expect(() => validateConfigs(config)).not.toThrow(Error)
  })
})

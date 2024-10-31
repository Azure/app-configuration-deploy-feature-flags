import * as core from '@actions/core'
import { getActionInput } from '../src/input'

let getInputMock: jest.SpiedFunction<typeof core.getInput>

describe('getActionInput', () => {
  const inputValues: { [key: string]: string } = {
    path: 'configFile',
    strict: 'true',
    'app-configuration-endpoint': 'https://example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
  })

  it('should return the expected input', () => {
    getInputMock.mockImplementation((name: string) => inputValues[name])
    const resultInput = getActionInput()
    expect(resultInput).toEqual({
      configFile: 'configFile',
      strictSync: true,
      appConfigEndpoint: 'https://example.com',
      operation: 'deploy'
    })
  })

  it('should return the expected input for validate only action call', () => {
    getInputMock.mockImplementation((name: string) =>
      name == 'operation' ? 'validate' : inputValues[name]
    )
    const resultInput = getActionInput()
    expect(resultInput).toEqual({
      configFile: 'configFile',
      strictSync: false, // doesn't matter in validate mode
      appConfigEndpoint: '', // doesn't matter in validate mode
      operation: 'validate'
    })
  })

  it('should throw an error if the path is not set', () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'path') return ''
      return inputValues[name]
    })
    expect(() => getActionInput()).toThrowError(
      'Required input is missing: path'
    )
  })

  it('should throw when strict is not set', () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'strict') return ''
      return inputValues[name]
    })
    expect(() => getActionInput()).toThrowError(
      'Required input is missing: strict'
    )
  })

  it('should throw error when strict is not a boolean', () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'strict') return 'invalidBoolean'
      return inputValues[name]
    })
    expect(() => getActionInput()).toThrowError(
      `Invalid strict value: invalidboolean. It should be either 'true' or 'false'`
    )
  })

  it('should throw an error if the app-configuration-endpoint is not a valid URL', () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'app-configuration-endpoint') return 'invalidURL'
      return inputValues[name]
    })
    expect(() => getActionInput()).toThrowError('Invalid URL: invalidURL')
  })

  it('Remove trailing slash', () => {
    const actionInput: { [key: string]: string } = {
      ...inputValues,
      'app-configuration-endpoint': 'https://example.com/'
    }
    getInputMock.mockImplementation((name: string) => {
      return actionInput[name]
    })
    expect(getActionInput().appConfigEndpoint).toBe('https://example.com')
  })

  it('should return deploy operation when operation is missing', () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'operation') return ''
      return inputValues[name]
    })
    const input = getActionInput()
    expect(input.operation).toEqual('deploy')
  })

  it('should throw an error if operation is invalid', () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'operation') return 'invalid'
      return inputValues[name]
    })
    expect(() => getActionInput()).toThrowError(
      `Invalid operation: invalid. It should be either 'validate' or 'deploy'`
    )
  })
})

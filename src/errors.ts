// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Custom error type used during input validation
 */
export class ArgumentError extends Error {}

/**
 * Custom error type used during configuration file parsing
 */
export class ParseError extends Error {}

/**
 * Api error received from the server
 */
export class ApiError extends Error {}

/**
 * Validation error received from the server
 */
export class ValidationError extends Error {}

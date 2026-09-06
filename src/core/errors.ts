export type CrcDomainErrorCode =
  | 'EMPTY_TEXT'
  | 'EMPTY_BINARY_INPUT'
  | 'NON_BINARY_INPUT'
  | 'INVALID_BYTE_LENGTH'
  | 'INVALID_UTF8'
  | 'INVALID_GENERATOR_LENGTH'
  | 'GENERATOR_MUST_START_WITH_ONE'
  | 'GENERATOR_MUST_END_WITH_ONE'
  | 'BIT_LENGTH_MISMATCH'
  | 'DIVIDEND_TOO_SHORT'
  | 'FRAME_TOO_SHORT'
  | 'BIT_POSITION_OUT_OF_RANGE'
  | 'INVALID_RANDOM_VALUE'

export class CrcDomainError extends Error {
  readonly code: CrcDomainErrorCode

  constructor(code: CrcDomainErrorCode, message: string) {
    super(message)
    this.name = 'CrcDomainError'
    this.code = code
  }
}

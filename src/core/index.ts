export {
  parseBinaryInput,
  parseReceivedFrame,
  type BinaryBits,
  type Bit,
  type CrcBits,
  type DataBits,
  type FrameBits,
  type GeneratorBits,
} from './binary'
export { calculateCrc, type CrcCalculation } from './crc/crc'
export { createGeneratorPolynomial, type GeneratorPolynomial } from './crc/generatorPolynomial'
export { divideModulo2, xorBits, type CrcDivisionResult, type CrcDivisionStep } from './crc/modulo2'
export {
  decodeText,
  encodeText,
  type DecodedMessage,
  type EncodedByte,
  type EncodedMessage,
  type EncodedSymbol,
} from './encoding/messageEncoding'
export { CrcDomainError, type CrcDomainErrorCode } from './errors'
export {
  flipBit,
  flipRandomBit,
  type BitFlipResult,
  type RandomSource,
} from './transmission/bitErrors'
export {
  decodeFrameText,
  extractDataBits,
  verifyFrame,
  type DecodedFrame,
  type FrameVerification,
} from './transmission/receiver'

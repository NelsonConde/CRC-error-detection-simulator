import {
  createCrcBits,
  createDataBits,
  type CrcBits,
  type DataBits,
  type FrameBits,
  type GeneratorBits,
} from '../binary'
import type { CrcDivisionStep } from '../crc/modulo2'
import { divideModulo2 } from '../crc/modulo2'
import type { GeneratorPolynomial } from '../crc/generatorPolynomial'
import { decodeText, type DecodedMessage } from '../encoding/messageEncoding'
import { CrcDomainError } from '../errors'

export interface FrameVerification {
  readonly receivedFrame: FrameBits
  readonly generator: GeneratorBits
  readonly polynomialDegree: number
  readonly remainder: CrcBits
  readonly errorDetected: boolean
  readonly divisionSteps: readonly CrcDivisionStep[]
}

export interface DecodedFrame {
  readonly frame: FrameBits
  readonly data: DataBits
  readonly message: DecodedMessage
}

export function verifyFrame(
  receivedFrame: FrameBits,
  generator: GeneratorPolynomial,
): FrameVerification {
  // El receptor divide la trama completa: agregar ceros cambiaría el valor que debe comprobar.
  const division = divideModulo2(receivedFrame, generator.bits)
  const remainder = createCrcBits(division.remainder)

  return {
    receivedFrame,
    generator: generator.bits,
    polynomialDegree: generator.degree,
    remainder,
    // Un residuo cero significa que no se detectaron errores, no que la trama sea infalible.
    errorDetected: remainder.includes('1'),
    divisionSteps: division.steps,
  }
}

export function extractDataBits(frame: FrameBits, generator: GeneratorPolynomial): DataBits {
  if (frame.length <= generator.degree) {
    throw new CrcDomainError(
      'FRAME_TOO_SHORT',
      'La trama debe contener al menos un bit de datos además del CRC.',
    )
  }

  return createDataBits(frame.slice(0, -generator.degree))
}

export function decodeFrameText(frame: FrameBits, generator: GeneratorPolynomial): DecodedFrame {
  const data = extractDataBits(frame, generator)

  return {
    frame,
    data,
    message: decodeText(data),
  }
}

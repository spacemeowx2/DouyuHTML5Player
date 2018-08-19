import { ISignerResult } from './source'
import { runtimePort } from 'utils/port'

const port = runtimePort('signer')
export async function BackgroundSigner (rid: string, tt: number, did: string): Promise<ISignerResult> {
  return (await port('sign', rid, tt, did)) as any
}

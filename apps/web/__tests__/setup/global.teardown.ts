import { e2eStopDummyServer } from './e2e-setup-teardown'
import packageJson from '../../package.json' with { type: 'json' }

export default async function teardown() {
  await e2eStopDummyServer(packageJson.name)
}
import { e2eStartDummyServer } from './e2e-setup-teardown'
import packageJson from '../../package.json' with { type: 'json' }

export default async function setup() {
  await e2eStartDummyServer(packageJson.name)
}
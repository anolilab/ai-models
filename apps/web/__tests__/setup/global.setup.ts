import packageJson from "../../package.json" with { type: "json" };
import { e2eStartDummyServer } from "./e2e-setup-teardown";

export default async function setup() {
    await e2eStartDummyServer(packageJson.name);
}

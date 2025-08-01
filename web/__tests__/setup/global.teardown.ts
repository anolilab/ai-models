import packageJson from "../../package.json" with { type: "json" };
import { e2eStopDummyServer } from "./e2e-setup-teardown";

export default async function teardown() {
    await e2eStopDummyServer(packageJson.name);
}

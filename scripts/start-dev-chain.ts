import { spawnSync } from "child_process";
import { join } from "path";

// eslint-disable-next-line no-undef
const nodeConfPath = join(__dirname, "node.conf");

spawnSync("docker", [
  "run",
  "-d",
  "--rm",
  ...["-v", `${nodeConfPath}:/etc/rsk/node.conf`],
  ...["--name", "regtest-node-rsk"],
  ...["-p", "4444:4444/tcp"],
  ...["-p", "30305:30305/tcp"],
  "atixlabs/rsk-regtest:fdaf299a72b429d3066860fbc53bbb6e89e0490b",
]);

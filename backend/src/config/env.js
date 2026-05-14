import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const configDir = path.dirname(currentFile);
const repoRoot = path.resolve(configDir, "../../..");
const backendRoot = path.resolve(configDir, "../..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env") });


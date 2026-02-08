import type { Plugin } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_PROFILES = { rfidProfiles: [], labelPresets: [] };

export function profilesApiPlugin(): Plugin {
  const root = process.cwd();
  const dataDir = join(root, "data");
  const profilesPath = join(dataDir, "profiles.json");

  async function readProfiles(): Promise<{ rfidProfiles: unknown[]; labelPresets: unknown[] }> {
    try {
      const raw = await readFile(profilesPath, "utf-8");
      const data = JSON.parse(raw);
      return {
        rfidProfiles: Array.isArray(data?.rfidProfiles) ? data.rfidProfiles : [],
        labelPresets: Array.isArray(data?.labelPresets) ? data.labelPresets : [],
      };
    } catch {
      return DEFAULT_PROFILES;
    }
  }

  async function writeProfiles(data: { rfidProfiles: unknown[]; labelPresets: unknown[] }) {
    await mkdir(dataDir, { recursive: true });
    await writeFile(profilesPath, JSON.stringify(data, null, 2), "utf-8");
  }

  return {
    name: "profiles-api",
    enforce: "pre",
    configureServer(server) {
      console.log(`[profiles-api] Stored at: ${profilesPath}`);
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/profiles.json" && req.method === "GET") {
          try {
            const data = await readProfiles();
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch (e) {
            console.error("profiles read error:", e);
            res.statusCode = 500;
            res.end(JSON.stringify(DEFAULT_PROFILES));
          }
          return;
        }

        if (req.url === "/api/profiles" && req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              const data = JSON.parse(body || "{}");
              const profiles = {
                rfidProfiles: Array.isArray(data.rfidProfiles) ? data.rfidProfiles : [],
                labelPresets: Array.isArray(data.labelPresets) ? data.labelPresets : [],
              };
              await writeProfiles(profiles);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(profiles));
            } catch (e) {
              console.error("profiles write error:", e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Write failed" }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

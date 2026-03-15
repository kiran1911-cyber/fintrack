// Script to push source code to GitHub repo using Replit Connectors SDK
// Usage: pnpm --filter @workspace/scripts run push-to-github

import { execSync } from "child_process";
import { ReplitConnectors } from "@replit/connectors-sdk";

async function main() {
  const connectors = new ReplitConnectors();

  // Get auth token via a probe request; extract it from the Authorization header
  // The connectors SDK injects the token — we need to get it via env or internal mechanism
  const replIdentity = process.env.REPL_IDENTITY;
  const connHostname = process.env.REPLIT_CONNECTORS_HOSTNAME;

  if (!replIdentity || !connHostname) {
    throw new Error("REPL_IDENTITY or REPLIT_CONNECTORS_HOSTNAME not set — Replit Connectors not available");
  }

  // Get the GitHub token from the Connectors service
  const tokenResp = await fetch(
    `https://${connHostname}/token/github`,
    {
      headers: {
        "X-Replit-Identity": replIdentity,
      },
    }
  );

  if (!tokenResp.ok) {
    console.error("Could not fetch token:", tokenResp.status, await tokenResp.text());
    process.exit(1);
  }

  const { access_token } = await tokenResp.json() as { access_token: string };
  if (!access_token) {
    throw new Error("No access_token in response");
  }

  console.log("Token retrieved. Setting up remote...");

  const repoUrl = `https://${access_token}@github.com/kiran1911-cyber/fintrack.git`;

  try {
    execSync(`git remote remove github 2>/dev/null || true`, { stdio: "pipe" });
    execSync(`git remote add github "${repoUrl}"`, { stdio: "pipe" });
    console.log("Remote added.");

    // Push all branches
    execSync(`git push github HEAD:main --force`, { stdio: "inherit" });
    console.log("✅ Code pushed to https://github.com/kiran1911-cyber/fintrack");
  } catch (err) {
    console.error("Push failed:", err);
    process.exit(1);
  }
}

main();

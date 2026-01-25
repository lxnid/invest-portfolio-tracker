import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { RateLimiter } from "./src/lib/rate-limit";

async function main() {
  console.log("Testing Rate Limiter...");
  const key = "test-ip-" + Date.now();

  // 1. First request
  let res = await RateLimiter.check(key, 2, 60);
  console.log("Req 1 (Success):", res.success, "Remaining:", res.remaining);
  if (!res.success) throw new Error("Req 1 failed");

  // 2. Second request
  res = await RateLimiter.check(key, 2, 60);
  console.log("Req 2 (Success):", res.success, "Remaining:", res.remaining);
  if (!res.success) throw new Error("Req 2 failed");

  // 3. Third request (Should Fail)
  res = await RateLimiter.check(key, 2, 60);
  console.log("Req 3 (Result):", res.success);
  if (res.success) throw new Error("Req 3 succeeded but should fail");

  console.log("Verification Passed!");
  process.exit(0);
}
main();

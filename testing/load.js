// PT Operations — Load / Stress Testing (REPORT_3 + pedido de 2026-10-11, dropdown de nº de
// agentes). Local only — BASE_URL always comes from pt-operations-api's
// ptops.pt-api.local-base-url, there is no code path anywhere in this repo or in
// TestRunProcessManager that can point this at production. Gradual ramp by design (never a
// direct jump to MAX_VUS, see REPORT_3 §6.4) — each step can be read against
// pg_stat_activity/hikaricp metrics before deciding to go further. MAX_VUS scales the same
// 5%→25%→50%→100% shape the original fixed 1→5→10→20 ramp already was (20 * [0.05,0.25,0.5,1] =
// [1,5,10,20] exactly) — same timing per stage, just a different ceiling.
//
// PROFILE=anonymous — unauthenticated read traffic (map/POIs/search/district), the same
// requests any real visitor makes without logging in.
// PROFILE=authenticated — logs in ONCE in setup() (not per VU/iteration, so this never collides
// with LoginRateLimiter's 10/15min budget) and reuses that one token across every VU, same as a
// real 14-day session would.
import http from "k6/http";
import { check, group } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8085";
const TEST_RUN_ID = __ENV.TEST_RUN_ID || "";
const TEST_AGENT_SECRET = __ENV.TEST_AGENT_SECRET || "";
const TECH_USER_EMAIL = __ENV.TECH_USER_EMAIL;
const TECH_USER_PASSWORD = __ENV.TECH_USER_PASSWORD;
const TEST_TRIP_ID = __ENV.TEST_TRIP_ID;
const PROFILE = __ENV.PROFILE || "anonymous";
const DISTRICT_ID = __ENV.DISTRICT_ID || "16";
const MAX_VUS = Math.max(1, parseInt(__ENV.MAX_VUS || "20", 10));

function rampStages(maxVus) {
  const uniqueTargets = [...new Set([0.05, 0.25, 0.5, 1].map((f) => Math.max(1, Math.round(maxVus * f))))];
  return [
    ...uniqueTargets.map((target) => ({ duration: "30s", target })),
    { duration: "15s", target: 0 },
  ];
}

const STAGES = rampStages(MAX_VUS);

export const options = {
  stages: STAGES,
  thresholds: {
    // Observational, not a hard pass/fail gate for this phase — a load test "failing" its own
    // threshold is itself a useful, expected outcome sometimes (that's the point: find the real
    // limit), not something that should be hidden by k6 exiting non-zero and TestRunProcessManager
    // marking the run FAILURE. Kept loose on purpose.
    http_req_failed: ["rate<1.0"],
  },
};

function testHeaders(extra) {
  return Object.assign(
    { "X-Test-Run-Id": TEST_RUN_ID, "X-Test-Agent-Secret": TEST_AGENT_SECRET },
    extra || {}
  );
}

export function setup() {
  if (PROFILE !== "authenticated") return {};
  const res = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email: TECH_USER_EMAIL, password: TECH_USER_PASSWORD }),
    { headers: testHeaders({ "Content-Type": "application/json" }) }
  );
  return { token: res.json("token") };
}

export default function (data) {
  const headers = testHeaders(
    data && data.token ? { Authorization: `Bearer ${data.token}` } : {}
  );

  group("MAP", function () {
    const res = http.get(
      `${BASE_URL}/api/pois/lite?bbox=-9.30,38.60,-9.00,38.80&districtId=${DISTRICT_ID}&limit=50`,
      { headers }
    );
    check(res, { "map: 200": (r) => r.status === 200 });
  });

  group("SEARCH", function () {
    const res = http.get(`${BASE_URL}/api/search?q=castelo&limit=5`, { headers });
    check(res, { "search: 200": (r) => r.status === 200 });
  });

  group("DISTRICT", function () {
    const res = http.get(`${BASE_URL}/api/districts/${DISTRICT_ID}`, { headers });
    check(res, { "district: 200": (r) => r.status === 200 });
  });

  if (PROFILE === "authenticated" && TEST_TRIP_ID) {
    group("TRIP", function () {
      const res = http.get(`${BASE_URL}/api/trips/${TEST_TRIP_ID}`, { headers });
      check(res, { "trip: 200": (r) => r.status === 200 });
    });
  }
}

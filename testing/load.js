// PT Operations — Load / Stress Testing (REPORT_3 + pedido de 2026-10-11, dropdown de nº de
// agentes). BASE_URL comes from pt-operations-api's ptops.pt-api.local-base-url OR
// ...prod-base-url, picked by TestRunProcessManager from the targetEnv the operator chose —
// prod runs are explicitly gated by ProductionGate on that side, never implicit here. Gradual
// ramp by design (never a
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
// PT_OPERATIONS_OBSERVABILITY_COVERAGE_REPORT.md (2026-10-15) — mesma seed conhecida que
// synthetic.js (distrito 16, Lisboa): Alenquer (município) e A dos Cunhados (localidade).
const MUNICIPALITY_ID = __ENV.MUNICIPALITY_ID || "148";
const LOCALITY_ID = __ENV.LOCALITY_ID || "420";
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

  let mapPoiIds = [];
  group("MAP", function () {
    const res = http.get(
      `${BASE_URL}/api/pois/lite?bbox=-9.30,38.60,-9.00,38.80&districtId=${DISTRICT_ID}&limit=50`,
      { headers }
    );
    const ok = check(res, { "map: 200": (r) => r.status === 200 });
    if (ok) {
      const body = res.json();
      const pois = Array.isArray(body) ? body : body.pois || [];
      mapPoiIds = pois.slice(0, 3).map((p) => p.id);
    }
  });

  group("SEARCH", function () {
    const res = http.get(`${BASE_URL}/api/search?q=castelo&limit=5`, { headers });
    check(res, { "search: 200": (r) => r.status === 200 });
  });

  group("DISTRICT", function () {
    const res = http.get(`${BASE_URL}/api/districts/${DISTRICT_ID}`, { headers });
    check(res, { "district: 200": (r) => r.status === 200 });
  });

  // PT_OPERATIONS_OBSERVABILITY_COVERAGE_REPORT.md (2026-10-15) — cobertura ampliada, mesmo
  // padrão público de leitura que DISTRICT acima, para os dois perfis (nunca testados antes).
  group("MUNICIPALITY", function () {
    const res = http.get(`${BASE_URL}/api/municipalities/${MUNICIPALITY_ID}`, { headers });
    check(res, { "municipality: 200": (r) => r.status === 200 });
  });

  group("LOCALITY", function () {
    const res = http.get(`${BASE_URL}/api/localities/${LOCALITY_ID}`, { headers });
    check(res, { "locality: 200": (r) => r.status === 200 });
  });

  if (PROFILE === "authenticated" && TEST_TRIP_ID) {
    group("TRIP", function () {
      const res = http.get(`${BASE_URL}/api/trips/${TEST_TRIP_ID}`, { headers });
      check(res, { "trip: 200": (r) => r.status === 200 });
    });
  }

  // Único caminho de todo o produto que chama o OSRM — só no perfil autenticado, para não
  // multiplicar pedidos de routing por todos os agentes anónimos de um teste de carga grande
  // (o custo de computação do OSRM é real e por desenho separado do resto, ver Dockerfile).
  if (PROFILE === "authenticated") {
    group("ROUTE_PREVIEW", function () {
      if (mapPoiIds.length < 2) return;
      const res = http.post(
        `${BASE_URL}/api/trips/proposals/route-preview`,
        JSON.stringify({ poiIds: mapPoiIds, days: 1, originLat: 38.7169, originLon: -9.1399 }),
        { headers: Object.assign({ "Content-Type": "application/json" }, headers) }
      );
      check(res, { "route preview: 200": (r) => r.status === 200 });
    });
  }
}

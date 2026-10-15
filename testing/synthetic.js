// PT Operations — Synthetic Monitoring (REPORT_3). Single VU, single iteration — one pass
// through the backend-reachable part of the reference journey (steps 3-9; steps 1-2, opening the
// real SPA and checking it renders, are deliberately out of scope for this k6-only MVP, see
// REPORT_3 §5). Every request carries X-Test-Run-Id + X-Test-Agent-Secret so
// RequestLoggingFilter (portugal-na-mao-api) tags the resulting api_request_log/
// user_activity_log rows — without a valid secret those rows are indistinguishable from real
// traffic, by design.
//
// Launched normally via TestRunProcessManager (pt-operations-api), which injects BASE_URL/
// TEST_RUN_ID/TEST_AGENT_SECRET/TECH_USER_EMAIL/TECH_USER_PASSWORD/TEST_TRIP_ID as environment
// variables. Can also be run by hand from a terminal — see testing/README.md.
import http from "k6/http";
import { check, group } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8085";
const TEST_RUN_ID = __ENV.TEST_RUN_ID || "";
const TEST_AGENT_SECRET = __ENV.TEST_AGENT_SECRET || "";
const TECH_USER_EMAIL = __ENV.TECH_USER_EMAIL;
const TECH_USER_PASSWORD = __ENV.TECH_USER_PASSWORD;
const TEST_TRIP_ID = __ENV.TEST_TRIP_ID;
// Fixed, known-good local seed data (REPORT_3 §live validation) — a district/POI that exist in
// every local dev DB seeded the normal way. Override via env if your local data differs.
const DISTRICT_ID = __ENV.DISTRICT_ID || "16"; // Lisboa
const POI_ID = __ENV.POI_ID; // resolved from the search step below if not set
// PT_OPERATIONS_OBSERVABILITY_COVERAGE_REPORT.md (2026-10-15) — cobertura ampliada. Município
// (Alenquer, 148) e localidade (A dos Cunhados, 420) existem em qualquer BD local/prod semeada
// normalmente, no distrito 16 acima — mesmo princípio de "seed conhecida", override via env.
const MUNICIPALITY_ID = __ENV.MUNICIPALITY_ID || "148";
const LOCALITY_ID = __ENV.LOCALITY_ID || "420";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    // Any failed check fails the whole run (non-zero k6 exit code) — TestRunProcessManager maps
    // that straight to test_run.status = FAILURE. A single failed step should be visible as a
    // failed run, not buried in a 99%-passed summary.
    checks: ["rate==1.0"],
  },
};

function testHeaders(extra) {
  return Object.assign(
    {
      "X-Test-Run-Id": TEST_RUN_ID,
      "X-Test-Agent-Secret": TEST_AGENT_SECRET,
    },
    extra || {}
  );
}

export default function () {
  let token = null;

  group("LOGIN", function () {
    const res = http.post(
      `${BASE_URL}/api/login`,
      JSON.stringify({ email: TECH_USER_EMAIL, password: TECH_USER_PASSWORD }),
      { headers: testHeaders({ "Content-Type": "application/json" }) }
    );
    check(res, { "login: 200": (r) => r.status === 200 });
    token = res.json("token");
  });

  const authHeaders = testHeaders({ Authorization: `Bearer ${token}` });

  let mapPoiIds = [];
  group("MAP", function () {
    // Rough bbox around Lisboa district — see PoiController/DistrictPoiQueryService for the
    // bbox="minLon,minLat,maxLon,maxLat" contract.
    const res = http.get(
      `${BASE_URL}/api/pois/lite?bbox=-9.30,38.60,-9.00,38.80&districtId=${DISTRICT_ID}&limit=50`,
      { headers: authHeaders }
    );
    const ok = check(res, { "map: 200": (r) => r.status === 200 });
    if (ok) {
      const body = res.json();
      const pois = Array.isArray(body) ? body : body.pois || [];
      mapPoiIds = pois.slice(0, 3).map((p) => p.id);
    }
  });

  let resolvedPoiId = POI_ID;
  group("SEARCH", function () {
    const res = http.get(`${BASE_URL}/api/search?q=castelo&limit=5`, { headers: authHeaders });
    const ok = check(res, { "search: 200": (r) => r.status === 200 });
    if (ok && !resolvedPoiId) {
      const results = res.json();
      const firstPoi = Array.isArray(results) ? results.find((r) => r.kind === "poi") : null;
      if (firstPoi) resolvedPoiId = firstPoi.id;
    }
  });

  group("POI_DETAIL", function () {
    if (!resolvedPoiId) return; // nothing resolved — already reflected as a failed SEARCH check above
    const res = http.get(`${BASE_URL}/api/pois/${resolvedPoiId}`, { headers: authHeaders });
    check(res, { "poi detail: 200": (r) => r.status === 200 });
  });

  group("DISTRICT", function () {
    const res = http.get(`${BASE_URL}/api/districts/${DISTRICT_ID}`, { headers: authHeaders });
    check(res, { "district: 200": (r) => r.status === 200 });
  });

  // PT_OPERATIONS_OBSERVABILITY_COVERAGE_REPORT.md (2026-10-15) — município/localidade seguem
  // exatamente o mesmo padrão de leitura que DISTRICT acima (GET por id, público). Nunca
  // cobertos antes deste estudo de lacunas.
  group("MUNICIPALITY", function () {
    const res = http.get(`${BASE_URL}/api/municipalities/${MUNICIPALITY_ID}`, { headers: authHeaders });
    check(res, { "municipality: 200": (r) => r.status === 200 });
  });

  group("LOCALITY", function () {
    const res = http.get(`${BASE_URL}/api/localities/${LOCALITY_ID}`, { headers: authHeaders });
    check(res, { "locality: 200": (r) => r.status === 200 });
  });

  // Único caminho de todo o produto que chama o OSRM (TripRouteService.planProposalRoute) —
  // nunca exercitado por nenhum cenário de teste até agora (achado do estudo de cobertura). Usa
  // os POIs já resolvidos pelo MAP acima, sem persistir nada (preview puro).
  group("ROUTE_PREVIEW", function () {
    if (mapPoiIds.length < 2) return; // sem POIs suficientes resolvidos pelo MAP — nada a prever
    const res = http.post(
      `${BASE_URL}/api/trips/proposals/route-preview`,
      JSON.stringify({ poiIds: mapPoiIds, days: 1, originLat: 38.7169, originLon: -9.1399 }),
      { headers: Object.assign({ "Content-Type": "application/json" }, authHeaders) }
    );
    check(res, { "route preview: 200": (r) => r.status === 200 });
  });

  group("TRIP", function () {
    if (!TEST_TRIP_ID) return;
    const res = http.get(`${BASE_URL}/api/trips/${TEST_TRIP_ID}`, { headers: authHeaders });
    check(res, { "trip: 200": (r) => r.status === 200 });
  });
}

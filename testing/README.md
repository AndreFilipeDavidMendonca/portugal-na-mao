# Testing — Synthetic Monitoring & Load Testing (k6)

Ver `PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_REPORT_3.md` (raiz do workspace) para a
arquitetura completa. Esta pasta contém só os scripts k6 — execução normal é através dos botões
na tab "Testing" do PT Operations (que invoca estes scripts via `TestRunProcessManager`), mas
também podem correr manualmente num terminal.

## Execução manual

```bash
export BASE_URL=http://localhost:8085
export TEST_RUN_ID=$(uuidgen)
export TEST_AGENT_SECRET=<o mesmo valor configurado em ambas as apps>
export TECH_USER_EMAIL=<conta técnica>
export TECH_USER_PASSWORD=<password>
export TEST_TRIP_ID=<uuid de uma viagem pertencente à conta técnica>

k6 run synthetic.js
k6 run --env PROFILE=anonymous load.js
k6 run --env PROFILE=authenticated load.js
```

Sem `TEST_AGENT_SECRET` correto, os pedidos continuam a funcionar normalmente — só não ficam
marcados com `test_run_id` em `api_request_log`/`user_activity_log` (tráfego sem identificação
nunca é tratado como teste, por desenho, ver REPORT_3 §2).

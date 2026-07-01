# AuguryScenario V2

Scenarios judged by consensus - a falsifiable forecast protocol.

This repository contains a complete GenLayer Studionet project: frontend, contract source, deployment metadata and local verification scripts.

## AuguryScenario Brief

AuguryScenario V2 (# v0.2.16), 41474 bytes, 16 write + 22 view.

The important files are:

- `contracts/augury_v2.py` - GenLayer contract source
- `deployment.json` - Studionet address, deploy transaction and smoke transaction hashes
- `index.html` and `app.js` - static frontend
- `README.md` - this operator and reviewer guide

## Deployment Evidence

- Network: studionet (61999)
- Contract: [0xA83926e5B73b8e64fF3Cbc0A464FF793001706eD](https://explorer-studio.genlayer.com/contracts/0xA83926e5B73b8e64fF3Cbc0A464FF793001706eD)
- Deploy tx: [0x0ba663aa...e6b245](https://explorer-studio.genlayer.com/tx/0x0ba663aaf02469941d5c7d5e96a502e3fa8781a1c60326731ddb73fa06e6b245)
- Deployed at: 2026-06-22T21:32:33.257Z
- Smoke writes recorded: 13

## Protocol Mechanics

Typical flow: `create_scenario` -> `open_prediction_round` -> `submit_challenge` -> `review_outcome_with_genlayer` -> `resolve_challenge_with_genlayer` -> `open_challenge_window` -> `submit_appeal` -> `archive_scenario`

Useful reads: `get_scenario`, `get_scenario_count`, `get_recent_scenarios`, `get_scenarios_by_status`, `get_scenarios_by_seer`, `get_signal`, `get_scenario_signals`, `get_assumptions`

- Primary source: `contracts/augury_v2.py` (41,474 bytes)
- Public write/action methods: 16
- Read methods: 22
- GenLayer features: live web rendering, LLM adjudication, validator-comparative consensus, indexed storage, append-only collections

## Smoke Trail

- create_scenario: [0x263795dd...948d99](https://explorer-studio.genlayer.com/tx/0x263795ddc9944487a05490ba2dbb78cb07c958e1f1b75f64894e2aefd8948d99)
- add_signal_1: [0xfd77c1b6...9b363d](https://explorer-studio.genlayer.com/tx/0xfd77c1b6410c2f2077dba4a494e7e68dedd03398a10808aa1c03bdbe7e9b363d)
- add_signal_2: [0xa3a19dd3...57c8e3](https://explorer-studio.genlayer.com/tx/0xa3a19dd3783b91d04caff86bec48a852e8335a52787bba8ae3821cb2ad57c8e3)
- add_assumption: [0xfada4ddd...61be99](https://explorer-studio.genlayer.com/tx/0xfada4dddc963fc8e7b3a472d56d1907e1e09f5ba60ee7537209b8f6ffa61be99)
- gather_signals: [0xf3777c61...8ca193](https://explorer-studio.genlayer.com/tx/0xf3777c61fa5f797315cf14f0c4c7bda501497d865098e36e8f85bbc8408ca193)
- open_prediction_round: [0xe4ac7d4e...e81dae](https://explorer-studio.genlayer.com/tx/0xe4ac7d4e6d5f0dc6f1358cc04906d449e5992e5b6140ea296b2f44654ee81dae)
- review_outcome: [0x299a63d0...df93b8](https://explorer-studio.genlayer.com/tx/0x299a63d0bfbc8e2399176abe65eaa29a9e69a935ef6200a7e6d4131a94df93b8)
- open_challenge_window: [0xc05bcf3c...029696](https://explorer-studio.genlayer.com/tx/0xc05bcf3cc2076b95bbf8ec5476757c0284c7ffe53ccc119a8cfb3a87a3029696)

## Local Review Path

```powershell
cd <private-workspace-root>
npm run preview:start
npm run preview:project -- 26-augury
```

Open http://localhost:8080/26-augury/.

## GitHub And Vercel

```powershell
cd <private-workspace-root>
npm run publish:project -- -Project 26-augury -Repo https://github.com/aspro45/<repo-name>.git
```

## Secret Handling

- This repository should contain no decrypted wallet material.
- The Studionet deployer private key stays in the local encrypted vault.
- Vercel deployment should use the project folder only.

- QA notes: Contract upgraded from the ~4KB single-object Prophecy MVP to AuguryScenario V2. Smoke: create_scenario / add_signal x2 / add_assumption / gather_signals / open_prediction_round / review_outcome_with_genlayer (LLM: inconclusive...

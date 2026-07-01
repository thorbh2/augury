# Augury

Scenario forecasting with signals, assumptions and review rounds.

Augury is a scenario desk for uncertain outcomes. It records signals and assumptions before the validators compare public evidence and return a reasoned assessment.

## Review Links

| Surface | Link |
| --- | --- |
| Live app | https://assmore22-augury.vercel.app |
| GitHub | https://github.com/assmore22/augury |
| Contract | https://explorer-studio.genlayer.com/contracts/0xA83926e5B73b8e64fF3Cbc0A464FF793001706eD |

## Chain Record

- Network: GenLayer Studionet
- Chain ID: 61999
- Contract: `0xA83926e5B73b8e64fF3Cbc0A464FF793001706eD`
- Deploy transaction: [0x0ba663aa...e6b245](https://explorer-studio.genlayer.com/tx/0x0ba663aaf02469941d5c7d5e96a502e3fa8781a1c60326731ddb73fa06e6b245)
- Deployed: `2026-06-22T21:32:33.257Z`
- Source: `contracts/augury_v2.py` (41,474 bytes)

## Protocol Path

1. Create a scenario.
2. Add signals and assumptions.
3. Gather source material.
4. Open prediction round.
5. Review outcome and challenge if needed.

The frontend reads scenario records, signal lists, assumption sets and outcome summaries. Contract state is public; write actions still require a connected wallet on GenLayer Studionet.

## Finalized Smoke

| Action | Transaction |
| --- | --- |
| `create_scenario` | [0x263795dd...948d99](https://explorer-studio.genlayer.com/tx/0x263795ddc9944487a05490ba2dbb78cb07c958e1f1b75f64894e2aefd8948d99) |
| `add_signal_1` | [0xfd77c1b6...9b363d](https://explorer-studio.genlayer.com/tx/0xfd77c1b6410c2f2077dba4a494e7e68dedd03398a10808aa1c03bdbe7e9b363d) |
| `add_signal_2` | [0xa3a19dd3...57c8e3](https://explorer-studio.genlayer.com/tx/0xa3a19dd3783b91d04caff86bec48a852e8335a52787bba8ae3821cb2ad57c8e3) |
| `add_assumption` | [0xfada4ddd...61be99](https://explorer-studio.genlayer.com/tx/0xfada4dddc963fc8e7b3a472d56d1907e1e09f5ba60ee7537209b8f6ffa61be99) |
| `gather_signals` | [0xf3777c61...8ca193](https://explorer-studio.genlayer.com/tx/0xf3777c61fa5f797315cf14f0c4c7bda501497d865098e36e8f85bbc8408ca193) |
| `open_prediction_round` | [0xe4ac7d4e...e81dae](https://explorer-studio.genlayer.com/tx/0xe4ac7d4e6d5f0dc6f1358cc04906d449e5992e5b6140ea296b2f44654ee81dae) |

## Local Run

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Release Hygiene

The public package is static and has no install step. Vercel receives only frontend, contract source and public deployment metadata.

Keep wallet private keys, vault exports, `.env` files, Vercel project state and dashboard data out of Git. This repository is for public source, UI, tests and deployment receipts only.

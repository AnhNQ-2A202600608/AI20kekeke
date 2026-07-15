# Backup Demo Plan

This guide details step-by-step contingency operations if live demo services fail during the pitch.

## 1. Network / Internet Loss
- **Scenario**: Venue Wi-Fi drops.
- **Contingency**: Run in complete offline mode. Use local loopback `http://localhost:3000` and trigger the local capability `example_transform`.
- **Evidence**: Verified local run artifact metadata cached in local storage folders.

## 2. API / Model Outage
- **Scenario**: OpenAI/external API keys fail or throttle requests.
- **Contingency**: Disable optional modules (`agent`, `rag`) and showcase the local rules-based capability runner. Explain that the core system decouples model APIs.

## 3. Docker Failure
- **Scenario**: Docker service crashes.
- **Contingency**: Use standard local terminal launch commands (`make dev-backend` and `make dev-frontend`) outside Docker.

## 4. Browser / Presentation Glitches
- **Scenario**: Browser freezes or projection screen fails.
- **Contingency**: Keep static screenshots of the Workspace UI under `presentation/screenshots/` and pre-recorded CLI runs showing logs.

## 5. Time Limits
- **Scenario**: Running out of time before reaching the live run.
- **Contingency**: Skip file uploads and show a pre-computed completed run history directly in the **Results** or **Runs** pages.

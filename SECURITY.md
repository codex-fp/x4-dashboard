# Security Policy

## Supported Use

`x4-dashboard` is designed for trusted local machines and private home LANs.

- Do not expose the server directly to the public internet.
- Key press endpoints are localhost-only by default.
- If you intentionally enable remote controls, do it only on a trusted network.

## Reporting a Vulnerability

If you find a security issue, please do not open a public issue with exploit details.

Instead:

1. Open a GitHub security advisory or contact the maintainer privately.
2. Include reproduction steps, impact, and affected files.
3. Allow reasonable time for a fix before public disclosure.

## High-Risk Areas

- `POST /api/keypress` can simulate host key presses.
- `PUT /api/keybindings` changes host-side control mappings.
- `ALLOW_REMOTE_CONTROLS=true` relaxes the default localhost-only protection.

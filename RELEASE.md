# Release Guide

## Pre-release checklist

1. Update `CHANGELOG.md`
2. Verify version numbers in `package.json`, `client/package.json`, and `server/package.json` when needed
3. Run:

```bash
npm run release:check
```

4. Smoke test:
- `npm run dev:mock`
- `npm start` after `npm run build`

5. Confirm docs are current:
- `README.md`
- `SECURITY.md`
- `CONTRIBUTING.md`

## Suggested release flow

1. Create a release branch
2. Finalize changelog notes
3. Tag the release with `vX.Y.Z`
4. Publish GitHub release notes based on `CHANGELOG.md`

## Distribution notes

- `server/public/` is generated locally and should not be committed
- The project is intended for trusted local environments
- Remote control should stay disabled unless explicitly required

# Production before the frontend makeover

Preserved before the 2026-09-30 release:

- Original site: https://hackerjedi-portfolio-original.vercel.app
- Deployment: `dpl_NN9VKDvvjdcyCtWt6UM1XuM7X1o6`
- Immutable deployment URL: https://hackerjedi-portfolio-qzssjwmsn-abhimanyugupta-4662s-projects.vercel.app
- Source commit: `2642da8564411db36a8f42a1baa13226335db9eb`
- GitHub branch: `codex/production-before-makeover-2026-09-30`
- Project: `hackerjedi-portfolio` (`prj_IFJf6OYtrfohSMF9AipDwhyN6HKp`)
- Scope: `abhimanyugupta-4662s-projects`
- Main domains: `rubberduckypro.com`, `www.rubberduckypro.com`

The branch preserves the original source independently of deployment retention.
The original deployment also has its own alias so it remains browsable.

To restore the original release to production:

```sh
vercel rollback dpl_NN9VKDvvjdcyCtWt6UM1XuM7X1o6 \
  --scope abhimanyugupta-4662s-projects
```

Coordinate the production branch with a rollback before making subsequent Git
deployments, since pushes to `main` automatically publish that branch again.

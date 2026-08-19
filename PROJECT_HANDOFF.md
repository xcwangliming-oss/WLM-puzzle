# Puzzle Editor Project Handoff

Last updated: 2026-08-19

## 1. Canonical workspace and boundaries

- Canonical editor workspace: `E:\Gemini\Puzzle_Recovery_Sandbox`
- Original reference checkout: `E:\Gemini\Puzzle编辑器`
- Separate playable-editor copy: `E:\Gemini\Puzzle编辑器 - 试玩版本`

All editor recovery and new editor features are developed in the recovery sandbox. Do not copy changes from the playable-editor copy into this workspace without reviewing the implementation and running the full regression suite. The playable copy has a different export/runtime boundary and is not a replacement for the recovered editor source.

## 2. Technology and entry points

- Runtime: TypeScript, Vite, PixiJS, and GSAP.
- Main editor/runtime entry: `src/main.ts`.
- Static assets: `public/assets/`.
- Regression tests: `tests/*.test.cjs`.
- Production build output: `dist/`.

`src/main.ts` owns the editor state, material and custom asset uploads, board drawing, game modes, recording and scripted playback, collection animations, obstacle animations, and export-related runtime state. Treat changes in this file as cross-feature changes and validate the affected mode in the browser as well as through tests.

## 3. Git workflow

- Stable branch: `recovery-sandbox`.
- Feature work: create `feature/<short-name>` branches from `recovery-sandbox`.
- `major-update` is a separate protected milestone branch. Do not merge feature work into it unless the owner explicitly requests it.
- Merge a feature into `recovery-sandbox` only after the owner manually confirms the feature is clean.
- Keep commits focused. Do not mix UI, runtime, and unrelated cleanup in one commit.
- Never add or commit `recovered_snippets/`; it is an untracked recovery scratch area.

Recommended flow:

```powershell
git switch recovery-sandbox
git pull --ff-only origin recovery-sandbox
git switch -c feature/<short-name>
# implement and verify
node --test tests/*.test.cjs
npm.cmd run build
git add -- <only intended paths>
git commit -m "feat: concise feature description"
git push -u origin feature/<short-name>
# after manual acceptance: merge into recovery-sandbox and push it
```

## 4. Verification requirements

Run these commands before any feature merge or production deployment:

```powershell
node --test tests/*.test.cjs
npm.cmd run build
```

For UI or animation changes, also verify the real browser flow. At minimum cover the feature being changed plus a normal-board sanity check.

Core manual regression checklist:

- Material, collectible, background, sound, collection-avatar, obstacle-body, obstacle-head, and eater-character uploads persist after reload.
- Board drawing and manual placement work for normal blocks and both obstacle directions/lengths.
- Normal, color-change, rainbow, collection, no-gravity, fixed-board, infinite-rise, and scrolling modes start and clear correctly.
- Recording, reset-to-origin, automatic playback, rising playback, and scrolling playback preserve step timing and clear effects.
- Collection items fly to the displayed collection target; avatar idle/collection sequences are positioned and mirrored correctly.
- Obstacle body/head sequences, mirrored direction, row clear animation, and optional eater-character animation remain stable during falling/rising/scrolling.
- Desktop and 720x1280 mobile output preserve board aspect ratio and do not expose extra blank rows.

## 5. Current released feature set

The current feature line includes the recovered editor plus:

- Collection mode with uploaded idle/collection avatar sequences and a collection target in the top UI.
- Obstacle body and head customization, including idle/collection sequence assets, direction-aware mirroring, and persistent local storage restoration.
- Optional obstacle eater-character animation, controlled by the editor toggle. When enabled it extends the obstacle-clear time; when disabled obstacle clearing keeps the original duration.
- Bottom-to-top sequential clearing option for multiple cleared rows.
- Compact editor control layout and separate material versus character/tool-style panels.

Recent release commits before this merge:

- `9519b1c` - restore obstacle eater frames before playback.
- `941e036` - position obstacle eater at the free end of the obstacle.

## 6. Build notes

The 2026-08-19 build succeeds. Vite reports two non-blocking warnings:

- `assets/ui/free-to-play.png` is runtime-resolved instead of bundled by Vite.
- The main JavaScript bundle is above Vite's 500 kB advisory threshold.

Neither warning blocks the editor. Before changing playable packaging or static hosting rules, validate the export/download path separately because `public` assets are not automatically inlined into a single-file playable export.

## 7. Production deployment

- Production URL: `https://puzzle.wlm.wang`
- Aliyun host: `39.96.58.245`
- Static web root: `/www/wwwroot/puzzle.wlm.wang`
- Deploy only the contents of a successful local `dist/` build.

Deployment procedure:

1. Create a timestamped tar backup of the current remote web root under `/www/backups/`.
2. Archive local `dist/`, upload the archive to `/tmp/`, and extract it over the remote web root.
3. Request the production page with a cache-busting query value, confirm the HTML references the newly built hashed JS and CSS, and confirm those assets return HTTP 200.
4. Perform a browser smoke check for the changed feature before reporting the deployment complete.

Do not delete remote files blindly. New Vite hashes can coexist with old assets; the newly deployed `index.html` selects the current build.

## 8. Rollback

If production deployment regresses, restore the most recent timestamped tar backup created in `/www/backups/` into `/www/wwwroot/puzzle.wlm.wang`, then verify the page and assets with a cache-busting request. Identify the corresponding stable Git commit before attempting a source rollback.

## 9. Local development

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Use `npm.cmd` and `npx.cmd` on Windows. If a Vite port is occupied, use the URL printed by the newly started Vite process rather than assuming port 5173.

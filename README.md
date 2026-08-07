# ForFlickSakes v5 — Accuracy and Feedback

This patch builds on separated prompt/mood modes.

## Changes

- Explicit prompt genres are enforced before ranking.
- Semantic genre matching supports TVMaze summaries as well as genre labels.
- Popularity and rating cannot rescue a title that fails a hard requirement.
- Season, runtime, completed-status and exclusions remain hard filters.
- Weak matches are removed; the app may return fewer results instead of unrelated ones.
- Result cards show an estimated match percentage.
- Added “These aren't right” feedback for a recommendation set.
- Added show-level feedback: Loved it, Not interested, Already watched, Wrong genre, Too dark, Too slow and Wrong service.
- Feedback is accepted by the backend. In this MVP patch it is kept in server memory and resets when the backend restarts.

## Apply

Extract outside the Flutter repository. Copy `lib`, `backend`, and `test` into the project root and replace matching files.

Restart the backend after copying.

### Windows backend

```powershell
cd C:\dev\forflicksakes\backend
npm.cmd install
npm.cmd run check
npm.cmd start
```

### Android

```powershell
cd C:\dev\forflicksakes
flutter clean
flutter pub get
flutter analyze
flutter test
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

Test prompts:

- `A completed thriller with no more than 3 seasons`
- `A funny 30-minute series with no romance`
- `A clever mystery like Severance, but not too dark`

For the thriller test, ordinary comedies should not pass. Fewer than five results is acceptable when only a few titles meet every constraint.

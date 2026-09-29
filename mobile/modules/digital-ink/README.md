# Japanese handwriting input

Local Expo module for Android/iOS using ML Kit Digital Ink Recognition. No API key
or backend translation is used. A user-initiated Japanese model download is required
once; subsequent recognition is on device. Cellular downloads are allowed after the
user taps the download button. Download errors/timeouts allow retry (iOS failure is
reported through the 120-second timeout). No model is downloaded just by opening UI.

Search toolbar switches keyboard/handwriting, shows candidates, inserts at the caret
or replaces selection. One stroke undo and clear are available. Late results are
discarded after new drawing/clear/unmount. Native module is optional in Expo Go/Web;
those environments show a rebuild notice and still allow normal keyboard search.

Requires a **new native build**, not only a JS reload/OTA update. iOS minimum is raised
to 15.5 by the config plugin. Android uses ML Kit 19.0.0; iOS GoogleMLKit 8.0.0.
From mobile: `npm install` then use your existing native build workflow. For the
existing EAS internal preview profile: `npx eas-cli build --platform ios --profile preview`
or `--platform android`. Builds may require account credentials/signing and charges;
they are not run automatically by this change.

Device acceptance checks (native compilation and these checks required before release):
1. Focus search: toolbar sits above system keyboard; close/reopen and rotate/tablet.
2. Handwriting before model download: visible opt-in and network failure/retry.
3. Download Japanese model; enable airplane mode; draw 木, 日, 語. Select candidates.
4. Verify insertion/caret/selection, repeated characters and existing searches/history.
5. Undo/clear while recognition is running; no old candidates should reappear.
6. Navigate away during download/recognition and reopen; no stale updates.
7. Expo Go/Web: unsupported notice, keyboard search remains usable.

JS unit tests: `node --test --experimental-default-type=module src/utils/handwriting.test.js`.

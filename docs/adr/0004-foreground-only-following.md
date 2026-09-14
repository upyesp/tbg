# Follow mode is foreground-only in v1

Following a Journey Plan requires the app in the foreground with a Wake Lock keeping the screen awake; background location tracking is not attempted in v1 because browsers — especially iOS Safari — do not provide it. Considered and rejected for v1: a native/hybrid wrapper (App Store distribution) that would enable background tracking but contradicts the PWA-on-GitHub-Pages distribution model; revisit only if users genuinely need pocketed, screen-off tracking. Audio Guidance means the screen being on does not imply the user must look at it.

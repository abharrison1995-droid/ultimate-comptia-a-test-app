# Push this seed into `a--iOS-app`

This folder is the Capacitor iOS product seed. The cloud agent cannot push to
https://github.com/abharrison1995-droid/a--iOS-app (403 — app not installed on that repo).

## Option A — grant Cursor access (best)

1. On GitHub → `a--iOS-app` → **Settings → Collaborators / GitHub Apps**
2. Install / allow the **Cursor** GitHub App on that repository (same as the study PWA repo)
3. Tell the agent to push again

## Option B — push from your Mac

```bash
git clone https://github.com/abharrison1995-droid/a--iOS-app.git
cd a--iOS-app
# copy contents of this _ios-seed folder into the clone (except PUSH_TO_IOS_REPO.md)
cp -R /path/to/_ios-seed/* .
# or from git bundle:
# git clone a-plus-ios-seed.bundle a--iOS-app-seed && cd a--iOS-app-seed
git add -A
git commit -m "Initial Capacitor iOS seed: A+ Revision"
git push -u origin main
```

Then on Mac: `npm install && npx cap sync ios && cd ios/App && pod install && npx cap open ios`

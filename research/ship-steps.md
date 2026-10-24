# Ship steps
From `D:\Hackathon\lifeline-power`, after the 7:20 PM freeze. Do not push before that.
git init
git add .
git commit -m "LifeLine Power"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
GitHub: Settings, Pages, Build and deployment, Source = GitHub Actions.
`.github/workflows/pages.yml` runs `pnpm build` and deploys `dist`.
After the first green run, replace the live-URL placeholder in `README.md`.

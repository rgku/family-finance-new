# Backup & Recovery Plan

## 🛡️ Backup Layers

### Layer 1: Git Remotes
- **GitHub** (Primary): https://github.com/rgku/family-finance-new
- **GitLab** (Mirror): https://gitlab.com/bernardo.ferreira2-group/family-finance-new

### Layer 2: Automated Backups
- **GitLab Mirror**: Auto-sync on every push to main/develop/test
- **Google Drive**: Daily ZIP backup at 2 AM UTC

### Layer 3: Local (Manual)
- OneDrive sync (recommended)
- External drive backup (recommended)

## 📦 What's Backed Up

| Asset | Frequency | Location |
|-------|-----------|----------|
| Code (all branches) | Real-time | GitHub + GitLab |
| Code (ZIP) | Daily | Google Drive |
| Database migrations | Real-time | GitHub + GitLab |
| Supabase (DB) | Manual | Export SQL dumps |

## 🚨 Recovery Procedures

### Scenario 1: GitHub Down
```bash
git clone https://gitlab.com/bernardo.ferreira2-group/family-finance-new.git
cd family-finance-new
git remote add origin https://github.com/rgku/family-finance-new.git
```

### Scenario 2: Local Data Loss
```bash
# From GitHub
git clone https://github.com/rgku/family-finance-new.git

# From GitLab (if GitHub down)
git clone https://gitlab.com/bernardo.ferreira2-group/family-finance-new.git
```

### Scenario 3: Corrupted Code
```bash
# Restore from Google Drive backup
# Download latest ZIP from Drive
# Extract and restore
```

### Scenario 4: Database Loss
```bash
# From Supabase Dashboard:
# SQL Editor → Run migration files from /supabase/migrations
# Or restore from SQL dump (manual backup required)
```

## 🔧 Setup Instructions

### GitLab Mirror (Already configured)
```bash
git remote add gitlab https://gitlab.com/bernardo.ferreira2-group/family-finance-new.git
git push --all gitlab
git push --tags gitlab
```

### GitHub Secrets Required
Go to: https://github.com/rgku/family-finance-new/settings/secrets/actions

Add:
- `GITLAB_PASSWORD`: GitLab account password
- `GDRIVE_BACKUP_PATH`: Path on Google Drive server
- `GDRIVE_HOST`: rsync server host
- `GDRIVE_USER`: rsync username
- `GDRIVE_SSH_KEY`: SSH private key

### OneDrive Sync (Recommended)
1. Move project folder to OneDrive:
   ```
   C:\Users\rgku\OneDrive\Projects\family-finance-new
   ```
2. Or create symlink:
   ```powershell
   New-Item -ItemType SymbolicLink -Path "C:\Users\rgku\OneDrive\Projects\family-finance-new" -Target "C:\Users\rgku\Documents\App\Projecto Antigravity"
   ```

### Local Backup Script (Windows Task Scheduler)
Create `backup-daily.ps1`:
```powershell
$src = "C:\Users\rgku\Documents\App\Projecto Antigravity"
$dst = "D:\Backup\family-finance-new-$(Get-Date -Format 'yyyyMMdd')"
robocopy $src $dst /MIR /XD node_modules .next .git
```

Schedule:
```powershell
schtasks /create /tn "Daily Code Backup" /tr "powershell.exe -File C:\path\to\backup-daily.ps1" /sc daily /st 03:00
```

## ✅ Verification Checklist

- [x] GitLab mirror configured
- [ ] GitHub Actions workflows enabled
- [ ] Google Drive backup configured
- [ ] OneDrive sync active
- [ ] Local backup script scheduled
- [ ] Supabase DB export scheduled (monthly)
- [ ] Test restore procedure (quarterly)

## 📅 Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Verify GitLab sync | Weekly | Auto |
| Check Google Drive backups | Weekly | Auto |
| Test restore from backup | Quarterly | Manual |
| Export Supabase DB | Monthly | Manual |
| Review backup strategy | Annually | Manual |

## 🔗 Important Links

- GitHub: https://github.com/rgku/family-finance-new
- GitLab: https://gitlab.com/bernardo.ferreira2-group/family-finance-new
- Supabase: https://supabase.com/dashboard/project/[project-id]
- GitHub Actions: https://github.com/rgku/family-finance-new/actions

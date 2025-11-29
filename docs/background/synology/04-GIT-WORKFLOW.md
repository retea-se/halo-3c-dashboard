# Git Workflow Guide

Git är konfigurerat och klart på Mittemellan!

## Git-konfiguration

**Användarinformation:**
- **Namn:** Marcus
- **Email:** REDACTED_USERNAME@mittemellan.local
- **Standard branch:** main
- **Editor:** vi

**Visa konfiguration:**
```bash
git config --list
```

## Grundläggande Git-kommandon

### Skapa nytt projekt med Git

```bash
# Kopiera en template
cp -r ~/projects/templates/python-flask ~/projects/my-new-app
cd ~/projects/my-new-app

# Initiera Git
git init

# Gör första commit
git add .
git commit -m "Initial commit"

# Visa status
git status
```

### Dagligt arbetsflöde

```bash
# Se ändringar
git status
git diff

# Stagea ändringar
git add .                    # Alla filer
git add filename.py          # Specifik fil
git add *.js                 # Alla JS-filer

# Commita
git commit -m "Beskrivning av ändring"

# Visa historik
git log
git log --oneline
git log --graph --oneline --all
```

### Branching (rekommenderat för features)

```bash
# Skapa ny branch
git branch feature/new-feature
git checkout feature/new-feature

# Eller i ett kommando:
git checkout -b feature/new-feature

# Arbeta på branchen
git add .
git commit -m "Add new feature"

# Tillbaka till main
git checkout main

# Merga feature
git merge feature/new-feature

# Ta bort branch efter merge
git branch -d feature/new-feature
```

## Remote Repository (GitHub/GitLab)

### Koppla till GitHub

```bash
# 1. Skapa repo på GitHub först (github.com/new)

# 2. Koppla lokalt repo till GitHub
git remote add origin https://github.com/dittanvändarnamn/repo-namn.git
git branch -M main
git push -u origin main

# 3. Framtida pushes
git push
```

### Klona existerande projekt

```bash
cd ~/projects
git clone https://github.com/användarnamn/repo-namn.git
cd repo-namn
```

### Pull/Push workflow

```bash
# Hämta ändringar från remote
git pull

# Pusha dina ändringar
git add .
git commit -m "Your message"
git push
```

### GitHub Personal Access Token

GitHub kräver token istället för lösenord sedan 2021:

1. Gå till GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Ge token namnet "Mittemellan"
4. Bocka i "repo" scope
5. Kopiera token (visas bara en gång!)
6. Använd token som lösenord när du pushar

**Eller spara credentials:**
```bash
git config --global credential.helper store
git push  # Ange token som lösenord, sparas för framtiden
```

## .gitignore

Varje template har redan en `.gitignore`-fil som exkluderar:

### Node.js-projekt
- `node_modules/`
- `/build`
- `.env*`
- `npm-debug.log*`

### Python-projekt
- `__pycache__/`
- `*.pyc`
- `venv/`
- `.env`
- `*.db`

### Alla projekt
- `.vscode/`
- `.idea/`
- `.DS_Store`
- `*.log`

### Lägga till fler ignores

```bash
echo "minfil.log" >> .gitignore
git add .gitignore
git commit -m "Update gitignore"
```

## Best Practices

### Commit Messages

**Bra commits:**
```bash
git commit -m "Add user authentication"
git commit -m "Fix login bug on mobile"
git commit -m "Update dependencies to latest versions"
git commit -m "Refactor database queries for performance"
```

**Dåliga commits:**
```bash
git commit -m "Update"
git commit -m "Fix stuff"
git commit -m "asdf"
git commit -m "WIP"  # (Work In Progress - OK för din lokala branch)
```

### Commit Message Format (rekommenderat)

```
<type>: <short summary>

<optional longer description>

<optional footer>
```

**Types:**
- `feat`: Ny feature
- `fix`: Buggfix
- `docs`: Dokumentation
- `style`: Formatering (ingen kod-ändring)
- `refactor`: Refactoring
- `test`: Tester
- `chore`: Uppdateringar (dependencies, etc)

**Exempel:**
```bash
git commit -m "feat: Add user registration form"
git commit -m "fix: Resolve memory leak in API handler"
git commit -m "docs: Update installation instructions"
```

### Commit ofta

Hellre många små commits än en stor:

```bash
git commit -m "Add login form HTML"
git commit -m "Add login form styling"
git commit -m "Add login form validation"
git commit -m "Connect login form to API"
```

### Branching Strategy

**För solo-projekt:**
- `main` - Stabil, fungerande kod
- `feature/namn` - Nya features
- `fix/namn` - Bugfixar

**Exempel:**
```bash
git checkout -b feature/user-authentication
# ... utveckla ...
git checkout main
git merge feature/user-authentication
```

## Ångra ändringar

### Unstage fil
```bash
git reset HEAD filename.py
```

### Ångra ändringar i fil (inte staged)
```bash
git checkout -- filename.py
```

### Ångra senaste commit (behåll ändringar)
```bash
git reset --soft HEAD~1
```

### Ångra senaste commit (ta bort ändringar - FARLIGT!)
```bash
git reset --hard HEAD~1
```

### Ångra specifik commit
```bash
git revert <commit-hash>
```

## Stash (spara temporärt)

```bash
# Spara ändringar temporärt
git stash

# Visa lista över stashes
git stash list

# Återställ senaste stash
git stash pop

# Återställ specifik stash
git stash apply stash@{0}

# Ta bort stash
git stash drop stash@{0}
```

**Användning:**
```bash
# Du jobbar på feature men måste snabbt fixa en bug
git stash                    # Spara din feature-kod
git checkout main
git checkout -b fix/urgent-bug
# ... fixa bug ...
git checkout feature/my-feature
git stash pop                # Återställ din feature-kod
```

## VS Code Git Integration

När du använder VS Code Remote-SSH har du inbyggt Git-stöd:

### Source Control Panel
- Tryck `Ctrl+Shift+G` eller klicka på Source Control-ikonen
- Se alla ändringar
- Stagea filer med +
- Skriv commit message och tryck ✓
- Push/Pull med ... menyn

### Grafisk Diff-viewer
- Klicka på ändrad fil för att se diff
- Side-by-side jämförelse
- Lätt att se vad som ändrats

### Branch Management
- Klicka på branch-namn i statusfältet (nedre vänstra hörnet)
- Byt branch eller skapa ny
- Se alla branches

### GitLens Extension (rekommenderad)
```bash
code --install-extension eamodio.gitlens
```
- Inline blame annotations
- Commit history
- File history
- Och mycket mer!

## Exempel: Fullständigt projekt-setup

```bash
# 1. Skapa projekt från template
cp -r ~/projects/templates/python-flask ~/projects/todo-app
cd ~/projects/todo-app

# 2. Initiera Git
git init
git add .
git commit -m "Initial commit from Flask template"

# 3. Skapa GitHub repo och koppla
# Gå till github.com/new och skapa "todo-app" repo
git remote add origin https://github.com/dittnamn/todo-app.git
git push -u origin main

# 4. Skapa feature branch
git checkout -b feature/add-tasks

# 5. Utveckla
vi app.py
# ... redigera kod ...
git add app.py
git commit -m "Add task model and routes"

# 6. Testa
docker-compose up --build
# ... testa i webbläsare ...
docker-compose down

# 7. Merge till main
git checkout main
git merge feature/add-tasks

# 8. Push till GitHub
git push

# 9. Ta bort feature branch
git branch -d feature/add-tasks
```

## Hantera flera remotes

```bash
# Lägg till flera remotes
git remote add origin https://github.com/user/repo.git
git remote add backup https://gitlab.com/user/repo.git

# Push till specifik remote
git push origin main
git push backup main

# Lista remotes
git remote -v
```

## Git Tips & Tricks

### Alias för snabbare kommandon
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'

# Nu kan du använda:
git st      # istället för git status
git co main # istället för git checkout main
```

### Visa vacker log
```bash
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
```

### Sök i commits
```bash
# Sök efter text i commit messages
git log --grep="bug fix"

# Sök efter ändringar i kod
git log -S "function_name"
```

### Visa ändringar mellan branches
```bash
git diff main..feature/my-feature
```

## Projektkatalog Git-status

Din `~/projects/`-katalog är redan ett Git-repository:

```bash
cd ~/projects
git status
git log --oneline
```

**Commits:**
1. Initial commit: Project structure and documentation
2. Add project templates for nodejs-react, nodejs-express, python-flask, and static-nginx
3. Add Git workflow documentation

## Felsökning

### "fatal: not a git repository"
**Lösning:** Du är inte i ett git-repo. Kör `git init` eller `cd` till rätt mapp.

### Merge conflicts
```bash
# Vid konflikt:
git status                # Se vilka filer har konflikt
vi conflicted-file.py     # Redigera och lös konflikt
git add conflicted-file.py
git commit -m "Resolve merge conflict"
```

### Ångra allt och börja om
```bash
git fetch origin
git reset --hard origin/main
```

### .gitignore fungerar inte för redan trackade filer
```bash
# Ta bort från Git men behåll lokalt
git rm --cached filename
git commit -m "Remove file from tracking"
```

## Hjälp och resurser

### Git Hjälp
```bash
git help
git help commit
git help branch
```

### Online-resurser
- **Official docs:** https://git-scm.com/doc
- **Interaktiv tutorial:** https://learngitbranching.js.org/
- **Felsökning:** https://ohshitgit.com/
- **Cheat sheet:** https://education.github.com/git-cheat-sheet-education.pdf

### Pro Git Book (gratis)
https://git-scm.com/book/en/v2

---

**Pro tip:** Använd `git status` ofta - det är ditt bästa verktyg för att förstå vad som händer!

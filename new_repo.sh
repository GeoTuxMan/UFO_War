#!/bin/bash

# ====== INPUT USER ======
read -p "Nume proiect (ex: MatrixCalc): " PROJECT_NAME
read -p "Descriere proiect: " PROJECT_DESC

# ====== INIT GIT ======
git init

# ====== CREATE .gitignore ======
cat <<EOF > .gitignore
node_modules/
.expo/
.expo-shared/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
android/
ios/
dist/
.env
EOF

# ====== FIRST COMMIT ======
git add .
git commit -m "Initial commit - $PROJECT_NAME"

# ====== CREATE GITHUB REPO ======
gh repo create "$PROJECT_NAME" \
  --description "$PROJECT_DESC" \
  --public \
  --source=. \
  --remote=origin \
  --push

# ====== ENSURE MAIN BRANCH ======
git branch -M main
git push -u origin main

echo "✅ Repo GitHub creat si proiect urcat cu succes!"

#!/bin/bash
# Publie le site : commit + push sur main, déclenche le déploiement GitHub Pages.
# Usage : ./publish.sh "message de commit"   (message optionnel)
set -e

cd "$(dirname "$0")"

branch="$(git branch --show-current)"
if [ "$branch" != "main" ]; then
  echo "Attention : tu es sur la branche '$branch', pas 'main'."
  read -p "Basculer sur main maintenant ? (o/n) " reponse
  if [ "$reponse" = "o" ]; then
    git checkout main
  else
    echo "Annulé."
    exit 1
  fi
fi

message="${1:-mise à jour du site}"

git add -A

if git diff --cached --quiet; then
  echo "Rien à committer."
else
  git commit -m "$message"
fi

git push origin main

echo ""
echo "Publié. GitHub Pages redéploie en 1-2 minutes → https://victorkieny.fr"

# Prompt.md

Outil utilisé : Claude (claude.ai)

## 1. Exploration du projet

**Prompt :** "J'ai un test technique de dév, voici les consignes et le projet. J'aimerais que tu m'indiques comment commencer, ce que je dois savoir."

J'ai fourni l'archive zip du test pour avoir une vue d'ensemble rapide : modèles Prisma, routes Express, relations entre entités, seed. Ça m'a permis de comprendre l'architecture sans lire chaque fichier un par un et d'identifier directement les points d'attention (le TODO sur stats, la structure du seed, les endpoints existants).

## 2. Identification des bugs

J'ai testé les endpoints manuellement pour repérer les comportements anormaux :

```powershell
# Test du 404 → renvoie 200 { data: null } au lieu d'un 404
Invoke-RestMethod http://localhost:3000/api/sessions/id-qui-nexiste-pas

# Test de la capacité → accepte les inscriptions à l'infini
$body = '{"firstName":"Test","lastName":"Bug","birthDate":"2010-01-01"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/sessions/{id}/participants -Body $body -ContentType "application/json"

# Vérification du N+1 dans les logs
docker compose logs -f api
```

**Prompt :** "J'ai ça quand je regarde les logs" + copie des logs montrant la cascade de SELECT COUNT(*)

J'ai partagé mes observations avec Claude pour confirmer mes hypothèses. Il a validé les 3 bugs et confirmé que le `Promise.all` avec des requêtes individuelles était bien un pattern N+1.

## 3. Corrections et vérification

**Prompt (bug 404) :** "Aller go, d'abord le 404"

**Prompt (bug allocatedPlaces) :** "Okay c'est bon, ensuite"

**Prompt (bug N+1) :** demande de la syntaxe `include` + `_count` Prisma

Pour chaque correction, j'ai utilisé Claude comme filet de sécurité : je lui soumets ma correction pour vérifier que je n'introduis pas de nouveau bug ou de problème de conception. Par exemple pour la transaction sur allocatedPlaces, Claude a confirmé que `prisma.$transaction` + `{ increment: 1 }` était la bonne approche pour éviter les race conditions.

Après chaque fix, je rebuild et reteste :

```powershell
docker compose up --build

# Vérification bug 1 : 404 OK
Invoke-RestMethod http://localhost:3000/api/sessions/id-qui-nexiste-pas
# → {"error":"Session introuvable."}

# Vérification bug 2 : capacité max respectée
# Après 5 POST successifs sur une session de capacité 5 :
# → {"error":"Cette session est complète."}
```

## 4. Endpoint stats

**Prompt :** "Okay go pour l'exercice 2" + copie des règles métier du sujet

J'ai décrit les règles métier et demandé une proposition de structure. Claude a suggéré un `findUnique` avec `include` imbriqué (participants → originSchool + convention) puis calculs en mémoire. J'ai intégré le code en vérifiant chaque règle métier, et testé :

```powershell
# Test stats sur une session existante
Invoke-RestMethod http://localhost:3000/api/sessions/{id}/stats
# → sessionId, totalParticipants: 17, byStatus, conventionRate: 0.14, topOriginSchools OK

# Test 404 sur stats
Invoke-RestMethod http://localhost:3000/api/sessions/id-bidon/stats
# → {"error":"Session introuvable."}
```

## 5. Rédaction du Note.md

**Prompt :** "J'aimerais structurer mes notes à partir des bugs identifiés et corrigés"

Claude m'a aidé à mettre en forme le Note.md. Le contenu technique vient de mon travail pendant le test, Claude a aidé sur la rédaction et la structuration.

## Bilan

Mon utilisation de Claude sur ce test se résume à 3 choses : scanner un projet inconnu rapidement, vérifier de la syntaxe Prisma que je ne connais pas par cœur, et servir de filet de sécurité pour m'assurer que mes corrections n'introduisent pas de régressions ou de mauvais patterns. L'analyse des bugs, les tests manuels et les décisions techniques restent de mon côté.
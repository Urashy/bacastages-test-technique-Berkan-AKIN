# Test technique — Développeur·se alternant·e

## Contexte

Bacastages est une plateforme permettant aux lycées et collèges d'organiser des **ministages** : des sessions courtes permettant à des élèves de découvrir des filières dans d'autres établissements.

Cette API gère les sessions et les inscriptions des participants.

---

## Démarrage

```bash
docker compose up --build
```

L'API démarre sur **http://localhost:3000**. Les données de test sont automatiquement chargées au premier démarrage.

### Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | État de l'API |
| GET | `/api/sessions` | Liste des sessions (`?status=OPEN\|CLOSED\|CANCELLED`) |
| GET | `/api/sessions/:id` | Détail d'une session |
| POST | `/api/sessions/:id/participants` | Inscrire un participant |
| GET | `/api/sessions/:id/stats` | **À implémenter** |

Body pour `POST /api/sessions/:id/participants` :
```json
{
  "firstName": "Emma",
  "lastName": "Martin",
  "birthDate": "2010-03-15",
  "originSchoolId": "uuid-optionnel"
}
```

---

## Exercice 1 — Débogage (environ 45 min)

Des bugs ont été introduits dans l'API. Trouvez-les et corrigez-les.

**Conseils :**
- Testez chaque endpoint avec des cas normaux et des cas limites
- Les logs de l'API sont utiles : `docker compose logs -f api`
- Interrogez directement la base si nécessaire (port 5432, user/password : `test`)

Pour chaque bug trouvé, documenter dans `Note.md` :
1. L'endpoint concerné
2. Ce qui ne fonctionne pas et quel est l'impact
3. Votre correction et pourquoi elle est correcte

---

## Exercice 2 — Développement (environ 45 min)

Implémentez `GET /api/sessions/:id/stats`.

### Réponse attendue (200 OK)

```json
{
  "sessionId": "uuid",
  "totalParticipants": 12,
  "byStatus": {
    "registered": 8,
    "cancelled": 2,
    "attended": 1,
    "absent": 1
  },
  "conventionRate": 0.75,
  "topOriginSchools": [
    { "schoolId": "uuid", "schoolName": "Lycée Jean Moulin", "count": 4 },
    { "schoolId": "uuid", "schoolName": "Lycée Marie Curie", "count": 3 }
  ]
}
```

### Règles métier

- `conventionRate` : proportion de participants **non-annulés** ayant une convention au statut `VALIDATED` (arrondi à 2 décimales)
- `topOriginSchools` : jusqu'à 3 établissements d'origine, comptant uniquement les participants **non-annulés**, triés par nombre décroissant
- Retourner `404` si la session n'existe pas

### Contrainte technique

L'implémentation ne doit pas générer de requêtes N+1.

---

## Livrables

Votre dépôt Git doit contenir :

- Le code corrigé et l'endpoint implémenté
- **`Note.md`** — pour chaque bug : description, impact, correction justifiée ; et les choix techniques faits pour l'exercice 2
- **`Prompt.md`** — tous les prompts utilisés avec un outil IA (ChatGPT, Claude, Copilot…), avec pour chaque prompt ce qu'il vous a apporté ou non

**Critères d'évaluation :**
- Bugs identifiés, expliqués et correctement corrigés
- Qualité et lisibilité du code ajouté
- Gestion des erreurs et des cas limites
- `docker compose up --build` fonctionne sans manipulation manuelle
- Clarté de `Note.md` et honnêteté de `Prompt.md`

---

*Bonne chance !*

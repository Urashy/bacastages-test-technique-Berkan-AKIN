# Note.md

## Exercice 1 — Bugs trouvés

### Bug 1 : GET /api/sessions/:id ne renvoie pas de 404

Quand on fait un GET avec un ID qui n'existe pas, l'API renvoie `200 { data: null }` au lieu d'un 404. C'est problématique parce que le client ne peut pas distinguer une erreur d'une réponse valide sans checker manuellement si data est null.

**Fix :** j'ai ajouté un `if (!session)` avant le `res.json()` pour renvoyer un 404 avec un message d'erreur, comme c'est déjà fait dans le POST participants.

### Bug 2 : allocatedPlaces jamais incrémenté (POST /participants)

C'est le plus gros bug. Quand on inscrit un participant, `allocatedPlaces` n'est jamais mis à jour. Du coup le check `allocatedPlaces >= maxCapacity` est toujours faux et on peut inscrire autant de participants qu'on veut, même si la session est pleine.

**Fix :** j'ai wrappé le `create` du participant et un `update` de la session (avec `{ increment: 1 }`) dans une `prisma.$transaction`. Comme ça les deux opérations sont atomiques, et si l'une plante l'autre est annulée.

### Bug 3 : N+1 sur GET /api/sessions

Le listing des sessions fait un `Promise.all` qui lance 2 requêtes par session (une pour l'école, une pour le count des participants). Avec 20 sessions ça fait ~40 requêtes au lieu d'une seule. J'ai vérifié dans les logs Docker, on voit bien la cascade de `SELECT COUNT(*)`.

**Fix :** j'ai remplacé le `Promise.all` + boucle par un seul `findMany` avec `include: { hostSchool: true, _count: { select: { participants: true } } }`. Ensuite un simple `.map()` pour reformater la réponse dans le même format qu'avant.

## Exercice 2 — Endpoint stats

### Approche

Pour éviter le N+1, je fais un seul `findUnique` avec un `include` imbriqué qui récupère les participants + leur école d'origine + leur convention en une fois. Ensuite tous les calculs se font en mémoire sur le tableau de participants.

J'ai choisi de calculer côté JS plutôt qu'en SQL (groupBy etc.) parce que le volume de données par session est petit (quelques dizaines de participants max) et c'est beaucoup plus lisible.

Pour le `conventionRate`, je filtre les non-annulés puis je calcule la proportion avec une convention VALIDATED. J'ai géré le cas où il n'y a aucun participant non-annulé pour éviter la division par zéro.

Pour `topOriginSchools`, j'agrège avec une Map, je trie par count décroissant et je prends les 3 premiers. Les participants sans école d'origine sont ignorés.

### Avec plus de temps

- Des tests (Jest ou Vitest) sur les cas limites : session vide, tous les participants annulés, pas de conventions
- Validation du format UUID sur les params pour éviter des erreurs 500 inutiles
- De la pagination sur le GET /api/sessions
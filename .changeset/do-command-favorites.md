---
'@viamrobotics/test-widgets': minor
---

Add optional `favorites`, `onAddFavorite`, `onRemoveFavorite`, and `onRenameFavorite` props to `DoCommandWidget`. When any are provided:

- An "Add favorite" button renders beneath Execute with a star icon (outline when the current input is not yet saved, filled when it matches a saved favorite).
- A "Favorite Commands" list renders beneath the input/output row as full-width rows. Each row shows the favorite name (click to populate the input), an optional `createdOn` timestamp, and a kebab menu with Rename and Delete actions.
- New favorites are auto-named `Favorite N`; consumers can override the name when persisting.
- `FavoriteDoCommand` now includes an optional `createdOn: Date` used for the timestamp column.

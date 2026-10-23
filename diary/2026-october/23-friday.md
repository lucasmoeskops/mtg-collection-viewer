# Friday, october 23rd 2026

## Rediscovering the basic land history

Today the diary begins, and it opens with a small archaeological dig. Returning after a long pause, I found uncommitted work in the repository: a migration dated the 24th of June, and changes spread over `decks.ts`, `DeckHistory.tsx` and the `DeckHistoryEntry` type. Read together they told a clear story. The deck history only logged cards moving between roles, so changing the number of Forests in a deck left no trace. The half-finished work closes that gap. Each history entry now has an `action_type`, and a `basic_land` entry records the old and new count, so the history panel can say "Changed Swamp count from 3 to 5".

To my relief, the work was nearly complete and true to the original design. Swapping "from" and "to" still yields the inverse of any action, so the road to undo stays open. Two loose ends remained. Negative input would have been logged as a count of -1, and `CLAUDE.md` did not yet describe the new columns. Both are now fixed, and lint and the typecheck pass for the touched files. Whether the migration was ever applied to the database is still to be verified.

### Decision: how to treat a negative land count

- **Reject it with an error**: strict, but the delete-on-zero behaviour already treats it as "none".
- **Clamp to zero before logging** (chosen): the log now matches what is actually stored, which is what a history should do.

### Decision: formatting noise

Running Prettier on `decks.ts` reflowed many unrelated lines to its default 80-character width.

- **Keep the reformat**: technically what `npm run fix` would produce.
- **Revert to only the intended changes** (chosen): a feature diff should tell one story. Reconciling the Prettier width with the 140-character ESLint limit is a separate chore.

It is good to find that past work was left in a state that could still be read and finished. Onwards.

---

Author: Lucas Moeskops <lucasmoeskops@gmail.com>
Co-author: Claude Opus 5.5 <noreply@anthropic.com>

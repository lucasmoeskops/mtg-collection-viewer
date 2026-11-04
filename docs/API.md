# Grimorium HTTP API

A small, read-only JSON API. It currently serves the value of a collection over time, for the whole collection or for the
cards of one set. The same specification is shown in the app at `/<username>/api` (`src/app/[username]/api/page.tsx`);
keep both in sync.

## Authentication

Every request needs the account's API key in the `Authorization` header:

```
Authorization: Bearer <api key>
```

The key belongs to one account and only works for that account's username in the URL. Accounts have no API key by
default; the administrator hands them out:

```sql
UPDATE mtg_account SET api_key = gen_random_uuid()::TEXT WHERE username = '<name>' RETURNING api_key;
-- Revoke: UPDATE mtg_account SET api_key = NULL WHERE username = '<name>';
```

The API key is separate from the login key: sharing it with a script or service does not give access to the app.

## Endpoints

### `GET /api/<username>/collection-value`

Value of the whole collection at every weekly price update.

### `GET /api/<username>/collection-value/<set>`

Value of the account's cards from one set at every weekly price update. `<set>` is a
[Scryfall set code](https://scryfall.com/sets) such as `mh3` or `dsk` (case-insensitive, 2–6 letters or digits). Price
updates at which the account owned no cards of the set are included with a value of 0.

### Query parameters (both endpoints)

| Parameter | Format                                        | Meaning                                                              |
| --------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `from`    | `YYYY-MM-DD` or ISO timestamp, e.g. `2026-01-01T12:00:00Z` | Optional. Only price updates at or after this moment.  |
| `to`      | `YYYY-MM-DD` or ISO timestamp                 | Optional. Only price updates at or before this moment. A date without a time includes that whole day (UTC). |

### Response

```json
{
  "username": "alice",
  "set": "mh3",
  "currency": "EUR",
  "from": "2026-01-01T00:00:00.000Z",
  "to": null,
  "values": [
    { "timestamp": "2026-03-01T23:00:00.000Z", "valueCents": 1300, "cardCount": 3, "pricedCount": 3, "estimated": true },
    { "timestamp": "2026-06-28T22:00:00.000Z", "valueCents": 2000, "cardCount": 4, "pricedCount": 4, "estimated": false }
  ]
}
```

| Field                  | Meaning                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `set`                  | Only present on the per-set endpoint, lowercased.                                                         |
| `currency`             | Always `EUR`. Dollar prices are converted with the exchange rate of that price update.                   |
| `from`, `to`           | The applied bounds, or `null` when not given.                                                             |
| `values`               | One entry per price update, oldest first.                                                                 |
| `values[].timestamp`   | The moment the prices of this update represent.                                                           |
| `values[].valueCents`  | Total value in euro cents: per card the latest known price at that moment, times the amount owned.       |
| `values[].cardCount`   | Number of cards counted (including duplicates).                                                           |
| `values[].pricedCount` | How many of those had a known price. Cards without a price count as 0, so a low ratio means a low value. |
| `values[].estimated`   | `false`: recorded right at the price update with the collection as it was then. `true`: calculated later with the collection as it was at that later moment, so cards bought or sold since are included or missing. |

### Errors

Errors return a JSON body `{ "error": "<message>" }`.

| Status | When                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| 400    | `from` or `to` is not a valid date, `from` is after `to`, or the set code is malformed. |
| 401    | The header is missing, the key is wrong, or the key belongs to another account.   |
| 404    | The set code is not known in the card catalogue.                                  |

## Example

```bash
curl -H "Authorization: Bearer $GRIMORIUM_API_KEY" \
  "https://<host>/api/alice/collection-value/mh3?from=2026-01-01&to=2026-06-30"
```

## Notes

- Prices are updated weekly, so values are weekly too. Responses are not cached by the server (`Cache-Control: no-store`);
  the values themselves are, so repeated requests are cheap.
- The first request for an account may take a little longer while missing historical values are calculated.

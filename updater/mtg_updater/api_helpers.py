from operator import itemgetter
from typing import Optional
from .helpers import normalize_collector_number
from .models import MTGCard, MTGSet


def find_set_by_code(code: str) -> Optional[MTGSet]:
    from .api_data import get_sets
    sets = get_sets()
    for s in sets:
        if s.code == code:
            return s
    return None


def mtg_card_from_card_data(card_data) -> MTGCard:
    mtg_set = find_set_by_code(card_data["set"])
    if len(card_data.get('card_faces') or []) > 1:
        card_data['mana_cost'] = ''.join(map(itemgetter('mana_cost'), card_data['card_faces']))
        card_data['oracle_text'] = ''.join(map(itemgetter('oracle_text'), card_data['card_faces']))
        if 'artist' in card_data.get('card_faces'):
            card_data['artist'] = ' // '.join(set(map(itemgetter('artist'), card_data['card_faces'])))
    return MTGCard(
        id=card_data["id"],
        set_code=card_data["set"],
        set_name=mtg_set.name,
        name=card_data["name"],
        card_number=normalize_collector_number(card_data["collector_number"]),
        language=card_data["lang"],
        preview_url=card_data.get("image_uris", {}).get("normal") or card_data.get("card_faces", [{}])[0].get("image_uris", {}).get("normal"),
        card_type=card_data["type_line"],
        cardmarket_url=card_data.get("purchase_uris", {}).get("cardmarket"),
        rarity=card_data["rarity"],
        prices={key: val for key, val in card_data["prices"].items() if val},
        release_date=mtg_set.release_date,
        is_token=card_data["set_type"] == "token",
        colors=card_data["color_identity"],
        artist=card_data["artist"],
        mana_cost=card_data["mana_cost"],
        oracle_text=card_data["oracle_text"]
    )
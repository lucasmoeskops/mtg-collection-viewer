from .models import MTGCard
from typing import Dict


def mtg_card_to_json(mtg_card: MTGCard) -> Dict:
    return {
        "id": mtg_card.id,
        "set_code": mtg_card.set_code,
        "set_name": mtg_card.set_name,
        "name": mtg_card.name,
        "card_number": mtg_card.card_number,
        "language": mtg_card.language,
        "preview_url": mtg_card.preview_url,
        "prices": mtg_card.prices,
    }
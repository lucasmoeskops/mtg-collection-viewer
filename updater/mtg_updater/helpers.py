from datetime import datetime, timedelta
from math import ceil
from .models import MTGCardData, MTGCardPrice, MTGPriceImport


def get_mtg_card_price_estimate(prices: dict, is_foil: bool, dollar_per_euro: float = None) -> int:
    def convert_price(price, is_dollar=False):
        base = int(price.replace('.', ''))
        return int(ceil(base * dollar_per_euro)) if is_dollar and dollar_per_euro else base

    if is_foil:
        if price := prices.get('eur_foil'):
            return convert_price(price)
        if dollar_per_euro and (price := prices.get('usd_foil')):
            return convert_price(price, is_dollar=True)
    if price := prices.get('eur'):
        return convert_price(price)
    if dollar_per_euro and (price := prices.get('usd')):
        return convert_price(price, is_dollar=True)
    return 1


def update_mtg_price_point_from_mtg_card(prices: dict, instance: MTGCardData, dollar_per_euro: float, timestamp: datetime, price_import: MTGPriceImport = None):
    if not instance.id:
        # Instance needs to be saved first
        raise ValueError("MTG Card Data instance needs to be saved first")

    actual_price_cents = get_mtg_card_price_estimate(prices=prices, is_foil=instance.is_foil, dollar_per_euro=dollar_per_euro)
    non_foil_price_cents = get_mtg_card_price_estimate(prices=prices, is_foil=False, dollar_per_euro=dollar_per_euro) if instance.is_foil else actual_price_cents

    # Replaying an old price file (e.g. to add history for new cards) must not overwrite the current estimate
    is_newest_price = not MTGCardPrice.objects.filter(mtg_data=instance, timestamp__gt=timestamp + timedelta(days=5)).exists()
    if is_newest_price and instance.price_estimate != actual_price_cents:
        instance.price_estimate = actual_price_cents
        instance.save()

    # We update prices max 1 time per week
    if existing := MTGCardPrice.objects.filter(mtg_data=instance, timestamp__gt=timestamp-timedelta(days=5), timestamp__lt=timestamp+timedelta(days=5)).first():
        if (
            existing.price_cents == actual_price_cents
            and existing.non_foil_price_cents == non_foil_price_cents
            and existing.timestamp == timestamp
            and existing.price_import_id == (price_import and price_import.id)
        ):
            return

        existing.timestamp = timestamp
        existing.price_cents = actual_price_cents
        existing.non_foil_price_cents = non_foil_price_cents
        existing.price_import = price_import
        existing.save()

        return

    MTGCardPrice.objects.create(
        mtg_data=instance,
        price_import=price_import,
        timestamp=timestamp,
        price_cents=actual_price_cents,
        non_foil_price_cents=non_foil_price_cents,
    )


def normalize_collector_number(collector_number: str) -> str:
    return collector_number

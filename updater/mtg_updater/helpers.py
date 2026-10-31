from datetime import datetime, timedelta
from math import ceil
from typing import List
from .models import MTGCard, MTGCardData, MTGCardPrice, MTGPriceImport


def update_mtg_card_data_instance_from_mtg_card(instance: MTGCardData, mtg_card: MTGCard, dollar_per_euro: float = None) -> List[str]:
    changes = []

    if instance.series != mtg_card.set_code:
        changes.append(f'Set: {instance.series} => {mtg_card.set_code}')
        instance.series = mtg_card.set_code

    if instance.cardnumber != mtg_card.card_number:
        changes.append(f'Card number: {instance.cardnumber} => {mtg_card.card_number}')
        instance.cardnumber = mtg_card.card_number

    if instance.name != mtg_card.name:
        changes.append(f'Name: {instance.name} => {mtg_card.name}')
        instance.name = mtg_card.name

    if instance.card_type != mtg_card.card_type:
        changes.append(f'Card type: {instance.card_type} => {mtg_card.card_type}')
        instance.card_type = mtg_card.card_type

    if instance.rarity != mtg_card.rarity:
        changes.append(f'Rarity: {instance.rarity} => {mtg_card.rarity}')
        instance.rarity = mtg_card.rarity

    if instance.image_url != mtg_card.preview_url:
        changes.append(f'Image Url: {instance.image_url} => {mtg_card.preview_url}')
        instance.image_url = mtg_card.preview_url

    if instance.cardmarket_url != mtg_card.cardmarket_url:
        changes.append(f'Cardmarket Url: {instance.cardmarket_url} => {mtg_card.cardmarket_url}')
        instance.cardmarket_url = mtg_card.cardmarket_url

    if instance.release_date != mtg_card.release_date:
        changes.append(f'Release date: {instance.release_date} => {mtg_card.release_date}')
        instance.release_date = mtg_card.release_date

    if instance.is_token != mtg_card.is_token:
        changes.append(f'Is token: {instance.is_token} => {mtg_card.is_token}')
        instance.is_token = mtg_card.is_token

    if instance.colors != mtg_card.colors:
        changes.append(f'Colors: {instance.colors} => {mtg_card.colors}')
        instance.colors = mtg_card.colors

    price_estimate = get_mtg_card_price_estimate(mtg_card.prices, instance.is_foil, dollar_per_euro=dollar_per_euro)
    if instance.price_estimate != price_estimate:
        changes.append(f'Price estimate: {instance.price_estimate} => {price_estimate}')
        instance.price_estimate = price_estimate

    if instance.artist != mtg_card.artist:
        changes.append(f'Artist: {instance.artist} => {mtg_card.artist}')
        instance.artist = mtg_card.artist

    if instance.manacost != mtg_card.mana_cost:
        changes.append(f'Mana cost: {instance.manacost} => {mtg_card.mana_cost}')
        instance.manacost = mtg_card.mana_cost

    if instance.text != mtg_card.oracle_text:
        changes.append(f'Text: {instance.text} => {mtg_card.oracle_text}')
        instance.text = mtg_card.oracle_text

    return changes


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

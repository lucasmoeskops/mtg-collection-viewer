from django.db import models
from django.contrib.postgres.fields import ArrayField
from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Optional


@dataclass
class MTGSet:
    code: str
    name: str
    release_date: date


@dataclass
class MTGCard:
    id: str
    set_code: str
    set_name: str
    name: str
    card_number: str
    language: str
    preview_url: Optional[str]
    card_type: str
    cardmarket_url: str
    rarity: str
    prices: Dict[str, str]
    release_date: date
    is_token: bool
    colors: List[str]
    oracle_text: str
    artist: str
    mana_cost: str


class MTGCardDataManager(models.Manager):
    def get_unique(self, set_code, card_number, is_foil):
        return self.get(series=set_code, cardnumber=card_number, is_foil=is_foil)


class MTGCardData(models.Model):
    series = models.CharField(max_length=255)
    cardnumber = models.CharField(max_length=30)
    is_foil = models.BooleanField()

    name = models.CharField(max_length=255)
    rarity = models.CharField(max_length=30)
    card_type = models.CharField(max_length=100)
    cardmarket_url = models.URLField(max_length=255)
    image_url = models.URLField(max_length=255)
    price_estimate = models.PositiveBigIntegerField()
    is_token = models.BooleanField()
    release_date = models.DateField()
    colors = ArrayField(models.CharField())
    manacost = models.TextField()
    artist = models.TextField()
    text = models.TextField()

    objects = MTGCardDataManager()

    class Meta:
        db_table = 'mtg_data'
        unique_together = (('series', 'cardnumber', 'is_foil'),)
        managed = False


class AccountCard(models.Model):
    account = models.PositiveIntegerField()
    card = models.PositiveIntegerField()
    amount = models.PositiveIntegerField()

    class Meta:
        db_table = 'mtg_account_card'
        managed = False


class MTGPriceImport(models.Model):
    price_timestamp = models.DateTimeField()
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True)
    source_file = models.TextField(null=True)
    dollar_per_euro = models.DecimalField(max_digits=10, decimal_places=6, null=True)
    cards_updated = models.IntegerField(null=True)

    class Meta:
        db_table = 'mtg_price_import'
        managed = False


class MTGCardPrice(models.Model):
    mtg_data = models.ForeignKey(MTGCardData, on_delete=models.SET_NULL, null=True, related_name='prices')
    price_import = models.ForeignKey(MTGPriceImport, on_delete=models.SET_NULL, null=True, db_column='import_id')
    timestamp = models.DateTimeField()
    price_cents = models.PositiveIntegerField()
    non_foil_price_cents = models.PositiveIntegerField()

    class Meta:
        db_table = 'mtg_price'
        managed = False

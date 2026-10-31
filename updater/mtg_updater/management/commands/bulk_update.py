import json
from collections import defaultdict
from datetime import timedelta
from dateutil.parser import parse
from django.core.management import BaseCommand
from django.db import connection, transaction
from django.utils.timezone import make_aware, now
from ...models import MTGCardData, MTGCardPrice, MTGPriceImport
from ...helpers import normalize_collector_number, update_mtg_price_point_from_mtg_card


def log(*args, verbose=True, **kwargs):
    if verbose:
        print(*args, **kwargs)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("file")
        parser.add_argument("dollar_per_euro")
        parser.add_argument("timestamp")
        parser.add_argument("--newest", default=0, type=int)
        parser.add_argument("--verbose", action='store_true')
        return super().add_arguments(parser)
    
    def handle(self, *args, file, dollar_per_euro, timestamp, **options):
        print('Got', file, dollar_per_euro, timestamp)
        newest = options.get('newest') or 9999999
        verbose = options.get('verbose') or False
        dollar_per_euro = float(dollar_per_euro)
        if not (.1 < dollar_per_euro < 10):
            raise Exception(f'Unexpectedly weird currency exchange: {dollar_per_euro}')
        timestamp = make_aware(parse(timestamp))
        timestamp_date = timestamp.date()
        is_recent = now() - timedelta(days=5) < timestamp < now() + timedelta(days=1)
        all_data = json.loads(open(file, 'rb').read())
        price_import = start_price_import(file, dollar_per_euro, timestamp)
        lookup = defaultdict(list)
        for i, card in enumerate(all_data):
            lookup[card['set'], normalize_collector_number(card['collector_number'])].append(i)
        card_data_qs = MTGCardData.objects.all().order_by('-id')
        count = min(newest, card_data_qs.count())
        for i, card_data_instance in enumerate(card_data_qs[:newest]):
            if card_data_instance.release_date >= timestamp_date:
                card_data_instance.prices.filter(timestamp__lte=timestamp).delete()
                continue
            follow_indices = lookup.get((card_data_instance.series, card_data_instance.cardnumber))
            if not follow_indices:
                continue
            follow_indices.sort(key=lambda i: all_data[i]['collector_number'])
            card_data = all_data[follow_indices[0]].copy()
            for index in follow_indices[1:]:
                for key, val in all_data[index]['prices'].items():
                    if card_data['prices'].get(key) is None:
                        card_data['prices'][key] = val
            update_mtg_price_point_from_mtg_card(prices=card_data['prices'], instance=card_data_instance, dollar_per_euro=dollar_per_euro, timestamp=timestamp, price_import=price_import)
            log(f'\r{i}/{count}', end='', verbose=verbose)
        log(f'\r{count}/{count}', verbose=verbose)
        # Only a recent import sees ownership as it is at price time; older ones are estimates
        finish_price_import(price_import, source='snapshot' if is_recent else 'backfill')
        log(f'Price import {price_import.id} finished, collection values updated', verbose=verbose)
        log('Finished!', verbose=verbose)


def start_price_import(file, dollar_per_euro, timestamp):
    # Mirrors the price point deduplication: one import per +-5 day window, re-running a file reuses it
    price_import = MTGPriceImport.objects.filter(
        price_timestamp__gt=timestamp - timedelta(days=5),
        price_timestamp__lt=timestamp + timedelta(days=5),
    ).order_by('-price_timestamp').first() or MTGPriceImport(price_timestamp=timestamp)
    price_import.price_timestamp = max(price_import.price_timestamp, timestamp)
    price_import.started_at = now()
    price_import.finished_at = None
    price_import.source_file = file
    price_import.dollar_per_euro = dollar_per_euro
    price_import.save()
    return price_import


def finish_price_import(price_import, source):
    cards_updated = MTGCardPrice.objects.filter(price_import=price_import).count()
    # One transaction, database clock: finished_at must equal calculated_at, otherwise the app sees the values as outdated
    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            'UPDATE mtg_price_import SET finished_at = now(), cards_updated = %s WHERE id = %s',
            [cards_updated, price_import.id],
        )
        cursor.execute('SELECT compute_collection_values(%s, %s)', [price_import.id, source])

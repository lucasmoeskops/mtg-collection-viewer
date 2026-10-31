from requests import HTTPError, get
from .models import MTGCard, MTGSet
from datetime import date
from dateutil.parser import parse
from logging import getLogger
from operator import attrgetter
from django.utils.timezone import now
from time import sleep
from urllib.parse import urlencode
from .api_helpers import find_set_by_code, mtg_card_from_card_data

_sets = None
_cards = None
_last_api_call = now()

time_inbetween_api_calls = 250

logger = getLogger("mtg_updater.api_data")


def get_sets():
    if _sets is None:
        refresh_sets()
    return _sets


def refresh_sets():
    global _sets
    json = do_api_call_for_json('https://api.scryfall.com/sets/')
    sets = []
    for set_data in json.get('data') or []:
        try:
            sets.append(MTGSet(
                code=set_data.get("code", "?"),
                name=set_data.get("name", "?"),
                release_date=parse(set_data.get("released_at", "2000-01-01")).date(),
            ))
        except:
            logger.error("Unable to parse set data: ", set_data)
    sets.sort(key=attrgetter('release_date'), reverse=True)
    if not sets and _sets:
        return
    _sets = sets


def get_card_by_id(id: str):
    url = f'https://api.scryfall.com/cards/{id}'
    json = do_api_call_for_json(url)
    return mtg_card_from_card_data(json)


def search_for_cards(query: str, set_code: str = ""):
    url = 'https://api.scryfall.com/cards/search'
    params = {
        "q": query,
        "unique": "prints",
    }
    if set_code:
        params["q"] += f" s:{set_code}"
    url += '?' + urlencode(params)
    try:
        json = do_api_call_for_json(url)
    except HTTPError:
        url = 'https://api.scryfall.com/cards/named'
        params = {
            "fuzzy": query,
        }
        if set_code:
            params["set"] = set_code
        url += '?' + urlencode(params)
        json = do_api_call_for_json(url)
        json = {"data": [json]}
    cards = []
    for card_data in json.get("data") or []:
        try:
            cards.append(mtg_card_from_card_data(card_data))
        except Exception as e:
            logger.error("Unable to parse card data: ", card_data, e)
    return cards


def do_api_call_for_json(url):
    print(url)
    global _last_api_call
    wait_time = max(0, time_inbetween_api_calls - (now() - _last_api_call).total_seconds() / 1000)
    if wait_time:
        sleep(time_inbetween_api_calls/1000)
    response = get(url)
    _last_api_call = now()
    response.raise_for_status()
    json = response.json()
    return json

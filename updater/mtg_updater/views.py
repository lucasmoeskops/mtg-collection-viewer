from django.views.generic.edit import CreateView
from django.http.response import JsonResponse
from django.urls import reverse
from .api_data import get_sets, search_for_cards
from .forms import UpdateForm
from .serializers import mtg_card_to_json


class MTGCardCreateView(CreateView):
    form_class = UpdateForm
    template_name = 'mtg_updater/index.html'

    def get_success_url(self):
        return reverse("main")

    def get_context_data(self, **kwargs):
        kwargs['sets'] = get_sets()
        return super().get_context_data(**kwargs)


def search_cards(request):
    query = request.GET.get('query')
    set_code = request.GET.get('set_code') or ''
    if query:
        cards = search_for_cards(query, set_code)
    else:
        cards = []
    return JsonResponse({
        "cards": [mtg_card_to_json(mtg_card) for mtg_card in cards],
    })
    
from django import forms
from django.utils.timezone import now
from .api_data import get_card_by_id
from .helpers import update_mtg_card_data_instance_from_mtg_card, update_mtg_price_point_from_mtg_card
from .models import AccountCard, MTGCardData


class UpdateForm(forms.ModelForm):
    card_id = forms.CharField()
    is_foil = forms.BooleanField(required=False)
    amount_owned = forms.IntegerField()
    strategy = forms.ChoiceField(choices=[("set", "Set"), ("append", "Append")])

    def save(self, commit = ...):
        cleaned_data = self.cleaned_data
        mtg_card = get_card_by_id(cleaned_data["card_id"])
        instance = self.instance
        set_code = mtg_card.set_code
        card_number = mtg_card.card_number
        try:
            existing_instance = MTGCardData.objects.get_unique(set_code=set_code, card_number=card_number, is_foil=cleaned_data["is_foil"])
        except MTGCardData.DoesNotExist:
            pass
        else:
            instance.pk = existing_instance.pk
            instance.id = existing_instance.id
        update_mtg_card_data_instance_from_mtg_card(instance, mtg_card)
        response = super().save(commit)
        assert instance.pk > 0
        try:
            account_card_instance = AccountCard.objects.get(account=1, card=instance.pk)
        except AccountCard.DoesNotExist:
            account_card_instance = AccountCard(account=1, card=instance.pk, amount=0)
        if self.cleaned_data["strategy"] == "append":
            account_card_instance.amount += cleaned_data['amount_owned']
        else:
            account_card_instance.amount = cleaned_data['amount_owned']
        account_card_instance.save()
        update_mtg_price_point_from_mtg_card(prices=mtg_card.prices, instance=instance, dollar_per_euro=None, timestamp=now())
        return response
    
    class Meta:
        model = MTGCardData
        fields = ["is_foil", "amount_owned"]

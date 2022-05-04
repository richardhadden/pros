from rest_framework import serializers

"""
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "account_name", "users", "created"]


from .utils import PROS_APPS, PROS_MODELS

for app, model in PROS_MODELS:
    type(f"{model.__name__}Serializer", (serializers.ModelSerializer,), )
"""

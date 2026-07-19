import factory

from .models import Client


class ClientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Client

    nom = factory.Faker("last_name")
    prenom = factory.Faker("first_name")
    email = factory.Faker("email")
    numero_nie = factory.Sequence(lambda n: f"X{n:08d}A")

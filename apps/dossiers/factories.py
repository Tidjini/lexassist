import factory

from apps.clients.factories import ClientFactory
from .models import Dossier


class DossierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Dossier

    cliente = factory.SubFactory(ClientFactory)
    titre = factory.Faker("sentence", nb_words=3)
    type_procedure = "Arraigo social"

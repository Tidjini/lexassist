import factory

from apps.clients.factories import ClientFactory
from .models import Document


class DocumentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Document

    cliente = factory.SubFactory(ClientFactory)
    fichier = factory.django.FileField(filename="passeport.pdf", data=b"%PDF-1.4 test")
    nom_original = "passeport.pdf"
    content_type = "application/pdf"
    categorie = Document.Categorie.PASSEPORT

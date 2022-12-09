import pros.django_initializer

from test_app.models import Birth

from icecream import ic


b = Birth.inflate(Birth.nodes.get())

ic(b)

ic(b.is_about_person)

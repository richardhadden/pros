import pros.django_initializer

from test_app.models import Person, Birth

from icecream import ic


b = Birth.nodes.first()

p = b.person_born.all()

ic(b)
ic(p)

import pros.django_initializer

from test_app.models import Person, Factoid

from pypher import Pypher

q = Pypher()
q.Match.node("p", labels="Person").WHERE.p.property(
    "uid"
) == "c4503b42a23d47b49a36a09f27e3749b"
q.RETURN.p

print(q)

from neomodel import db

results, meta = db.cypher_query(str(q), q.bound_params)

p = Person.inflate(results[0][0])

from neomodel import DateProperty, StringProperty
from pros_core.models import ProsNode

import datetime
from dateutil.parser import parse as parse_date


class IncompleteDateProperty(StringProperty):
    """Allows date fragments, e.g. 2022, 2022-10, 2022-10-12 to be stored
    as a string.

    To be used in conjunction with internal fields to store the
    dates as Neo4J Date objects (or else call date() in Cypher queries)
    """

    pass


class ComplexDate(ProsNode):
    class Meta:
        abstract = True
        inline_only = True
        internal_fields = [
            "earliest_possible",
            "earliest_possible_conservative",
            "latest_possible",
            "latest_possible_conservative",
        ]

    earliest_possible = DateProperty()
    earliest_possible_conservative = DateProperty()

    latest_possible = DateProperty()
    latest_possible_conservative = DateProperty()


class SingleDate(ComplexDate):
    class Meta:
        abstract = True


class DateRange(ComplexDate):
    class Meta:
        abstract = True


class PreciseDate(SingleDate):

    date = IncompleteDateProperty()

    def save(self):
        self.earliest_possible = parse_date(
            self.date, default=datetime.date(1, 1, 1)
        )  # Set the internal date
        self.earliest_possible_conservative = parse_date(
            self.date, default=datetime.date(1, 12, 31)
        )
        self.latest_possible = parse_date(self.date, default=datetime.date(1, 12, 31))
        self.latest_possible_conservative = parse_date(
            self.date, default=datetime.date(1, 1, 1)
        )

        super().save()


class ImpreciseDate(SingleDate):
    not_before = IncompleteDateProperty()
    not_after = IncompleteDateProperty()

    def save(self):
        self.earliest_possible = parse_date(
            self.not_before, default=datetime.date(1, 1, 1)
        )  # Set the internal date
        self.earliest_possible_conservative = parse_date(
            self.not_before, default=datetime.date(1, 12, 31)
        )
        self.latest_possible = parse_date(
            self.not_after, default=datetime.date(1, 12, 31)
        )
        self.latest_possible_conservative = parse_date(
            self.not_after, default=datetime.date(1, 1, 1)
        )

        super().save()


class PreciseDateRange(DateRange):
    start = IncompleteDateProperty()
    end = IncompleteDateProperty()

    def save(self):
        self.earliest_possible = parse_date(
            self.start, default=datetime.date(1, 1, 1)
        )  # Set the internal date
        self.earliest_possible_conservative = parse_date(
            self.start, default=datetime.date(1, 12, 31)
        )
        self.latest_possible = parse_date(self.end, default=datetime.date(1, 12, 31))
        self.latest_possible_conservative = parse_date(
            self.end, default=datetime.date(1, 1, 1)
        )

        super().save()


class ImpreciseDateRange(DateRange):
    start_not_before = IncompleteDateProperty()
    start_not_after = IncompleteDateProperty()
    end_not_before = IncompleteDateProperty()
    end_not_after = IncompleteDateProperty()

    def save(self):
        self.earliest_possible = parse_date(
            self.start_not_before, default=datetime.date(1, 1, 1)
        )  # Set the internal date
        self.earliest_possible_conservative = parse_date(
            self.start_not_after, default=datetime.date(1, 12, 31)
        )
        self.latest_possible = parse_date(
            self.end_not_after, default=datetime.date(1, 12, 31)
        )
        self.latest_possible_conservative = parse_date(
            self.end_not_before, default=datetime.date(1, 1, 1)
        )

        super().save()

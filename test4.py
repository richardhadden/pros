import functools


class Thing:
    SOME_VALUE_WHICH_MIGHT_CHANGE = 10

    a = 100
    b = 200

    @staticmethod
    def _the_math(divisor, number):
        return number / divisor

    def _do_math(self, value):
        return self._the_math(self.SOME_VALUE_WHICH_MIGHT_CHANGE, value)

    do_math_on_a = functools.partial(lambda value, self: self._do_math(value), self.a)


# Test the actual math without having to worry about the class itself:

test = Thing._the_math(10, 100)
assert test == 10


# Then use it
t = Thing()
t.do_math_on_a()

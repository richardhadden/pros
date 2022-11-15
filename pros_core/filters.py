from pypher import __


def icontains(node, property):
    return (
        lambda value: getattr(__, node)
        .property(property)
        .operator("=~", f"(?i).*{value}.*")
    )

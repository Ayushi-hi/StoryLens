def _trim(x: float) -> str:
    return f"{x:.2f}".rstrip("0").rstrip(".")


def fmt_compact(n: float) -> str:
    """40779399 -> '40.78M', matching the frontend's compact format."""
    n = float(n)
    for limit, suffix in ((1e9, "B"), (1e6, "M"), (1e3, "K")):
        if abs(n) >= limit:
            return _trim(n / limit) + suffix
    return _trim(n)


def fmt_exact(n: float) -> str:
    return f"{int(round(n)):,}"


def fmt_pct(x: float, digits: int = 2) -> str:
    return f"{x:.{digits}f}%"


def fmt_signed_pct(x: float) -> str:
    return f"{'+' if x >= 0 else '-'}{abs(x):.1f}%"


def category_label(code: str) -> str:
    last = code.split(".")[-1].replace("_", " ")
    return last[:1].upper() + last[1:]
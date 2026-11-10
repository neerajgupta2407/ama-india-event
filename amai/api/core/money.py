def format_money(amount_minor, currency):
    """1234500, "INR" -> "₹12,345.00"; 90000, "USD" -> "$900.00"."""
    symbol = {"INR": "₹", "USD": "$"}.get(currency, f"{currency} ")
    return f"{symbol}{amount_minor / 100:,.2f}"

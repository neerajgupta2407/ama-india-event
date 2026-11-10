class HoneypotMixin:
    """
    Public forms carry a hidden "website" field that people never fill in.
    When it is filled the request is accepted but silently dropped, so bots
    get no signal to adapt to.
    """

    honeypot_field = "website"

    def is_bot(self, validated_data):
        return bool(validated_data.get(self.honeypot_field))

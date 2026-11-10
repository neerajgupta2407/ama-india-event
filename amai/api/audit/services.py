from audit.models import AuditEvent


class AuditService:
    @staticmethod
    def record(*, actor, action, obj=None, data=None):
        """
        `obj` is any model instance; its class name and pk identify it. `data` holds
        small, non-sensitive details (never passwords, tokens or card data).
        """
        return AuditEvent.objects.create(
            actor=actor if getattr(actor, "pk", None) else None,
            actor_label=getattr(actor, "email", "") or getattr(actor, "username", ""),
            action=action,
            object_type=obj.__class__.__name__ if obj is not None else "",
            object_id=str(obj.pk) if obj is not None else "",
            data=data or {},
        )

    @staticmethod
    def for_object(obj, limit=20):
        return AuditEvent.objects.filter(
            object_type=obj.__class__.__name__, object_id=str(obj.pk)
        )[:limit]

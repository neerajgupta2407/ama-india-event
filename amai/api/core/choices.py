from django.db import models


class Environment(models.TextChoices):
    DEVELOPMENT = "development", "Development"
    TESTING = "testing", "Testing"
    PRODUCTION = "production", "Production"

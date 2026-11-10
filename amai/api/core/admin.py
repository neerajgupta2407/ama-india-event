from django.contrib.auth.admin import GroupAdmin, UserAdmin
from django.contrib.auth.models import Group, User

from core.admin_config import admin_site

admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)

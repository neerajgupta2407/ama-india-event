from django.contrib.admin import AdminSite


class AmaiAdminSite(AdminSite):
    """Custom admin site. Register every model here, never with @admin.register()."""

    site_header = "AMAI Management"
    site_title = "AMAI Admin"
    index_title = "Welcome to AMAI Administration"


admin_site = AmaiAdminSite(name="amai_admin")

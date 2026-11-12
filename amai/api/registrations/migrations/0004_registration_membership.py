from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('registrations', '0003_registration_additional_delegates'),
    ]

    operations = [
        migrations.AddField(
            model_name='registration',
            name='membership',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]

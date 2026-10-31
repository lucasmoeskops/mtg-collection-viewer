"""
Django settings for the price updater. Only the bulk_update management command is used; there is no web part.
"""

import os
from urllib.parse import unquote, urlparse

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-local-only')

INSTALLED_APPS = [
    'mtg_updater',
]

# Same DATABASE_URL as the Next.js app; falls back to the "mtg" entry in the pg service file.
if database_url := os.environ.get('DATABASE_URL'):
    _url = urlparse(database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': _url.path.lstrip('/'),
            'USER': unquote(_url.username or ''),
            'PASSWORD': unquote(_url.password or ''),
            'HOST': _url.hostname or '',
            'PORT': _url.port or '',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'OPTIONS': {
                "service": "mtg",
            }
        }
    }

TIME_ZONE = 'UTC'

USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

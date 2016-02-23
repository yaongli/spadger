#!/usr/bin/env python
# -*- coding:utf-8 -*-

# This file is exec'd from settings.py, so it has access to and can
# modify all the variables in settings.py.

# If this file is changed in development, the development server will
# have to be manually restarted because changes will not be noticed
# immediately.

import warnings
import exceptions
import logging
import sys
from production import *

warnings.filterwarnings("ignore", category=exceptions.RuntimeWarning, module='django.db.backends.sqlite3.base', lineno=57)
warnings.filterwarnings("ignore", category=exceptions.DeprecationWarning, module='django.core.handlers.wsgi', lineno=126)
warnings.filterwarnings("ignore", category=exceptions.DeprecationWarning)

logging.basicConfig(level=logging.INFO,
                    format='%(filename)s[%(lineno)d]%(message)s',
                    datefmt='%a, %d %b %Y %H:%M:%S',
                    stream=sys.stdout)

DEBUG = True

# Make these unique, and don't share it with anybody.
NEVERCACHE_KEY = "!5%uoa4!y)_04ms!$-q90klrya!-m#7ye9vmek-*)+e(mpinxe"

###################
# DEPLOY SETTINGS #
###################

# Domains for public site
ALLOWED_HOSTS = ["*"]

# These settings are used by the default fabfile.py provided.
# Check fabfile.py for defaults.

FABRIC = {
    "DEPLOY_TOOL": "git",  # Deploy with "git", "hg", or "rsync"
    "SSH_USER": "django",  # VPS SSH username
    "SSH_PASS": "django2016",
    "HOSTS": ["45.32.248.185"],  # The IP address of your VPS
    "DOMAINS": ALLOWED_HOSTS,  # Edit domains in ALLOWED_HOSTS
    "REQUIREMENTS_PATH": "requirements.txt",  # Project's pip requirements
    "LOCALE": "en_US.UTF-8",  # Should end with ".UTF-8"
    "DB_PASS": "spadger",  # Live database password
    "ADMIN_PASS": "spadger",  # Live admin user password
    "SECRET_KEY": SECRET_KEY,
    "NEVERCACHE_KEY": NEVERCACHE_KEY,
}


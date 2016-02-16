

# spadger

spadger    ['spædʒə] 麻雀

麻雀虽小

spadger is a _short description_. It is built with [Python][0] using the [Django Web Framework][1].

This project has the following basic apps:

* App1 (short desc)
* App2 (short desc)
* App3 (short desc)

## Installation

### Quick start




To set up a development environment quickly, first install Python 3. It
comes with virtualenv built-in. So create a virtual env by:

    1. `$ python3 -m venv spadger`
    2. `$ . spadger/bin/activate`

Install all dependencies:

    pip install -r requirements.txt

Run migrations:

    python manage.py migrate

### Detailed instructions

Take a look at the docs for more information.

[0]: https://www.python.org/
[1]: https://www.djangoproject.com/


```
$ django-admin.py startproject --template=https://github.com/arocks/edge/archive/master.zip --extension=py,md,html,env my_proj
$ cd my_proj
$ pip install -r requirements.txt 
$ cd src
$ cp my_proj/settings/local.sample.env my_proj/settings/local.env
$ python manage.py migrate
$ python manage.py createsuperuser
```

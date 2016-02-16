from django.views import generic


class HomePage(generic.TemplateView):
    template_name = "home.html"


class AboutPage(generic.TemplateView):
    template_name = "about.html"

class InThemePage(generic.TemplateView):
    template_name = "theme/in_theme.html"
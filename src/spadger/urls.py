from django.conf.urls import include, url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
import profiles.urls
import accounts.urls
import managements.urls
import articles.urls
from . import views

urlpatterns = [
    url(r'^$', views.HomePage.as_view(), name='home'),
    url(r'^about/$', views.AboutPage.as_view(), name='about'),
    url(r'^in_theme/$', views.InThemePage.as_view(), name='in_theme'),
    url(r'^users/', include(profiles.urls, namespace='profiles')),
    url(r'^article/', include(articles.urls, namespace='articles')),
    url(r'^manage/', include(managements.urls, namespace='manage')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^', include(accounts.urls, namespace='accounts')),
]

# User-uploaded files like profile pics need to be served in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from django.views.static import serve

from .views import home_view

urlpatterns = [
    path('', home_view, name='home'),
    path('api', RedirectView.as_view(url='/api/', permanent=True)),
    path('admin/', admin.site.urls),
    path('api/', include('agent.urls')),
]

# Serve media files 
# In production, media files should be served by a web server (nginx, etc.)
# But for local development/testing, Django can serve them
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

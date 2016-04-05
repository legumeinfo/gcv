from django.conf.urls import patterns, url


urlpatterns = patterns('services.views',
    url(
        r'^basic_tracks/(?P<node_id>\d+)/$', 'basic_tracks', name='basic_tracks'
    ),
    url(
        r'^search_tracks/(?P<focus_name>[^\/]+)/$',
        'search_tracks',
        name='search_tracks'
    ),
    url(r'^global_plot/$', 'global_plot', name='global_plot'),
)

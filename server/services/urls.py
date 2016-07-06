from django.conf.urls import patterns, url


urlpatterns = patterns('services.views',
    # classic services
    url(
        r'^basic_tracks/(?P<node_id>\d+)/$',
        'basic_tracks',
        name='basic_tracks'
    ),
    url(
        r'^search_tracks/(?P<focus_name>[^\/]+)/$',
        'search_tracks',
        name='search_tracks'
    ),
    url(r'^global_plot/$', 'global_plot', name='global_plot'),
    # tree agnostic/multiple provider services
    url(
        r'^basic_tracks_tree_agnostic/$',
        'basic_tracks_tree_agnostic',
        name='basic_tracks_tree_agnostic'
    ),
    url(r'^gene_to_query/$', 'gene_to_query', name='gene_to_query'),
    url(
        r'^search_tracks_tree_agnostic/$',
        'search_tracks_tree_agnostic',
        name='search_tracks_tree_agnostic'
    ),
    url(
        r'^global_plot_provider_agnostic/$',
        'global_plot_provider_agnostic',
        name='global_plot_provider_agnostic'
    ),
    url(r'^synteny/$', 'synteny', name='synteny'),
)

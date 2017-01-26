from django.conf.urls import patterns, url


urlpatterns = patterns('services.views',
    # basic micro-synteny tracks
    url(r'^micro-synteny-basic/$', 'micro_synteny_basic_tracks'),
    url(r'^basic_tracks_tree_agnostic/$', 'micro_synteny_basic_tracks'),
    # gene to query
    url(r'^micro-synteny-gene-to-query/$', 'micro_synteny_gene_to_query'),
    url(r'^gene_to_query/$', 'micro_synteny_gene_to_query'),
    # search micro-synteny tracks
    url(r'^micro-synteny-search/$', 'micro_synteny_search'),
    url(r'^search_tracks_tree_agnostic/$', 'micro_synteny_search'),
    # global dot plots
    url(r'^global-plots/$', 'global_plots'),
    url(r'^global_plot_provider_agnostic/$', 'global_plots'),
    # macro-synteny
    url(r'^synteny/$', 'macro_synteny'),
    url(r'^macro-synteny/$', 'macro_synteny'),
)

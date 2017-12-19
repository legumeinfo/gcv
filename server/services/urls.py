from django.conf.urls import patterns, url


urlpatterns = patterns('services.views',
    # depreciated

    # basic micro-synteny tracks
    url(r'^micro-synteny-basic/$', 'micro_synteny_basic'),
    url(r'^basic_tracks_tree_agnostic/$', 'micro_synteny_basic'),
    # gene to query
    url(r'^micro-synteny-gene-to-query/$', 'gene_to_query'),
    url(r'^gene_to_query/$', 'gene_to_query'),
    # search micro-synteny tracks
    url(r'^micro-synteny-search/$', 'micro_synteny_search'),
    url(r'^search_tracks_tree_agnostic/$', 'micro_synteny_search'),
    # global dot plots
    url(r'^global-plots/$', 'global_plots'),
    url(r'^global_plot_provider_agnostic/$', 'global_plots'),
    # macro-synteny
    url(r'^synteny/$', 'v1_macro_synteny'),
    url(r'^macro-synteny/$', 'v1_macro_synteny'),
    # genomic location to nearest gene
    url(r'^nearest-gene/$', 'v1_nearest_gene'),

    # v1

    # basic micro-synteny tracks
    url(r'^v1/micro-synteny-basic/$', 'v1_micro_synteny_basic'),
    # gene to query
    url(r'^v1/gene-to-query-track/$', 'v1_gene_to_query_track'),
    # search micro-synteny tracks
    url(r'^v1/micro-synteny-search/$', 'v1_micro_synteny_search'),
    # global dot plots
    url(r'^v1/global-plots/$', 'v1_global_plot'),
    # macro-synteny
    url(r'^v1/macro-synteny/$', 'v1_macro_synteny'),
    # genomic location to nearest gene
    url(r'^v1/nearest-gene/$', 'v1_nearest_gene'),

    # v1.1

    # chromosome
    url(r'^v1_1/chromosome/$', 'v1_1_chromosome'),
    # macro-synteny
    url(r'^v1_1/macro-synteny/$', 'v1_1_macro_synteny'),
)

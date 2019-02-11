from django.conf.urls import url
from . import views

urlpatterns = [
    # depreciated

    # basic micro-synteny tracks
    url(r'^micro-synteny-basic/$', views.micro_synteny_basic),
    url(r'^basic_tracks_tree_agnostic/$', views.micro_synteny_basic),
    # gene to query
    url(r'^micro-synteny-gene-to-query/$', views.gene_to_query),
    url(r'^gene_to_query/$', views.gene_to_query),
    # search micro-synteny tracks
    url(r'^micro-synteny-search/$', views.micro_synteny_search),
    url(r'^search_tracks_tree_agnostic/$', views.micro_synteny_search),
    # global dot plots
    url(r'^global-plots/$', views.global_plots),
    url(r'^global_plot_provider_agnostic/$', views.global_plots),
    # macro-synteny
    url(r'^synteny/$', views.v1_macro_synteny),
    url(r'^macro-synteny/$', views.v1_macro_synteny),

    # v1

    # basic micro-synteny tracks
    url(r'^v1/micro-synteny-basic/$', views.v1_micro_synteny_basic),
    # gene to query
    url(r'^v1/gene-to-query-track/$', views.v1_gene_to_query_track),
    # search micro-synteny tracks
    url(r'^v1/micro-synteny-search/$', views.v1_micro_synteny_search),
    # global dot plots
    url(r'^v1/global-plots/$', views.v1_global_plot),
    # macro-synteny
    url(r'^v1/macro-synteny/$', views.v1_macro_synteny),

    # v1.1

    # chromosome
    url(r'^v1_1/chromosome/$', views.v1_1_chromosome),
    # macro-synteny
    url(r'^v1_1/macro-synteny/$', views.v1_1_macro_synteny),
    # genomic location to nearest gene
    url(r'^v1_1/span-to-context/$', views.v1_1_span_to_context),
]

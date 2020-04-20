from django.db import models
from django.db.models import Count

# Create your models here.
class Db(models.Model):
    db_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=255, blank=True)
    urlprefix = models.CharField(max_length=255, blank=True)
    url = models.CharField(max_length=255, blank=True)
    class Meta:
        db_table = u'db'

class DbDbxrefCount(models.Model):
    name = models.CharField(max_length=255, blank=True)
    num_dbxrefs = models.BigIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'db_dbxref_count'

class Project(models.Model):
    project_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=255)
    class Meta:
        db_table = u'project'

class Dbxref(models.Model):
    dbxref_id = models.IntegerField(primary_key=True)
    db = models.ForeignKey("Db", related_name="%(class)s_db", on_delete=models.PROTECT)
    accession = models.CharField(max_length=255)
    version = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'dbxref'

class Cv(models.Model):
    cv_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    definition = models.TextField(blank=True)
    class Meta:
        db_table = u'cv'

class Cvtermsynonym(models.Model):
    cvtermsynonym_id = models.IntegerField(primary_key=True)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    synonym = models.CharField(max_length=1024)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    class Meta:
        db_table = u'cvtermsynonym'

class CvtermRelationship(models.Model):
    cvterm_relationship_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    subject = models.ForeignKey("Cvterm", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("Cvterm", related_name="%(class)s_object", on_delete=models.PROTECT)
    class Meta:
        db_table = u'cvterm_relationship'

class CvtermDbxref(models.Model):
    cvterm_dbxref_id = models.IntegerField(primary_key=True)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    is_for_definition = models.IntegerField()
    class Meta:
        db_table = u'cvterm_dbxref'

class Cvtermpath(models.Model):
    cvtermpath_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    subject = models.ForeignKey("Cvterm", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("Cvterm", related_name="%(class)s_object", on_delete=models.PROTECT)
    cv = models.ForeignKey("Cv", related_name="%(class)s_cv", on_delete=models.PROTECT)
    pathdistance = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cvtermpath'

class CvRoot(models.Model):
    cv_id = models.IntegerField(null=True, blank=True)
    root_cvterm_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cv_root'

class Cvtermprop(models.Model):
    cvtermprop_id = models.IntegerField(primary_key=True)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField()
    rank = models.IntegerField()
    class Meta:
        db_table = u'cvtermprop'

class CvLeaf(models.Model):
    cv_id = models.IntegerField(null=True, blank=True)
    cvterm_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cv_leaf'

class Dbxrefprop(models.Model):
    dbxrefprop_id = models.IntegerField(primary_key=True)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField()
    rank = models.IntegerField()
    class Meta:
        db_table = u'dbxrefprop'

class CommonAncestorCvterm(models.Model):
    cvterm1_id = models.IntegerField(null=True, blank=True)
    cvterm2_id = models.IntegerField(null=True, blank=True)
    ancestor_cvterm_id = models.IntegerField(null=True, blank=True)
    pathdistance1 = models.IntegerField(null=True, blank=True)
    pathdistance2 = models.IntegerField(null=True, blank=True)
    total_pathdistance = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'common_ancestor_cvterm'

class CommonDescendantCvterm(models.Model):
    cvterm1_id = models.IntegerField(null=True, blank=True)
    cvterm2_id = models.IntegerField(null=True, blank=True)
    ancestor_cvterm_id = models.IntegerField(null=True, blank=True)
    pathdistance1 = models.IntegerField(null=True, blank=True)
    pathdistance2 = models.IntegerField(null=True, blank=True)
    total_pathdistance = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'common_descendant_cvterm'

class StatsPathsToRoot(models.Model):
    cvterm_id = models.IntegerField(null=True, blank=True)
    total_paths = models.BigIntegerField(null=True, blank=True)
    avg_distance = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    min_distance = models.IntegerField(null=True, blank=True)
    max_distance = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'stats_paths_to_root'

class CvCvtermCount(models.Model):
    name = models.CharField(max_length=255, blank=True)
    num_terms_excl_obs = models.BigIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cv_cvterm_count'

class CvCvtermCountWithObs(models.Model):
    name = models.CharField(max_length=255, blank=True)
    num_terms_incl_obs = models.BigIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cv_cvterm_count_with_obs'

class CvLinkCount(models.Model):
    cv_name = models.CharField(max_length=255, blank=True)
    relation_name = models.CharField(max_length=1024, blank=True)
    relation_cv_name = models.CharField(max_length=255, blank=True)
    num_links = models.BigIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cv_link_count'

class CvPathCount(models.Model):
    cv_name = models.CharField(max_length=255, blank=True)
    relation_name = models.CharField(max_length=1024, blank=True)
    relation_cv_name = models.CharField(max_length=255, blank=True)
    num_paths = models.BigIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'cv_path_count'

class PubDbxref(models.Model):
    pub_dbxref_id = models.IntegerField(primary_key=True)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    class Meta:
        db_table = u'pub_dbxref'

class PubRelationship(models.Model):
    pub_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Pub", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("Pub", related_name="%(class)s_object", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    class Meta:
        db_table = u'pub_relationship'

class Pubauthor(models.Model):
    pubauthor_id = models.IntegerField(primary_key=True)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    rank = models.IntegerField()
    editor = models.NullBooleanField(null=True, blank=True)
    surname = models.CharField(max_length=100)
    givennames = models.CharField(max_length=100, blank=True)
    suffix = models.CharField(max_length=100, blank=True)
    class Meta:
        db_table = u'pubauthor'

class Pubprop(models.Model):
    pubprop_id = models.IntegerField(primary_key=True)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField()
    rank = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'pubprop'

class OrganismDbxref(models.Model):
    organism_dbxref_id = models.IntegerField(primary_key=True)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    class Meta:
        db_table = u'organism_dbxref'

class Organismprop(models.Model):
    organismprop_id = models.IntegerField(primary_key=True)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'organismprop'

class Featureloc(models.Model):
    featureloc_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    srcfeature = models.ForeignKey("Feature", null=True, blank=True, on_delete=models.PROTECT)
    fmin = models.IntegerField(null=True, blank=True)
    is_fmin_partial = models.BooleanField()
    fmax = models.IntegerField(null=True, blank=True)
    is_fmax_partial = models.BooleanField()
    strand = models.SmallIntegerField(null=True, blank=True)
    phase = models.IntegerField(null=True, blank=True)
    residue_info = models.TextField(blank=True)
    locgroup = models.IntegerField()
    rank = models.IntegerField()
    class Meta:
        db_table = u'featureloc'

class Organism(models.Model):
    organism_id = models.IntegerField(primary_key=True)
    abbreviation = models.CharField(max_length=255, blank=True)
    genus = models.CharField(max_length=255)
    species = models.CharField(max_length=255)
    common_name = models.CharField(max_length=255, blank=True)
    comment = models.TextField(blank=True)
    class Meta:
        db_table = u'organism'

    # a method that counts the number of features an organism has
    def count_features(self):
        return Feature.objects.filter(organism=self).count()

    # a method that counts how many of each type of feature an organism has
    def count_feature_types(self):
        return Feature.objects.filter(organism=self).values('type__name').annotate(count=Count('type')).extra(select={'name':'type__name'})

class FeaturelocPub(models.Model):
    featureloc_pub_id = models.IntegerField(primary_key=True)
    featureloc = models.ForeignKey("Featureloc", related_name="%(class)s_featureloc", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'featureloc_pub'

class FeaturePub(models.Model):
    feature_pub_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_pub'

class FeaturePubprop(models.Model):
    feature_pubprop_id = models.IntegerField(primary_key=True)
    feature_pub = models.ForeignKey("FeaturePub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'feature_pubprop'

class FeatureDbxref(models.Model):
    feature_dbxref_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    class Meta:
        db_table = u'feature_dbxref'

class Featureprop(models.Model):
    featureprop_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'featureprop'

class FeaturepropPub(models.Model):
    featureprop_pub_id = models.IntegerField(primary_key=True)
    featureprop = models.ForeignKey("Featureprop", related_name="%(class)s_featureprop", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'featureprop_pub'

class FeatureRelationship(models.Model):
    feature_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Feature", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("Feature", related_name="%(class)s_object", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'feature_relationship'

class FeatureRelationshipPub(models.Model):
    feature_relationship_pub_id = models.IntegerField(primary_key=True)
    feature_relationship = models.ForeignKey("FeatureRelationship", related_name="%(class)s_relationship", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_relationship_pub'

class FeatureRelationshipprop(models.Model):
    feature_relationshipprop_id = models.IntegerField(primary_key=True)
    feature_relationship = models.ForeignKey("FeatureRelationship", related_name="%(class)s_relationship", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'feature_relationshipprop'

class FeatureRelationshippropPub(models.Model):
    feature_relationshipprop_pub_id = models.IntegerField(primary_key=True)
    feature_relationshipprop = models.ForeignKey("FeatureRelationshipprop", related_name="%(class)s_relationshipprop", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_relationshipprop_pub'

class FeatureCvtermprop(models.Model):
    feature_cvtermprop_id = models.IntegerField(primary_key=True)
    feature_cvterm = models.ForeignKey("FeatureCvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'feature_cvtermprop'

class FeatureCvtermDbxref(models.Model):
    feature_cvterm_dbxref_id = models.IntegerField(primary_key=True)
    feature_cvterm = models.ForeignKey("FeatureCvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_cvterm_dbxref'

class FeatureCvterm(models.Model):
    feature_cvterm_id = models.IntegerField(primary_key=True)
    #feature = models.ForeignKey("Feature", related_name="banana", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    is_not = models.BooleanField()
    rank = models.IntegerField()
    class Meta:
        db_table = u'feature_cvterm'

class FeatureCvtermPub(models.Model):
    feature_cvterm_pub_id = models.IntegerField(primary_key=True)
    feature_cvterm = models.ForeignKey("FeatureCvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_cvterm_pub'

class FeatureSynonym(models.Model):
    feature_synonym_id = models.IntegerField(primary_key=True)
    synonym = models.ForeignKey("Synonym", related_name="%(class)s_synonym", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    is_internal = models.BooleanField()
    class Meta:
        db_table = u'feature_synonym'

class TypeFeatureCount(models.Model):
    type = models.CharField(max_length=1024, blank=True)
    num_features = models.BigIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'type_feature_count'


class ProteinCodingGene(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    dbxref_id = models.IntegerField(null=True, blank=True)
    organism_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    uniquename = models.TextField(blank=True)
    residues = models.TextField(blank=True)
    seqlen = models.IntegerField(null=True, blank=True)
    md5checksum = models.CharField(max_length=32, blank=True)
    type_id = models.IntegerField(null=True, blank=True)
    is_analysis = models.NullBooleanField(null=True, blank=True)
    is_obsolete = models.NullBooleanField(null=True, blank=True)
    timeaccessioned = models.DateTimeField(null=True, blank=True)
    timelastmodified = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = u'protein_coding_gene'

class IntronCombinedView(models.Model):
    exon1_id = models.IntegerField(null=True, blank=True)
    exon2_id = models.IntegerField(null=True, blank=True)
    fmin = models.IntegerField(null=True, blank=True)
    fmax = models.IntegerField(null=True, blank=True)
    strand = models.SmallIntegerField(null=True, blank=True)
    srcfeature_id = models.IntegerField(null=True, blank=True)
    intron_rank = models.IntegerField(null=True, blank=True)
    transcript_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'intron_combined_view'

class IntronlocView(models.Model):
    exon1_id = models.IntegerField(null=True, blank=True)
    exon2_id = models.IntegerField(null=True, blank=True)
    fmin = models.IntegerField(null=True, blank=True)
    fmax = models.IntegerField(null=True, blank=True)
    strand = models.SmallIntegerField(null=True, blank=True)
    srcfeature_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'intronloc_view'


class Feature(models.Model):
    feature_id = models.IntegerField(primary_key=True)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True)
    uniquename = models.TextField()
    residues = models.TextField(blank=True)
    seqlen = models.IntegerField(null=True, blank=True)
    md5checksum = models.CharField(max_length=32, blank=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    is_analysis = models.BooleanField()
    is_obsolete = models.BooleanField()
    timeaccessioned = models.DateTimeField()
    timelastmodified = models.DateTimeField()
    class Meta:
        db_table = u'feature'

    # a method that counts the number of features an organism has
    def count_featurelocs(self):
        return Featureloc.objects.filter(srcfeature_id=self).count()

    # a method that 
    def get_featurelocs(self):
        return Featureloc.objects.filter(srcfeature_id=self)


class Analysisprop(models.Model):
    analysisprop_id = models.IntegerField(primary_key=True)
    analysis = models.ForeignKey("Analysis", related_name="%(class)s_analysis", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'analysisprop'

class Analysisfeature(models.Model):
    analysisfeature_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    analysis = models.ForeignKey("Analysis", related_name="%(class)s_analysis", on_delete=models.PROTECT)
    rawscore = models.FloatField(null=True, blank=True)
    normscore = models.FloatField(null=True, blank=True)
    significance = models.FloatField(null=True, blank=True)
    identity = models.FloatField(null=True, blank=True)
    class Meta:
        db_table = u'analysisfeature'

class Analysis(models.Model):
    analysis_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    program = models.CharField(max_length=255)
    programversion = models.CharField(max_length=255)
    algorithm = models.CharField(max_length=255, blank=True)
    sourcename = models.CharField(max_length=255, blank=True)
    sourceversion = models.CharField(max_length=255, blank=True)
    sourceuri = models.TextField(blank=True)
    timeexecuted = models.DateTimeField()
    class Meta:
        db_table = u'analysis'

class Analysisfeatureprop(models.Model):
    analysisfeatureprop_id = models.IntegerField(primary_key=True)
    analysisfeature = models.ForeignKey("Analysisfeature", related_name="%(class)s_analysisfeature", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'analysisfeatureprop'

class Genotype(models.Model):
    genotype_id = models.IntegerField(primary_key=True)
    name = models.TextField(blank=True)
    uniquename = models.TextField(unique=True)
    description = models.CharField(max_length=255, blank=True)
    class Meta:
        db_table = u'genotype'

class PhenotypeCvterm(models.Model):
    phenotype_cvterm_id = models.IntegerField(primary_key=True)
    phenotype = models.ForeignKey("Phenotype", related_name="%(class)s_phenotype", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    rank = models.IntegerField()
    class Meta:
        db_table = u'phenotype_cvterm'

class FeaturePhenotype(models.Model):
    feature_phenotype_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    phenotype = models.ForeignKey("Phenotype", related_name="%(class)s_phenotype", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_phenotype'


class FeatureGenotype(models.Model):
    feature_genotype_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    genotype = models.ForeignKey("Genotype", related_name="%(class)s_genotype", on_delete=models.PROTECT)
    chromosome = models.ForeignKey("Feature", null=True, blank=True, on_delete=models.PROTECT)
    rank = models.IntegerField()
    cgroup = models.IntegerField()
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_genotype'

class Environment(models.Model):
    environment_id = models.IntegerField(primary_key=True)
    uniquename = models.TextField(unique=True)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'environment'

class EnvironmentCvterm(models.Model):
    environment_cvterm_id = models.IntegerField(primary_key=True)
    environment = models.ForeignKey("Environment", related_name="%(class)s_environment", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    class Meta:
        db_table = u'environment_cvterm'

class Phenstatement(models.Model):
    phenstatement_id = models.IntegerField(primary_key=True)
    genotype = models.ForeignKey("Genotype", related_name="%(class)s_genotype", on_delete=models.PROTECT)
    environment = models.ForeignKey("Environment", related_name="%(class)s_environment", on_delete=models.PROTECT)
    phenotype = models.ForeignKey("Phenotype", related_name="%(class)s_phenotype", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phenstatement'

class PhenotypeComparison(models.Model):
    phenotype_comparison_id = models.IntegerField(primary_key=True)
    genotype1 = models.ForeignKey("Genotype", related_name="%(class)s_genotype1", on_delete=models.PROTECT)
    environment1 = models.ForeignKey("Environment", related_name="%(class)s_environment1", on_delete=models.PROTECT)
    genotype2 = models.ForeignKey("Genotype", related_name="%(class)s_genotype2", on_delete=models.PROTECT)
    environment2 = models.ForeignKey("Environment", related_name="%(class)s_environment2", on_delete=models.PROTECT)
    phenotype1 = models.ForeignKey("Phenotype", related_name="%(class)s_phenotype1", on_delete=models.PROTECT)
    phenotype2 = models.ForeignKey("Phenotype", null=True, blank=True, on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phenotype_comparison'

class Phenotype(models.Model):
    phenotype_id = models.IntegerField(primary_key=True)
    uniquename = models.TextField(unique=True)
    observable = models.ForeignKey("Cvterm", related_name="%(class)s_observable", null=True, blank=True, on_delete=models.PROTECT)
    attr = models.ForeignKey("Cvterm", related_name="%(class)s_attr", null=True, blank=True, on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    cvalue = models.ForeignKey("Cvterm",related_name="%(class)s_cvalue", null=True, blank=True, on_delete=models.PROTECT)
    assay = models.ForeignKey("Cvterm",related_name="%(class)s_assay", null=True, blank=True, on_delete=models.PROTECT)
    class Meta:
        db_table = u'phenotype'

class Phendesc(models.Model):
    phendesc_id = models.IntegerField(primary_key=True)
    genotype = models.ForeignKey("Genotype", related_name="%(class)s_genotype", on_delete=models.PROTECT)
    environment = models.ForeignKey("Environment", related_name="%(class)s_environment", on_delete=models.PROTECT)
    description = models.TextField()
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phendesc'

class SouthMigrationhistory(models.Model):
    id = models.IntegerField(primary_key=True)
    app_name = models.CharField(max_length=255)
    migration = models.CharField(max_length=255)
    applied = models.DateTimeField()
    class Meta:
        db_table = u'south_migrationhistory'

class PhenotypeComparisonCvterm(models.Model):
    phenotype_comparison_cvterm_id = models.IntegerField(primary_key=True)
    phenotype_comparison = models.ForeignKey("PhenotypeComparison", related_name="%(class)s_comparison", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    rank = models.IntegerField()
    class Meta:
        db_table = u'phenotype_comparison_cvterm'

class Cvterm(models.Model):
    cvterm_id = models.IntegerField(primary_key=True)
    cv = models.ForeignKey("Cv", related_name="%(class)s_cv", on_delete=models.PROTECT)
    name = models.CharField(max_length=1024)
    definition = models.TextField(blank=True)
    dbxref = models.ForeignKey("Dbxref", unique=True, on_delete=models.PROTECT)
    is_obsolete = models.IntegerField()
    is_relationshiptype = models.IntegerField()
    class Meta:
        db_table = u'cvterm'

class Featuremap(models.Model):
    featuremap_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    unittype = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    class Meta:
        db_table = u'featuremap'

class Pub(models.Model):
    pub_id = models.IntegerField(primary_key=True)
    title = models.TextField(blank=True)
    volumetitle = models.TextField(blank=True)
    volume = models.CharField(max_length=255, blank=True)
    series_name = models.CharField(max_length=255, blank=True)
    issue = models.CharField(max_length=255, blank=True)
    pyear = models.CharField(max_length=255, blank=True)
    pages = models.CharField(max_length=255, blank=True)
    miniref = models.CharField(max_length=255, blank=True)
    uniquename = models.TextField(unique=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    is_obsolete = models.NullBooleanField(null=True, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    pubplace = models.CharField(max_length=255, blank=True)
    class Meta:
        db_table = u'pub'

class Featurerange(models.Model):
    featurerange_id = models.IntegerField(primary_key=True)
    featuremap = models.ForeignKey("Featuremap", related_name="%(class)s_featuremap", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    leftstartf = models.ForeignKey("Feature", related_name="%(class)s_leftstartf", on_delete=models.PROTECT)
    leftendf = models.ForeignKey("Feature", related_name="%(class)s_leftendf", null=True, blank=True, on_delete=models.PROTECT)
    rightstartf = models.ForeignKey("Feature", related_name="%(class)s_rightstartf", null=True, blank=True, on_delete=models.PROTECT)
    rightendf = models.ForeignKey("Feature", related_name="%(class)s_rightendf", on_delete=models.PROTECT)
    rangestr = models.CharField(max_length=255, blank=True)
    class Meta:
        db_table = u'featurerange'

class Featurepos(models.Model):
    featurepos_id = models.IntegerField(primary_key=True)
    featuremap = models.ForeignKey("Featuremap", related_name="%(class)s_featuremap", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    map_feature = models.ForeignKey("Feature", related_name="%(class)s_map_feature", on_delete=models.PROTECT)
    mappos = models.FloatField()
    class Meta:
        db_table = u'featurepos'

class FeaturemapPub(models.Model):
    featuremap_pub_id = models.IntegerField(primary_key=True)
    featuremap = models.ForeignKey("Featuremap", related_name="%(class)s_featuremap", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'featuremap_pub'

class PhylotreePub(models.Model):
    phylotree_pub_id = models.IntegerField(primary_key=True)
    phylotree = models.ForeignKey("Phylotree", related_name="%(class)s_phylotree", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phylotree_pub'

class PhylonodeDbxref(models.Model):
    phylonode_dbxref_id = models.IntegerField(primary_key=True)
    phylonode = models.ForeignKey("Phylonode", related_name="%(class)s_phylonode", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phylonode_dbxref'

class PhylonodePub(models.Model):
    phylonode_pub_id = models.IntegerField(primary_key=True)
    phylonode = models.ForeignKey("Phylonode", related_name="%(class)s_phylonode", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phylonode_pub'

class PhylonodeOrganism(models.Model):
    phylonode_organism_id = models.IntegerField(primary_key=True)
    phylonode = models.ForeignKey("Phylonode", unique=True, on_delete=models.PROTECT)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phylonode_organism'

class Phylonodeprop(models.Model):
    phylonodeprop_id = models.IntegerField(primary_key=True)
    phylonode = models.ForeignKey("Phylonode", related_name="%(class)s_phylonode", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField()
    rank = models.IntegerField()
    class Meta:
        db_table = u'phylonodeprop'

class Phylonode(models.Model):
    phylonode_id = models.IntegerField(primary_key=True)
    phylotree = models.ForeignKey("Phylotree", related_name="%(class)s_phylotree", on_delete=models.PROTECT)
    parent_phylonode = models.ForeignKey('self', null=True, blank=True, on_delete=models.PROTECT)
    left_idx = models.IntegerField()
    right_idx = models.IntegerField()
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", null=True, blank=True, on_delete=models.PROTECT)
    label = models.CharField(max_length=255, blank=True)
    distance = models.FloatField(null=True, blank=True)
    class Meta:
        db_table = u'phylonode'

class Phylotree(models.Model):
    phylotree_id = models.IntegerField(primary_key=True)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    analysis = models.ForeignKey("Analysis", null=True, blank=True, on_delete=models.PROTECT)
    comment = models.TextField(blank=True)
    class Meta:
        db_table = u'phylotree'

class PhylonodeRelationship(models.Model):
    phylonode_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("phylonode", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("phylonode", related_name="%(class)s_object", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    rank = models.IntegerField(null=True, blank=True)
    phylotree = models.ForeignKey("phylotree", related_name="%(class)s_phylotree", on_delete=models.PROTECT)
    class Meta:
        db_table = u'phylonode_relationship'

class Contact(models.Model):
    contact_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=255, blank=True)
    class Meta:
        db_table = u'contact'

class ContactRelationship(models.Model):
    contact_relationship_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    subject = models.ForeignKey("Contact", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("Contact", related_name="%(class)s_object", on_delete=models.PROTECT)
    class Meta:
        db_table = u'contact_relationship'

class ExpressionPub(models.Model):
    expression_pub_id = models.IntegerField(primary_key=True)
    expression = models.ForeignKey("Expression", related_name="%(class)s_expression", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'expression_pub'

class ExpressionCvterm(models.Model):
    expression_cvterm_id = models.IntegerField(primary_key=True)
    expression = models.ForeignKey("Expression", related_name="%(class)s_expression", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    rank = models.IntegerField()
    cvterm_type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    class Meta:
        db_table = u'expression_cvterm'

class ExpressionCvtermprop(models.Model):
    expression_cvtermprop_id = models.IntegerField(primary_key=True)
    expression_cvterm = models.ForeignKey("ExpressionCvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'expression_cvtermprop'

class Expressionprop(models.Model):
    expressionprop_id = models.IntegerField(primary_key=True)
    expression = models.ForeignKey("Expression", related_name="%(class)s_expression", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'expressionprop'

class FeatureExpression(models.Model):
    feature_expression_id = models.IntegerField(primary_key=True)
    expression = models.ForeignKey("Expression", related_name="%(class)s_expression", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'feature_expression'

class FeatureExpressionprop(models.Model):
    feature_expressionprop_id = models.IntegerField(primary_key=True)
    feature_expression = models.ForeignKey("FeatureExpression", related_name="%(class)s_expression", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'feature_expressionprop'

class Expression(models.Model):
    expression_id = models.IntegerField(primary_key=True)
    uniquename = models.TextField(unique=True)
    md5checksum = models.CharField(max_length=32, blank=True)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'expression'

class Eimage(models.Model):
    eimage_id = models.IntegerField(primary_key=True)
    eimage_data = models.TextField(blank=True)
    eimage_type = models.CharField(max_length=255)
    image_uri = models.CharField(max_length=255, blank=True)
    class Meta:
        db_table = u'eimage'

class ExpressionImage(models.Model):
    expression_image_id = models.IntegerField(primary_key=True)
    expression = models.ForeignKey("Expression", related_name="%(class)s_expression", on_delete=models.PROTECT)
    eimage = models.ForeignKey("Eimage", related_name="%(class)s_eimage", on_delete=models.PROTECT)
    class Meta:
        db_table = u'expression_image'

class Mageml(models.Model):
    mageml_id = models.IntegerField(primary_key=True)
    mage_package = models.TextField()
    mage_ml = models.TextField()
    class Meta:
        db_table = u'mageml'

class Magedocumentation(models.Model):
    magedocumentation_id = models.IntegerField(primary_key=True)
    mageml = models.ForeignKey("Mageml", related_name="%(class)s_mageml", on_delete=models.PROTECT)
    tableinfo = models.ForeignKey("Tableinfo", related_name="%(class)s_tableinfo", on_delete=models.PROTECT)
    row_id = models.IntegerField()
    mageidentifier = models.TextField()
    class Meta:
        db_table = u'magedocumentation'

class Channel(models.Model):
    channel_id = models.IntegerField(primary_key=True)
    name = models.TextField(unique=True)
    definition = models.TextField()
    class Meta:
        db_table = u'channel'

class Protocolparam(models.Model):
    protocolparam_id = models.IntegerField(primary_key=True)
    protocol = models.ForeignKey("Protocol", related_name="%(class)s_protocol", on_delete=models.PROTECT)
    name = models.TextField()
    datatype = models.ForeignKey("Cvterm", related_name="%(class)s_datatype", null=True, blank=True, on_delete=models.PROTECT)
    unittype = models.ForeignKey("Cvterm", related_name="%(class)s_unittype", null=True, blank=True, on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'protocolparam'

class Tableinfo(models.Model):
    tableinfo_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=30, unique=True)
    primary_key_column = models.CharField(max_length=30, blank=True)
    is_view = models.IntegerField()
    view_on_table_id = models.IntegerField(null=True, blank=True)
    superclass_table_id = models.IntegerField(null=True, blank=True)
    is_updateable = models.IntegerField()
    modification_date = models.DateField()
    class Meta:
        db_table = u'tableinfo'

class Arraydesign(models.Model):
    arraydesign_id = models.IntegerField(primary_key=True)
    manufacturer = models.ForeignKey("Contact", related_name="%(class)s_manufacturer", on_delete=models.PROTECT)
    platformtype = models.ForeignKey("Cvterm", related_name="%(class)s_platformtype", on_delete=models.PROTECT)
    substratetype = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    protocol = models.ForeignKey("Protocol", null=True, blank=True, on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField(unique=True)
    version = models.TextField(blank=True)
    description = models.TextField(blank=True)
    array_dimensions = models.TextField(blank=True)
    element_dimensions = models.TextField(blank=True)
    num_of_elements = models.IntegerField(null=True, blank=True)
    num_array_columns = models.IntegerField(null=True, blank=True)
    num_array_rows = models.IntegerField(null=True, blank=True)
    num_grid_columns = models.IntegerField(null=True, blank=True)
    num_grid_rows = models.IntegerField(null=True, blank=True)
    num_sub_columns = models.IntegerField(null=True, blank=True)
    num_sub_rows = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'arraydesign'

class Assayprop(models.Model):
    assayprop_id = models.IntegerField(primary_key=True)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'assayprop'

class Arraydesignprop(models.Model):
    arraydesignprop_id = models.IntegerField(primary_key=True)
    arraydesign = models.ForeignKey("Arraydesign", related_name="%(class)s_arraydesign", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'arraydesignprop'

class AssayProject(models.Model):
    assay_project_id = models.IntegerField(primary_key=True)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    project = models.ForeignKey("Project", related_name="%(class)s_project", on_delete=models.PROTECT)
    class Meta:
        db_table = u'assay_project'

class Assay(models.Model):
    assay_id = models.IntegerField(primary_key=True)
    arraydesign = models.ForeignKey("Arraydesign", related_name="%(class)s_arraydesign", on_delete=models.PROTECT)
    protocol = models.ForeignKey("Protocol", null=True, blank=True, on_delete=models.PROTECT)
    assaydate = models.DateTimeField(null=True, blank=True)
    arrayidentifier = models.TextField(blank=True)
    arraybatchidentifier = models.TextField(blank=True)
    operator = models.ForeignKey("Contact", related_name="%(class)s_operator", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField(unique=True, blank=True)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'assay'

class BiomaterialDbxref(models.Model):
    biomaterial_dbxref_id = models.IntegerField(primary_key=True)
    biomaterial = models.ForeignKey("Biomaterial", related_name="%(class)s_biomaterial", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    class Meta:
        db_table = u'biomaterial_dbxref'

class BiomaterialRelationship(models.Model):
    biomaterial_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Biomaterial", related_name="%(class)s_subject", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    object = models.ForeignKey("Biomaterial", related_name="%(class)s_object", on_delete=models.PROTECT)
    class Meta:
        db_table = u'biomaterial_relationship'

class Biomaterial(models.Model):
    biomaterial_id = models.IntegerField(primary_key=True)
    taxon = models.ForeignKey("Organism", null=True, blank=True, on_delete=models.PROTECT)
    biosourceprovider = models.ForeignKey("Contact", null=True, blank=True, on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField(unique=True, blank=True)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'biomaterial'

class Biomaterialprop(models.Model):
    biomaterialprop_id = models.IntegerField(primary_key=True)
    biomaterial = models.ForeignKey("Biomaterial", related_name="%(class)s_biomaterial", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'biomaterialprop'

class Treatment(models.Model):
    treatment_id = models.IntegerField(primary_key=True)
    rank = models.IntegerField()
    biomaterial = models.ForeignKey("Biomaterial", related_name="%(class)s_biomaterial", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    protocol = models.ForeignKey("Protocol", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField(blank=True)
    class Meta:
        db_table = u'treatment'

class BiomaterialTreatment(models.Model):
    biomaterial_treatment_id = models.IntegerField(primary_key=True)
    biomaterial = models.ForeignKey("Biomaterial", related_name="%(class)s_biomaterial", on_delete=models.PROTECT)
    treatment = models.ForeignKey("Treatment", related_name="%(class)s_treatment", on_delete=models.PROTECT)
    unittype = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    value = models.FloatField(null=True, blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'biomaterial_treatment'

class Acquisitionprop(models.Model):
    acquisitionprop_id = models.IntegerField(primary_key=True)
    acquisition = models.ForeignKey("Acquisition", related_name="%(class)s_acquisition", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'acquisitionprop'

class AssayBiomaterial(models.Model):
    assay_biomaterial_id = models.IntegerField(primary_key=True)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    biomaterial = models.ForeignKey("Biomaterial", related_name="%(class)s_biomaterial", on_delete=models.PROTECT)
    channel = models.ForeignKey("Channel", null=True, blank=True, on_delete=models.PROTECT)
    rank = models.IntegerField()
    class Meta:
        db_table = u'assay_biomaterial'

class AcquisitionRelationship(models.Model):
    acquisition_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Acquisition", related_name="%(class)s_subject", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    object = models.ForeignKey("Acquisition", related_name="%(class)s_object", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'acquisition_relationship'

class Acquisition(models.Model):
    acquisition_id = models.IntegerField(primary_key=True)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    protocol = models.ForeignKey("Protocol", null=True, blank=True, on_delete=models.PROTECT)
    channel = models.ForeignKey("Channel", null=True, blank=True, on_delete=models.PROTECT)
    acquisitiondate = models.DateTimeField(null=True, blank=True)
    name = models.TextField(unique=True, blank=True)
    uri = models.TextField(blank=True)
    class Meta:
        db_table = u'acquisition'

class Protocol(models.Model):
    protocol_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", null=True, blank=True, on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField(unique=True)
    uri = models.TextField(blank=True)
    protocoldescription = models.TextField(blank=True)
    hardwaredescription = models.TextField(blank=True)
    softwaredescription = models.TextField(blank=True)
    class Meta:
        db_table = u'protocol'

class Quantificationprop(models.Model):
    quantificationprop_id = models.IntegerField(primary_key=True)
    quantification = models.ForeignKey("Quantification", related_name="%(class)s_quantification", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'quantificationprop'

class Control(models.Model):
    control_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    tableinfo = models.ForeignKey("Tableinfo", related_name="%(class)s_tableinfo", on_delete=models.PROTECT)
    row_id = models.IntegerField()
    name = models.TextField(blank=True)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'control'

class QuantificationRelationship(models.Model):
    quantification_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Quantification", related_name="%(class)s_subject", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    object = models.ForeignKey("Quantification", related_name="%(class)s_object", on_delete=models.PROTECT)
    class Meta:
        db_table = u'quantification_relationship'

class Element(models.Model):
    element_id = models.IntegerField(primary_key=True)
    feature = models.ForeignKey("Feature", null=True, blank=True, on_delete=models.PROTECT)
    arraydesign = models.ForeignKey("Arraydesign", related_name="%(class)s_arraydesign", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    class Meta:
        db_table = u'element'

class Quantification(models.Model):
    quantification_id = models.IntegerField(primary_key=True)
    acquisition = models.ForeignKey("Acquisition", related_name="%(class)s_acquisition", on_delete=models.PROTECT)
    operator = models.ForeignKey("Contact", null=True, blank=True, on_delete=models.PROTECT)
    protocol = models.ForeignKey("Protocol", null=True, blank=True, on_delete=models.PROTECT)
    analysis = models.ForeignKey("Analysis", related_name="%(class)s_analysis", on_delete=models.PROTECT)
    quantificationdate = models.DateTimeField(null=True, blank=True)
    name = models.TextField(blank=True)
    uri = models.TextField(blank=True)
    class Meta:
        db_table = u'quantification'

class ElementRelationship(models.Model):
    element_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Element", related_name="%(class)s_subject", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    object = models.ForeignKey("Element", related_name="%(class)s_object", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'element_relationship'

class StudyAssay(models.Model):
    study_assay_id = models.IntegerField(primary_key=True)
    study = models.ForeignKey("Study", related_name="%(class)s_study", on_delete=models.PROTECT)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    class Meta:
        db_table = u'study_assay'

class Elementresult(models.Model):
    elementresult_id = models.IntegerField(primary_key=True)
    element = models.ForeignKey("Element", related_name="%(class)s_element", on_delete=models.PROTECT)
    quantification = models.ForeignKey("Quantification", related_name="%(class)s_quantification", on_delete=models.PROTECT)
    signal = models.FloatField()
    class Meta:
        db_table = u'elementresult'

class ElementresultRelationship(models.Model):
    elementresult_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Elementresult", related_name="%(class)s_subject", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    object = models.ForeignKey("Elementresult", related_name="%(class)s_object", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'elementresult_relationship'

class Study(models.Model):
    study_id = models.IntegerField(primary_key=True)
    contact = models.ForeignKey("Contact", related_name="%(class)s_contact", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", null=True, blank=True, on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField(unique=True)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'study'

class Studydesignprop(models.Model):
    studydesignprop_id = models.IntegerField(primary_key=True)
    studydesign = models.ForeignKey("Studydesign", related_name="%(class)s_studydesign", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'studydesignprop'

class Studydesign(models.Model):
    studydesign_id = models.IntegerField(primary_key=True)
    study = models.ForeignKey("Study", related_name="%(class)s_study", on_delete=models.PROTECT)
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'studydesign'

class Studyfactor(models.Model):
    studyfactor_id = models.IntegerField(primary_key=True)
    studydesign = models.ForeignKey("Studydesign", related_name="%(class)s_studydesign", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    name = models.TextField()
    description = models.TextField(blank=True)
    class Meta:
        db_table = u'studyfactor'

class Studyfactorvalue(models.Model):
    studyfactorvalue_id = models.IntegerField(primary_key=True)
    studyfactor = models.ForeignKey("Studyfactor", related_name="%(class)s_studyfactor", on_delete=models.PROTECT)
    assay = models.ForeignKey("Assay", related_name="%(class)s_assay", on_delete=models.PROTECT)
    factorvalue = models.TextField(blank=True)
    name = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'studyfactorvalue'

class Studyprop(models.Model):
    studyprop_id = models.IntegerField(primary_key=True)
    study = models.ForeignKey("Study", related_name="%(class)s_study", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'studyprop'

class StudypropFeature(models.Model):
    studyprop_feature_id = models.IntegerField(primary_key=True)
    studyprop = models.ForeignKey("Studyprop", related_name="%(class)s_studyprop", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", null=True, blank=True, on_delete=models.PROTECT)
    class Meta:
        db_table = u'studyprop_feature'

class StockpropPub(models.Model):
    stockprop_pub_id = models.IntegerField(primary_key=True)
    stockprop = models.ForeignKey("Stockprop", related_name="%(class)s_stockprop", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'stockprop_pub'

class StockPub(models.Model):
    stock_pub_id = models.IntegerField(primary_key=True)
    stock = models.ForeignKey("Stock", related_name="%(class)s_stock", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'stock_pub'

class Stockprop(models.Model):
    stockprop_id = models.IntegerField(primary_key=True)
    stock = models.ForeignKey("Stock", related_name="%(class)s_stock", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'stockprop'

class StockRelationship(models.Model):
    stock_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("Stock", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("Stock", related_name="%(class)s_object", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'stock_relationship'

class StockRelationshipPub(models.Model):
    stock_relationship_pub_id = models.IntegerField(primary_key=True)
    stock_relationship = models.ForeignKey("StockRelationship", related_name="%(class)s_relationship", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'stock_relationship_pub'

class Stock(models.Model):
    stock_id = models.IntegerField(primary_key=True)
    dbxref = models.ForeignKey("Dbxref", null=True, blank=True, on_delete=models.PROTECT)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True)
    uniquename = models.TextField()
    description = models.TextField(blank=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    is_obsolete = models.BooleanField()
    class Meta:
        db_table = u'stock'

class StockDbxref(models.Model):
    stock_dbxref_id = models.IntegerField(primary_key=True)
    stock = models.ForeignKey("Stock", related_name="%(class)s_stock", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    class Meta:
        db_table = u'stock_dbxref'

class StockCvterm(models.Model):
    stock_cvterm_id = models.IntegerField(primary_key=True)
    stock = models.ForeignKey("Stock", related_name="%(class)s_stock", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'stock_cvterm'

class Stockcollection(models.Model):
    stockcollection_id = models.IntegerField(primary_key=True)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    contact = models.ForeignKey("Contact", null=True, blank=True, on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True)
    uniquename = models.TextField()
    class Meta:
        db_table = u'stockcollection'

class StockGenotype(models.Model):
    stock_genotype_id = models.IntegerField(primary_key=True)
    stock = models.ForeignKey("Stock", related_name="%(class)s_stock", on_delete=models.PROTECT)
    genotype = models.ForeignKey("Genotype", related_name="%(class)s_genotype", on_delete=models.PROTECT)
    class Meta:
        db_table = u'stock_genotype'

class Stockcollectionprop(models.Model):
    stockcollectionprop_id = models.IntegerField(primary_key=True)
    stockcollection = models.ForeignKey("Stockcollection", related_name="%(class)s_stockcollection", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'stockcollectionprop'

class StockcollectionStock(models.Model):
    stockcollection_stock_id = models.IntegerField(primary_key=True)
    stockcollection = models.ForeignKey("Stockcollection", related_name="%(class)s_stockcollection", on_delete=models.PROTECT)
    stock = models.ForeignKey("Stock", related_name="%(class)s_stock", on_delete=models.PROTECT)
    class Meta:
        db_table = u'stockcollection_stock'

class LibrarySynonym(models.Model):
    library_synonym_id = models.IntegerField(primary_key=True)
    synonym = models.ForeignKey("Synonym", related_name="%(class)s_synonym", on_delete=models.PROTECT)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    is_internal = models.BooleanField()
    class Meta:
        db_table = u'library_synonym'

class Libraryprop(models.Model):
    libraryprop_id = models.IntegerField(primary_key=True)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'libraryprop'

class LibraryPub(models.Model):
    library_pub_id = models.IntegerField(primary_key=True)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'library_pub'

class LibrarypropPub(models.Model):
    libraryprop_pub_id = models.IntegerField(primary_key=True)
    libraryprop = models.ForeignKey("Libraryprop", related_name="%(class)s_libraryprop", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'libraryprop_pub'

class LibraryCvterm(models.Model):
    library_cvterm_id = models.IntegerField(primary_key=True)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'library_cvterm'

class Synonym(models.Model):
    synonym_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    synonym_sgml = models.CharField(max_length=255)
    class Meta:
        db_table = u'synonym'

class Library(models.Model):
    library_id = models.IntegerField(primary_key=True)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    name = models.CharField(max_length=255, blank=True)
    uniquename = models.TextField()
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    is_obsolete = models.IntegerField()
    timeaccessioned = models.DateTimeField()
    timelastmodified = models.DateTimeField()
    class Meta:
        db_table = u'library'

class LibraryFeature(models.Model):
    library_feature_id = models.IntegerField(primary_key=True)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    class Meta:
        db_table = u'library_feature'

class LibraryDbxref(models.Model):
    library_dbxref_id = models.IntegerField(primary_key=True)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    class Meta:
        db_table = u'library_dbxref'

class CellLineSynonym(models.Model):
    cell_line_synonym_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    synonym = models.ForeignKey("Synonym", related_name="%(class)s_synonym", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    is_internal = models.BooleanField()
    class Meta:
        db_table = u'cell_line_synonym'

class CellLineCvterm(models.Model):
    cell_line_cvterm_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    cvterm = models.ForeignKey("Cvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    rank = models.IntegerField()
    class Meta:
        db_table = u'cell_line_cvterm'

class CellLineDbxref(models.Model):
    cell_line_dbxref_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    dbxref = models.ForeignKey("Dbxref", related_name="%(class)s_dbxref", on_delete=models.PROTECT)
    is_current = models.BooleanField()
    class Meta:
        db_table = u'cell_line_dbxref'

class CellLineRelationship(models.Model):
    cell_line_relationship_id = models.IntegerField(primary_key=True)
    subject = models.ForeignKey("CellLine", related_name="%(class)s_subject", on_delete=models.PROTECT)
    object = models.ForeignKey("CellLine", related_name="%(class)s_object", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    class Meta:
        db_table = u'cell_line_relationship'

class CellLine(models.Model):
    cell_line_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True)
    uniquename = models.CharField(max_length=255)
    organism = models.ForeignKey("Organism", related_name="%(class)s_organism", on_delete=models.PROTECT)
    timeaccessioned = models.DateTimeField()
    timelastmodified = models.DateTimeField()
    class Meta:
        db_table = u'cell_line'

class CellLineprop(models.Model):
    cell_lineprop_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'cell_lineprop'

class CellLinepropPub(models.Model):
    cell_lineprop_pub_id = models.IntegerField(primary_key=True)
    cell_lineprop = models.ForeignKey("CellLineprop", related_name="%(class)s_lineprop", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'cell_lineprop_pub'

class FpKey(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    pkey = models.CharField(max_length=1024, blank=True)
    value = models.TextField(blank=True)
    class Meta:
        db_table = u'fp_key'

class CellLineLibrary(models.Model):
    cell_line_library_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    library = models.ForeignKey("Library", related_name="%(class)s_library", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'cell_line_library'

class Gffatts(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    type = models.TextField(blank=True)
    attribute = models.CharField(max_length=100, blank=True) # Changed max length from -1 to 100
    class Meta:
        db_table = u'gffatts'

class Gff3Atts(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    type = models.TextField(blank=True)
    attribute = models.CharField(max_length=100, blank=True) # Changed max length from -1 to 100
    class Meta:
        db_table = u'gff3atts'

class CellLineFeature(models.Model):
    cell_line_feature_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    feature = models.ForeignKey("Feature", related_name="%(class)s_feature", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'cell_line_feature'

class Gff3View(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    ref = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=1024, blank=True)
    fstart = models.IntegerField(null=True, blank=True)
    fend = models.IntegerField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    strand = models.SmallIntegerField(null=True, blank=True)
    phase = models.IntegerField(null=True, blank=True)
    seqlen = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    organism_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'gff3view'

class AllFeatureNames(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    organism_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'all_feature_names'

class CellLineCvtermprop(models.Model):
    cell_line_cvtermprop_id = models.IntegerField(primary_key=True)
    cell_line_cvterm = models.ForeignKey("CellLineCvterm", related_name="%(class)s_cvterm", on_delete=models.PROTECT)
    type = models.ForeignKey("Cvterm", related_name="%(class)s_type", on_delete=models.PROTECT)
    value = models.TextField(blank=True)
    rank = models.IntegerField()
    class Meta:
        db_table = u'cell_line_cvtermprop'

class Dfeatureloc(models.Model):
    featureloc_id = models.IntegerField(null=True, blank=True)
    feature_id = models.IntegerField(null=True, blank=True)
    srcfeature_id = models.IntegerField(null=True, blank=True)
    nbeg = models.IntegerField(null=True, blank=True)
    is_nbeg_partial = models.NullBooleanField(null=True, blank=True)
    nend = models.IntegerField(null=True, blank=True)
    is_nend_partial = models.NullBooleanField(null=True, blank=True)
    strand = models.SmallIntegerField(null=True, blank=True)
    phase = models.IntegerField(null=True, blank=True)
    residue_info = models.TextField(blank=True)
    locgroup = models.IntegerField(null=True, blank=True)
    rank = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'dfeatureloc'

class FType(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    dbxref_id = models.IntegerField(null=True, blank=True)
    type = models.CharField(max_length=1024, blank=True)
    residues = models.TextField(blank=True)
    seqlen = models.IntegerField(null=True, blank=True)
    md5checksum = models.CharField(max_length=32, blank=True)
    type_id = models.IntegerField(null=True, blank=True)
    timeaccessioned = models.DateTimeField(null=True, blank=True)
    timelastmodified = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = u'f_type'

class CellLinePub(models.Model):
    cell_line_pub_id = models.IntegerField(primary_key=True)
    cell_line = models.ForeignKey("CellLine", related_name="%(class)s_line", on_delete=models.PROTECT)
    pub = models.ForeignKey("Pub", related_name="%(class)s_pub", on_delete=models.PROTECT)
    class Meta:
        db_table = u'cell_line_pub'

class FeatureMeets(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_meets'

class FeatureMeetsOnSameStrand(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_meets_on_same_strand'

class FnrType(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    dbxref_id = models.IntegerField(null=True, blank=True)
    type = models.CharField(max_length=1024, blank=True)
    residues = models.TextField(blank=True)
    seqlen = models.IntegerField(null=True, blank=True)
    md5checksum = models.CharField(max_length=32, blank=True)
    type_id = models.IntegerField(null=True, blank=True)
    timeaccessioned = models.DateTimeField(null=True, blank=True)
    timelastmodified = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = u'fnr_type'

class FLoc(models.Model):
    feature_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    dbxref_id = models.IntegerField(null=True, blank=True)
    nbeg = models.IntegerField(null=True, blank=True)
    nend = models.IntegerField(null=True, blank=True)
    strand = models.SmallIntegerField(null=True, blank=True)
    class Meta:
        db_table = u'f_loc'

class FeatureDisjoint(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_disjoint'

class FeatureUnion(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    srcfeature_id = models.IntegerField(null=True, blank=True)
    subject_strand = models.SmallIntegerField(null=True, blank=True)
    object_strand = models.SmallIntegerField(null=True, blank=True)
    fmin = models.IntegerField(null=True, blank=True)
    fmax = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_union'

class FeatureIntersection(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    srcfeature_id = models.IntegerField(null=True, blank=True)
    subject_strand = models.SmallIntegerField(null=True, blank=True)
    object_strand = models.SmallIntegerField(null=True, blank=True)
    fmin = models.IntegerField(null=True, blank=True)
    fmax = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_intersection'

class FeatureDifference(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    srcfeature_id = models.SmallIntegerField(null=True, blank=True)
    fmin = models.IntegerField(null=True, blank=True)
    fmax = models.IntegerField(null=True, blank=True)
    strand = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_difference'

class FeatureDistance(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    srcfeature_id = models.IntegerField(null=True, blank=True)
    subject_strand = models.SmallIntegerField(null=True, blank=True)
    object_strand = models.SmallIntegerField(null=True, blank=True)
    distance = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_distance'

class FeatureContains(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'feature_contains'

class FeaturesetMeets(models.Model):
    subject_id = models.IntegerField(null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'featureset_meets'

class GeneOrder(models.Model):
    gene_order_id = models.IntegerField(primary_key=True)
    chromosome = models.ForeignKey("Feature", related_name="%(class)s_chromosome", on_delete=models.PROTECT)
    gene = models.ForeignKey("Feature", related_name="%(class)s_gene", on_delete=models.PROTECT)
    number = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'gene_order'

class GeneFamilyAssignment(models.Model):
    gene_family_assignment_id = models.IntegerField(primary_key=True)
    gene = models.ForeignKey("Feature", related_name="%(class)s_gene", on_delete=models.PROTECT)
    family_label = models.TextField(blank=False)
    class Meta:
        db_table = u'gene_family_assignment'

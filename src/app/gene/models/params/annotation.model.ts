// Annotations of the view: boxes, gaps, notes, column headers and sites,
// anchored to genes and positions (gene/annotations/grammar.ts), so a
// shared link draws them on the same data.
import { Annotation, parseAnnotations } from '@gcv/gene/annotations/grammar';

export type ParsedAnnotations = {
  items: Annotation[];
  // the items the URL held that couldn't be read, for the view to report
  rejected: string[];
};

export type AnnotationListParams = {
  annot: ParsedAnnotations;
};

export const annotationListParamMembers = ['annot'];

export const annotationListParamValidators = {};

export const annotationListParamParsers = {
  annot: (s: string | string[]): ParsedAnnotations => {
    const { annotations, rejected } = parseAnnotations(
      Array.isArray(s) ? s.join(';') : s,
    );
    return { items: annotations, rejected };
  },
};

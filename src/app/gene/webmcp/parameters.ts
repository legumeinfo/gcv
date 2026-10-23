// The gene view's URL parameters described for agents: what each one means,
// its JSON Schema, and validation with the same validators the URL guard uses.
import { FormControl } from '@angular/forms';
// app
import { AppConfig } from '@gcv/core/models';
import {
  ALIGNMENT_ALGORITHMS,
  MACRO_ORDER_ALGORITHMS,
  MICRO_ORDER_ALGORITHMS,
} from '@gcv/gene/algorithms';
import { LINKAGES } from '@gcv/gene/constants';
import { Params, paramValidators } from '@gcv/gene/models/params';
import { initialState } from '@gcv/gene/store/reducers/params.reducer';

type ParameterSchema = {
  type: 'integer' | 'number' | 'string' | 'array';
  description: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: { type: 'string'; enum: string[] };
};

const ids = (items: { id: string }[]): string[] => items.map((i) => i.id);

// sources the gene view can search, i.e. those with micro-synteny search
export function microSearchSourceIDs(): string[] {
  return AppConfig.servers
    .filter((s) => s.microSearch !== undefined)
    .map((s) => s.id);
}

// one entry per member of paramMembers, grouped by the pipeline stage it tunes
export function parameterSchemas(): Record<string, ParameterSchema> {
  return {
    // query neighborhoods and micro-synteny search
    neighbors: {
      type: 'integer',
      minimum: 1,
      description:
        "Genes on each side of every query gene; a query track spans 2×neighbors+1 genes. To find a region the view misses, raise this first, with intermediate. After a polyploidy, fractionation removes genes from each copy of a region: where the result's copy lost genes, fewer of the query's families survive in it, and a wider window supplies more of them to reach matched.",
    },
    matched: {
      type: 'number',
      minimum: 0,
      description:
        'Micro-synteny search: minimum gene families a result track must share with the query. An integer is a count; a value in (0, 1] is a fraction of the query track. A low value admits tracks that share a few families by chance, more so when large or tandem families are in the view; raise neighbors before lowering it, and treat tracks found only at a low value as candidates to check.',
    },
    intermediate: {
      type: 'number',
      minimum: 0,
      description:
        "Micro-synteny search: maximum non-matching genes between successive matching genes in a result track. An integer is a count; a value in (0, 1] is a fraction. Raise it with neighbors for fractionated regions: where the query's copy lost genes, the result keeps genes whose families aren't in the query track, so its matching genes lie farther apart.",
    },
    sources: {
      type: 'array',
      items: { type: 'string', enum: microSearchSourceIDs() },
      description: 'Data sources to load query genes from and search.',
    },
    // clustering of query tracks
    linkage: {
      type: 'string',
      enum: ids(LINKAGES),
      description:
        'Linkage for the hierarchical clustering that groups query tracks into micro-synteny viewers.',
    },
    cthreshold: {
      type: 'integer',
      minimum: 1,
      description:
        'Clustering threshold: the maximum edit distance between gene-family sequences of query tracks in one cluster.',
    },
    // alignment of result tracks to each cluster's consensus
    algorithm: {
      type: 'string',
      enum: ids(ALIGNMENT_ALGORITHMS),
      description:
        "Aligns result tracks to their cluster's consensus. 'smith-waterman' gives each track its best local alignment, inverted or not; 'repeat' can align one track several times, finding repeats and rearrangements.",
    },
    match: {
      type: 'integer',
      minimum: 1,
      description: 'Alignment score for a matching gene family.',
    },
    mismatch: {
      type: 'integer',
      maximum: -1,
      description: 'Alignment penalty for mismatching gene families.',
    },
    gap: {
      type: 'integer',
      maximum: -1,
      description: 'Alignment penalty for a gap.',
    },
    score: {
      type: 'integer',
      minimum: 1,
      description:
        'Minimum alignment score for a result track to be shown and reported. Like a low matched, a low score admits weak alignments that may be chance.',
    },
    threshold: {
      type: 'integer',
      minimum: 1,
      description:
        "Minimum score of a 'repeat' alignment segment for it to contribute to the alignment.",
    },
    // micro-synteny display
    regexp: {
      type: 'string',
      description:
        "Regular expression that keeps only the result tracks whose 'genus:species:chromosome' matches; empty keeps all.",
    },
    order: {
      type: 'string',
      enum: ids(MICRO_ORDER_ALGORITHMS),
      description:
        "Result track order: 'chromosome' by name, 'distance' by alignment score, best first.",
    },
    // macro-synteny blocks
    bmatched: {
      type: 'integer',
      minimum: 1,
      description:
        'Macro-synteny: minimum gene families shared by the query and a target chromosome in each block.',
    },
    bintermediate: {
      type: 'integer',
      minimum: 0,
      description:
        'Macro-synteny: maximum non-matching genes between successive matching genes in a block.',
    },
    bmask: {
      type: 'integer',
      minimum: 1,
      description:
        'Macro-synteny: families occurring more than this many times on a chromosome are ignored.',
    },
    bchrgenes: {
      type: 'integer',
      minimum: 1,
      description:
        'Macro-synteny: ignore target chromosomes with fewer genes than this.',
    },
    bchrlength: {
      type: 'integer',
      minimum: 1,
      description:
        'Macro-synteny: ignore target chromosomes shorter than this many base pairs.',
    },
    bregexp: {
      type: 'string',
      description:
        "Regular expression that keeps only the macro-synteny targets whose 'chromosome:genus:species' matches; empty keeps all.",
    },
    border: {
      type: 'string',
      enum: ids(MACRO_ORDER_ALGORITHMS),
      description:
        "Macro-synteny target order: 'chromosome' by name, 'position' by first block on the query chromosome, 'distance' by genes covered and block similarity, best first.",
    },
  };
}

// the defaults the view falls back to for parameters absent from the URL
export function parameterDefaults(): Params {
  return { ...initialState };
}

function constraint(schema: ParameterSchema): string {
  if (schema.enum !== undefined) {
    return `one of ${schema.enum.join(', ')}`;
  }
  const bounds = [
    schema.minimum !== undefined ? `≥ ${schema.minimum}` : '',
    schema.maximum !== undefined ? `≤ ${schema.maximum}` : '',
  ].filter((b) => b !== '');
  const kind = schema.type === 'integer' ? 'an integer' : 'a number';
  return [kind, ...bounds].join(' ');
}

// Checks a partial parameter update with the URL validators, plus the checks
// those validators leave out (source IDs and regular expression syntax).
export function validateParameterUpdate(update: Record<string, unknown>): {
  params: Record<string, unknown>;
  errors: string[];
} {
  const schemas = parameterSchemas();
  const params: Record<string, unknown> = {};
  const errors: string[] = [];
  Object.entries(update).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    const schema = schemas[key];
    if (schema === undefined) {
      errors.push(`${key}: not a parameter`);
      return;
    }
    if (key === 'sources') {
      const sources = value as string[];
      const known = new Set(schema.items.enum);
      const unknown = sources.filter((s) => !known.has(s));
      if (sources.length === 0) {
        errors.push('sources: name at least one source');
      } else if (unknown.length > 0) {
        errors.push(
          `sources: unknown ${unknown.join(', ')}; choose from ${schema.items.enum.join(', ')}`,
        );
      } else {
        params[key] = sources;
      }
      return;
    }
    if (key === 'regexp' || key === 'bregexp') {
      try {
        new RegExp(value as string);
      } catch {
        errors.push(`${key}: not a valid regular expression`);
        return;
      }
    }
    const control = new FormControl(String(value));
    const invalid = paramValidators[key]?.(control);
    if (invalid) {
      errors.push(
        `${key}: invalid value ${JSON.stringify(value)}; must be ${constraint(schema)}`,
      );
      return;
    }
    params[key] = value;
  });
  return { params, errors };
}

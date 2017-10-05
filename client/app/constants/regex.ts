export const enum Regex {
  FRACTION_TO_ONE       = '0\.[0]*[1-9][0-9]*|1',
  POSITIVE_INT          = '[1-9][0-9]*',
  POSITIVE_INT_AND_ZERO = '0|[1-9][0-9]*',
  NEGATIVE_INT          = '-[1-9][0-9]*',
  TWO_OR_GREATER        = '[2-9]|[1-9]\d{1,}'
}

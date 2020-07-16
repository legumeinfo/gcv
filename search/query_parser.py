from pyparsing import Group, Optional, Suppress, Word, ZeroOrMore, alphanums, nums


def makeQueryParser(name_special_characters=''):
  uint = Word(nums)
  name = Word(alphanums + name_special_characters)
  interval = uint + Suppress('-') + uint
  gene = Group(Suppress(Optional('gene:')) + name)\
             .setResultsName('genes', listAllMatches=True)
  region = Group(Suppress(Optional('region:')) + name + interval)\
               .setResultsName('regions', listAllMatches=True)
  parser = ZeroOrMore(region | gene)
  return parser


if __name__ == '__main__':
  parser = makeQueryParser('._-')
  test_queries = [
    'phavu.Phvul.002G085200',
    'gene:phavu.Phvul.002G085200',
    'gene: phavu.Phvul.002G085200',
    'phavu.Chr02 10-123',
    'region:phavu.Chr02 432-2415',
    'region: phavu.Chr02 432-2415',
    'phavu.Phvul.002G085200 phavu.Chr02 10-123  phavu.Chr02 10-123',
  ]
  for query in test_queries:
    print(query)
    for results, start, end in parser.scanString(query):
      if 'genes' in results:
        print('genes:')
        print(results['genes'])
      if 'regions' in results:
        print('regions:')
        print(results['regions'])
      print()

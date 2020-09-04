from pyparsing import Group, Optional, Suppress, Word, ZeroOrMore, alphanums, nums


def makeQueryParser(name_special_characters=''):
  uint = Word(nums).setParseAction(lambda toks: int(toks[0]))
  name = Word(alphanums + name_special_characters)
  interval = uint + Suppress(Group('-')|Group('..')) + uint
  gene = Group(Suppress(Optional('gene:')) + name)\
             .setResultsName('genes', listAllMatches=True)
  region = Group(Suppress(Optional('region:')) + name + Suppress(Optional(':')) + interval)\
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
    'phavu.Chr02 432 -2415',
    'phavu.Chr02 432 - 2415',
    'phavu.Chr02 10..123',
    'phavu.Chr02 432 ..2415',
    'phavu.Chr02 432 .. 2415',
    'phavu.Chr02:432-2415',
    'phavu.Chr02:432..2415',
    'phavu.Chr02: 432..2415',
    'region:phavu.Chr02 432 .. -2415',
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

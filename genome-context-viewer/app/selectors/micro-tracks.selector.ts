//export const filteredModel = () => {
//  return state => state
//    .map(([people, filter]) => {
//      return {
//        total: people.length
//        people: people.filter(filter),
//        attending: people.filter(person => person.attending).length,
//        guests: people.reduce((acc, curr) => acc + curr.guests, 0)
//      }
//    })
//};
//
//this.model = Observable.combineLatest(
//    _store.select('people')
//    _store.select('partyFilter')
//  ).let(filterModel());

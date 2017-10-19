// return a family size map
export function getFamilySizeMap(data) {
  // make a family size map
  var family_sizes = {};
  for (var i = 0; i < data.groups.length; i++) {
  	for (var j = 0; j < data.groups[i].genes.length; j++) {
  	  var family = data.groups[i].genes[j].family;
  	  if (family in family_sizes) {
  	  	family_sizes[family] += 1;
  	  } else {
  	  	family_sizes[family] = 1;
  	  }
  	}
  }
  return family_sizes;
}

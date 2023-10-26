import identicalArrays from './identicalArrays'

export default function identicalCartItems(item1, item2) {
  return item1.comment === item2.comment &&
    identicalSpecifications(item1.specifications, item2.specifications) &&
    identicalFilters(item1.filters, item2.filters) &&
    identicalModifications(item1.modifications, item2.modifications)
}


export const identicalSpecifications = (spec1, spec2) => {
  if (!spec1 && !spec2) {
    return true
  }
  else if (spec1 && !spec2 || !spec1 && spec2) {
    return false
  }
  /*
    Specs are identical when the spec_ids are identical 
    AND
    there is no spec_id
      where there are a different number of options
      OR
      there is a option not present in the other item
  */
  return identicalArrays(Object.keys(spec1).sort(), Object.keys(spec2).sort()) &&
    !~Object.keys(spec1).findIndex(spec_id => {
      return spec1[spec_id].options.length !== spec2[spec_id].options.length ||
        ~spec1[spec_id].options.findIndex(option => {
          return !spec2[spec_id].options.some(option2 => option.name === option2.name && option.price === option2.price && option.quantity === option2.quantity)
        })
    })
  // This assumes no changes to option pricing during ordering
}

export const identicalFilters = (fil1, fil2) => {
  if (!fil1 && !fil2) {
    return true
  }
  else if (fil1 && !fil2 || fil1 && !fil2) {
    return false
  }
  return identicalArrays(Object.keys(fil1).sort(), Object.keys(fil2).sort()) &&
    !~Object.keys(fil1).findIndex(key => fil1[key] !== fil2[key])
}

export const identicalModifications = (mod1, mod2) => {
  if (!mod1 && !mod2) {
    return true
  }
  else if (mod1 && !mod2 || mod1 && !mod2) {
    return false
  }
  return identicalArrays(Object.keys(mod1).sort(), Object.keys(mod2).sort()) &&
    !~Object.keys(mod1).findIndex(mod_id => mod1[mod_id].name !== mod2[mod_id].name || mod1[mod_id].price !== mod2[mod_id].price || mod1[mod_id].quantity !== mod2[mod_id].quantity)
}


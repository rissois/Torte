import { initialFilters } from "../../redux/reducers/reducerFilters"
import arrayToCommaList from "./arrayToCommaList"

const sizeToCaption = size => {
  return size.name ?? ''
}

const filtersToArray = filters => {
  // initialFilters keeps the filters sorted
  return Object.keys(initialFilters).sort((a, b) => a > b).filter(filterKey => filters.hasOwnProperty(filterKey)).map(key => initialFilters[key].name.toUpperCase())
}
const filtersToCaption = filters => {
  return arrayToCommaList(filtersToArray(filters))
}

const optionsToArray = options => options.sort((a, b) => a.index - b.index).map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name)
const optionsToCaption = options => arrayToCommaList(optionsToArray(options))

const modifiersToArray = modifiers => {
  return Object.keys(modifiers).sort((a, b) => modifiers[a].index - modifiers[b].index).map(modifier_id => {
    return modifiers[modifier_id].name.toUpperCase() + ': ' + optionsToCaption(modifiers[modifier_id].mods)
  })
}

const modifiersToCaption = modifiers => {
  return modifiersToArray(modifiers).join('\n')
}

const customToArray = custom => {
  return custom.map(c => c.name + (c.price ? ` (${centsToDollar(c.price)})` : ''))
}

const customToCaption = custom => {
  return arrayToCommaList(customToArray(custom))
}

export const selectionsToCaptions = ({ size, modifiers, upsells, filters },) => {
  let captions = { size: '', modifiers: '', filters: '', upsells: '', custom: '', one_line: '', line_break: '' }
  let oneLineArray = []
  let lineBreakArray = []

  if (size.name) {
    const sizeCaption = sizeToCaption(size)
    captions.size = sizeCaption
    oneLineArray.push(sizeCaption.toUpperCase())
    lineBreakArray.push(sizeCaption.toUpperCase())
  }

  if (Object.keys(modifiers).length) {
    const modifierArray = modifiersToArray(modifiers)
    captions.modifiers = modifierArray.join('\n')
    oneLineArray.push(modifierArray.join('; '))
    lineBreakArray.push(modifierArray.join('\n'))
  }

  if (Object.keys(filters).length) {
    const filterCaption = filtersToCaption(filters)
    captions.filters = filterCaption
    oneLineArray.push(filterCaption)
    lineBreakArray.push(filterCaption)
  }

  if (upsells.length) {
    const upsellCaption = optionsToCaption(upsells)
    captions.upsells = upsellCaption
    oneLineArray.push(upsellCaption)
    lineBreakArray.push(upsellCaption)
  }

  captions.one_line = oneLineArray.join(' / ')
  captions.line_break = lineBreakArray.join('\n')

  return captions
}
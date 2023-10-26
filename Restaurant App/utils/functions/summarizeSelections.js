import { initialFilters } from "../../redux/selectors/selectorsBillItems"
import arrayToCommaList from "./arrayToCommaList"
import centsToDollar from "./centsToDollar"

const compedToCaption = comped => {
  if (comped.percent) return `COMPED ${comped.percent}%`
  return `COMPED ${centsToDollar(comped.subtotal)}`
}

const sizeToCaption = size => {
  return size?.name ?? ''
}

export const filtersToArray = filters => {
  // initialFilters keeps the filters sorted
  return Object.keys(initialFilters).sort((a, b) => a > b).filter(filterKey => filters.hasOwnProperty(filterKey)).map(key => initialFilters[key].name.toUpperCase())
}
const filtersToCaption = filters => {
  return arrayToCommaList(filtersToArray(filters))
}

export const optionsToArray = options => options.sort((a, b) => a.index - b.index).map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name)
export const optionsToCaption = options => arrayToCommaList(optionsToArray(options))

const modifiersToArray = modifiers => {
  return Object.keys(modifiers).sort((a, b) => modifiers[a].index - modifiers[b].index).map(modifier_id => {
    return modifiers[modifier_id].name.toUpperCase() + ': ' + optionsToCaption(modifiers[modifier_id].mods)
  })
}

const modifiersToCaption = modifiers => {
  return modifiersToArray(modifiers).join('\n')
}

export const customToArray = custom => {
  return custom.map(c => c.name + (c.price ? ` (${centsToDollar(c.price)})` : ''))
}

const customToCaption = custom => {
  return arrayToCommaList(customToArray(custom))
}

export const selectionsToCaptions = ({ size, modifiers, upsells, filters, custom, comped },) => {
  let captions = { size: '', modifiers: '', filters: '', upsells: '', custom: '', one_line: '', line_break: '', comped: '', }
  let oneLineArray = []
  let lineBreakArray = []

  if (comped?.is_comped) {
    const compedCaption = compedToCaption(comped)
    captions.comped = compedCaption
    oneLineArray.push(compedCaption)
    lineBreakArray.push(compedCaption)
  }

  if (size?.name) {
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

  if (custom.length) {
    const customCaption = customToCaption(custom)
    captions.custom = customCaption
    oneLineArray.push(customCaption)
    lineBreakArray.push(customCaption)
  }

  captions.one_line = oneLineArray.join(' / ')
  captions.line_break = lineBreakArray.join('\n')

  return captions
}
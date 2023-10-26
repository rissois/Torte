import React, { useState, useCallback, useEffect } from 'react';
import {
  PixelRatio,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Colors from '../../utils/constants/Colors';
import arrayToCommaList from '../../utils/functions/arrayToCommaList';
import { appendPriceToName } from '../functions/appendPriceToName';
import { DefaultText, MediumText } from '../../utils/components/NewStyledText';
import { MaterialIcons } from '@expo/vector-icons';
import { doSelectionsFilterToggle } from '../../redux/actions/actionsSelections';
import { selectTrackedItem } from '../../redux/selectors/selectorsItems';
import { ItemOption2 } from './ItemOption2';
import { initialFilters } from '../../redux/reducers/reducerFilters';
import { useActiveFilterKeys } from '../../utils/hooks/useFilters';
import { useIsFilterSelected } from '../../utils/hooks/useSelections'
/*
  TRANSFORMATION:

  Items
  [key]: bool || number

  BillGroups
  [key]: number
*/

export default function ItemFilters({ }) {
  const dispatch = useDispatch()

  const { filters = {}, is_filter_list_approved } = useSelector(selectTrackedItem)
  const activeFilterKeys = useActiveFilterKeys()

  const [showFilters, setShowFilters] = useState(true)
  const [selectableFilterKeys, setSelectableFilterKeys] = useState([])

  const toggleFilterSelection = useCallback((key) => dispatch(doSelectionsFilterToggle(key, filters[key])), [filters])

  // Initialize selections based on prior active filters or BillItem
  useEffect(() => {
    Object.keys(filters).forEach(key => {
      if (typeof filters[key] === 'number' && activeFilterKeys.includes(key)) {
        toggleFilterSelection(key)
      }
    })
  }, [])

  // Create array of keys for toggleable filters
  useEffect(() => {
    setSelectableFilterKeys(Object.keys(filters).reduce((acc, key) => {
      if (typeof filters[key] === 'number') return [...acc, key]
      return acc
    }, []))
  }, [filters])

  // Text summaries of non-toggleable filters
  const [thisIs, setThisIs] = useState('')
  const [thisIsNot, setThisIsNot] = useState('') // When looking at an item from cart
  useEffect(() => {
    let isArray = []
    let isNotArray = []

    Object.keys(filters).forEach(key => {
      if (filters[key] === true && activeFilterKeys.includes(key)) {
        isArray.unshift(initialFilters[key].name.toLowerCase())
      }
      else if (filters[key] === true && !activeFilterKeys.includes(key)) {
        isArray.push(initialFilters[key].name.toLowerCase())
      }
      else if (filters[key] === false && activeFilterKeys.includes(key)) {
        isNotArray.push(initialFilters[key].name.toUpperCase())
      }
    })

    if (isArray.length) {
      setThisIs('Item is ' + arrayToCommaList(isArray))
    }
    else {
      setThisIs('')
    }

    if (isNotArray.length) {
      setThisIsNot('ITEM IS NOT' + arrayToCommaList(isNotArray, true))
    }
    else {
      setThisIsNot('')
    }
  }, [filters, activeFilterKeys])

  if (!is_filter_list_approved) {
    return <View style={{ backgroundColor: Colors.red, marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, }}>
      <MediumText>The restaurant has not provided any dietary information for this item</MediumText>
    </View>
  }

  return (
    <View style={{ paddingTop: 12 }}>
      <TouchableOpacity disabled={!selectableFilterKeys.length} onPress={() => setShowFilters(prev => !prev)}>
        <View style={{ backgroundColor: Colors.red, padding: 12, }}>
          <View style={{ paddingBottom: 4 }}>
            {selectableFilterKeys.length ? <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons
                name={showFilters ? 'expand-more' : 'chevron-right'}
                size={20 * PixelRatio.getFontScale()}
                color={Colors.white}
                style={{ marginRight: 6 }}
              />
              <MediumText bold>Dietary options</MediumText>
            </View> : <MediumText bold>No dietary options</MediumText>}
          </View>

          <View style={{ marginLeft: 20 * PixelRatio.getFontScale() + 6, paddingBottom: selectableFilterKeys.length ? 4 : 0 }}>
            {
              selectableFilterKeys.map(filterKey => <ItemFilter
                key={filterKey}
                filterKey={filterKey}
                showFilters={showFilters}
                toggleFilterSelection={toggleFilterSelection}
                price={filters[filterKey]}
              />)
            }
          </View>

          <View>
            {!!thisIs && <DefaultText>{thisIs} </DefaultText>}
            {!!thisIsNot && <DefaultText>{thisIsNot}</DefaultText>}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const ItemFilter = ({ showFilters, filterKey, toggleFilterSelection, price, }) => {
  const isSelected = useIsFilterSelected(filterKey)
  const onToggle = useCallback(() => toggleFilterSelection(filterKey), [filterKey])

  if (!isSelected && !showFilters) return null
  return <ItemOption2
    onToggle={onToggle}
    isSelected={isSelected}
    text={appendPriceToName(initialFilters[filterKey].name, price)}
  />
}


const styles = StyleSheet.create({

});


import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { initialFilters } from '../../redux/selectors/selectorsBillItems';
import { EditLineItemBox } from './EditLineItemBox';

export const EditFilters = ({ itemFilters = [], filters = {}, setFilters }) => {

  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', }}>
    {
      Object.keys(initialFilters).sort((a, b) => a > b).map(filterKey => (
        <EditFilter
          key={filterKey}
          itemFilters={itemFilters}
          isPurple={filters.hasOwnProperty(filterKey)}
          filterKey={filterKey}
          setFilters={setFilters}
          price={itemFilters[filterKey]}
        />
      ))
    }
  </View>
}

const EditFilter = ({ price, isPurple, filterKey, setFilters }) => {
  const onPress = useCallback(() => setFilters(prev => {
    if (prev.hasOwnProperty(filterKey)) {
      const { [filterKey]: discard, ...keep } = prev
      return keep
    }
    return { ...prev, [filterKey]: price }
  }), [price])

  return (
    <EditLineItemBox
      isPurple={isPurple}
      text={initialFilters[filterKey].name}
      onPress={onPress}
      isAlways={price === true}
      isNever={price === false}
    />
  )
}


const styles = StyleSheet.create({

});


import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { DefaultText, ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { useDispatch, useSelector } from 'react-redux';
import useCategoryChild from '../../portal/hooks/useCategoryChild';
import { initialFilters } from '../../redux/selectors/selectorsBillItems';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { selectItemsPassingFilters } from '../../redux/selectors/selectorsItems';
import { doDietaryTableFilterToggle } from '../../redux/actions/actionsApp';
import { selectDietaryFilters } from '../../redux/selectors/selectorsApp';
import centsToDollar from '../../utils/functions/centsToDollar';

const ITEM_NAME_WIDTH = 200
const ROW_HEIGHT = 46

const HIGHLIGHTED = Colors.yellow + '55'

/*
  Horizontal makes more sense to SEE every filter
*/

/*
SEE THIS FOR CLEANER SCROLL
https://stackoverflow.com/questions/37982296/synchronously-scroll-two-components-at-once

if you use this animated, you may be able to achieve an absolute header and avoid splitting names and filters
  which will allow for numberOfLines={2}
*/

export default function DietsScreen({ }) {
  const dispatch = useDispatch()
  const itemIDs = useSelector(selectItemsPassingFilters)
  const [filterWidth, setFilterWidth] = useState(null)
  const activeFitlers = useSelector(selectDietaryFilters)
  const [selectedItem, setSelectedItem] = useState('')
  const verticalNamesRef = useRef(null)
  const verticalSquaresRef = useRef(null)
  const horizontalSquaresRef = useRef(null)
  const horizontalFiltersRef = useRef(null)

  // Probably best to just save this...
  const sortedFilters = useMemo(() => Object.keys(initialFilters).sort((a, b) => a > b), [initialFilters])

  return <SafeView >
    <Header back>
      <ExtraLargeText center>Dietary table</ExtraLargeText>
      {/* Replace text with segment (by menu / by item) and right with edit button */}
    </Header>

    <MediumText bold center >NOTE: this table does not show any item variants</MediumText>

    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 12 }}>
      <View style={{ flexDirection: 'row' }}>
        <MediumText style={{ marginRight: 20 }}>ALWAYS</MediumText>
        <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: Colors.green }} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <MediumText style={{ marginRight: 20 }}>NEVER</MediumText>
        <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: Colors.red }} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <MediumText style={{ marginRight: 20 }}>SPECIAL</MediumText>
        <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: Colors.purple }} />
      </View>
    </View>

    {/* Insert change menu StyledButton or item search bar */}

    <ScrollView scrollEnabled={false} ref={horizontalFiltersRef} horizontal style={{ flexGrow: 0, marginLeft: ITEM_NAME_WIDTH, }}>
      {
        sortedFilters.map(filterKey => <TouchableOpacity key={filterKey} style={{ width: filterWidth, paddingVertical: 12, paddingHorizontal: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: activeFitlers.includes(filterKey) ? HIGHLIGHTED : undefined }} onLayout={({ nativeEvent: { layout: { width } } }) => setFilterWidth(prev => prev > width ? prev : width)} onPress={() => dispatch(doDietaryTableFilterToggle(filterKey))}>
          <DefaultText center>{initialFilters[filterKey].name}</DefaultText>
        </TouchableOpacity>)
      }
    </ScrollView>

    <View style={{ flexDirection: 'row', flex: 1 }}>
      <ScrollView bounces={false} onScroll={({ nativeEvent }) => verticalSquaresRef.current.scrollTo({ y: nativeEvent.contentOffset.y, animated: false })}
        scrollEventThrottle={16}
        ref={verticalNamesRef}
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, width: ITEM_NAME_WIDTH, }}>
        {
          itemIDs.map((item_id, index) => <ItemNames key={item_id} item_id={item_id} isGrey={!(index % 2)} isSelected={selectedItem === item_id} setSelectedItem={setSelectedItem} />)
        }
      </ScrollView>
      <ScrollView bounces={false} ref={horizontalSquaresRef} horizontal
        onScroll={({ nativeEvent }) => horizontalFiltersRef.current.scrollTo({ x: nativeEvent.contentOffset.x, animated: false })}
        scrollEventThrottle={16}
      >
        <ScrollView ref={verticalSquaresRef}
          bounces={false}
          onScroll={({ nativeEvent }) => verticalNamesRef.current.scrollTo({ y: nativeEvent.contentOffset.y, animated: false })}
          scrollEventThrottle={16}
        >
          {
            itemIDs.map((item_id, index) => <ItemFilters key={item_id} item_id={item_id} isSelected={selectedItem === item_id} isGrey={!(index % 2)} width={filterWidth + 4} sortedFilters={sortedFilters} />)
          }
        </ScrollView>
      </ScrollView>
    </View>


    {/* <View style={{ flexDirection: 'row', marginLeft: ITEM_NAME_WIDTH }}>
      {
        sortedFilters.map((filterKey, index) => <TouchableOpacity key={filterKey} style={{ width: filterWidth, paddingHorizontal: 10 }} onLayout={({ nativeEvent: { layout: { width } } }) => setFilterWidth(prev => prev > width ? prev : width)} onPress={() => setActiveFilters(prev => prev.includes(filterKey) ? prev.filter(key => key !== filterKey) : [...prev, filterKey])}>
          <DefaultText numberOfLines={2}>{initialFilters[filterKey].name}</DefaultText>
        </TouchableOpacity>)
      }
    </View>

    <View style={{ flexDirection: 'row' }}>
      <FlatList
        style={{ flexGrow: 0 }}
        keyExtractor={item => item}
        data={itemIDs}
        renderItem={({ item: item_id, index }) => <ItemNames item_id={item_id} isGrey={!(index % 2)} />}
      />
      <FlatList
        keyExtractor={item => item}
        data={itemIDs}
        renderItem={({ item: item_id, index }) => <ItemFilters item_id={item_id} sortedFilters={sortedFilters} activeFilters={activeFilters} isGrey={!(index % 2)} filterWidth={filterWidth} />}
      />
    </View> */}



  </SafeView >
}

const ItemFilters = ({ item_id, isGrey, width, sortedFilters, isSelected }) => {
  const { filters, is_filter_list_approved } = useCategoryChild('items', item_id)

  return <View style={{ flexDirection: 'row', height: ROW_HEIGHT, backgroundColor: isSelected ? HIGHLIGHTED : isGrey ? Colors.darkgrey : Colors.background }}>
    {
      sortedFilters.map((filterKey, index) => <View key={filterKey} style={{ width, justifyContent: 'center', alignItems: 'center' }}>
        <View opacity={is_filter_list_approved ? 1 : 0.3} style={{ minWidth: 20, height: 20, justifyContent: 'center', paddingHorizontal: 4, borderRadius: 4, backgroundColor: filters[filterKey] === false ? Colors.red : filters[filterKey] === true ? Colors.green : Colors.purple }}>
          {!!filters[filterKey] && filters[filterKey] !== true && <DefaultText bold>{centsToDollar(filters[filterKey])}</DefaultText>}
        </View>
        {!is_filter_list_approved && <LargeText style={{ position: 'absolute' }}>?</LargeText>}
      </View>)
    }
  </View>
}

const ItemNames = ({ item_id, isGrey, setSelectedItem, isSelected }) => {
  const { name, internal_name } = useCategoryChild('items', item_id)

  return (
    <TouchableOpacity onPress={() => setSelectedItem(prev => prev === item_id ? '' : item_id)}>
      <View style={{ height: ROW_HEIGHT, justifyContent: 'center', backgroundColor: isSelected ? HIGHLIGHTED : isGrey ? Colors.darkgrey : Colors.background, paddingVertical: 8, paddingLeft: 8 }}>
        <MediumText numberOfLines={1} ellipsizeMode='tail' >{name}</MediumText>
        {!!internal_name && <DefaultText numberOfLines={1} ellipsizeMode='tail'>{internal_name}</DefaultText>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  footerView: {
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: Layout.window.height / 10
  }
});
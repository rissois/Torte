import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
} from 'react-native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { ExtraLargeText } from './NewStyledText';

const ROW_SIZE = 4
const ROW_WIDTH = Layout.window.width - 2 * Layout.marHor

const toKey = (item) => typeof item === 'string' ? item : Object.values(item).join()

export const Pages = ({ ids = [], isCollapsible, selected, child, category, ...other }) => {
  const flatList = useRef(null)
  const pageSize = useMemo(() => selected && isCollapsible ? ROW_SIZE : ROW_SIZE * 2, [selected])
  const pages = useMemo(() => {
    let arr = []
    let page = []
    for (let i = 0; i < ids.length; i++) {
      if (i && !(i % pageSize)) { // start of new page
        arr.push(page)
        page = []
      }
      page.push(ids[i])
      if (i === ids.length - 1) { // last item
        // arr.push([...page, ...Array(pageSize - (i % pageSize) - 1).fill(null)])
        arr.push(page)
      }
    }
    return arr
  }, [pageSize, ids])
  const [pageIndicator, setPageIndicator] = useState(0)
  const onViewableItemsChanged = useCallback(({ viewableItems, }) => {
    if (viewableItems.length) setPageIndicator(viewableItems[0].index)
  }, []);
  const viewabilityConfigCallbackPairs = useRef([{ onViewableItemsChanged },]);

  useEffect(() => {
    if (selected && isCollapsible) {
      const index = pages.findIndex(page => page.includes(selected))
      if (~index) {
        setPageIndicator(index)
        setTimeout(() => flatList?.current?.scrollToIndex({ index, animated: false }), 5)
      }
    }
  }, [selected, pages])

  return <View style={{ borderColor: Colors.white, borderBottomWidth: 1 }}>
    <FlatList
      horizontal
      ref={flatList}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      bounces={false}
      keyExtractor={item => toKey(item[0])}
      getItemLayout={(data, index) => (
        { length: ROW_WIDTH, offset: ROW_WIDTH * index, index }
      )}
      data={pages}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      ListEmptyComponent={() => <View style={{ marginVertical: 30, width: Layout.window.width - 2 * Layout.marHor }}><ExtraLargeText center>No {category}</ExtraLargeText></View>}
      renderItem={({ item: ids }) => <Page ids={ids} selected={selected} child={child} category={category} {...other} />}
    />
    {!!pages.length && <View style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'center' }}>
      {
        pages.map((e, i) => <View key={i} style={{ marginHorizontal: 8, width: 30, height: 6, borderRadius: 6, backgroundColor: i === pageIndicator ? Colors.purple : Colors.darkgrey }} />)
      }
    </View>}
  </View>
}


const Page = ({ ids, selected, child, category, ...other }) => {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: ROW_WIDTH }}>
    {
      ids.map((id, index) => React.cloneElement(child, {
        key: toKey(id),
        selected,
        id,
        index,
        ...category === 'modifiers' && { modifier: other.modifiers[id] },
        ...category === 'mods' && { ...other }, // pass through
        // is it better to just handle these through the child's useMemo?
      })
      )
    }
  </View>
}




const styles = StyleSheet.create({

});

/*
const AllItemVariants = () => {
  const itemVariants = useSelector(selectAlphaveticalItemVariants)

  return <FlatList
    keyExtractor={item => item.item_id + item.variant_id}
    data={itemVariants}
    renderItem={({ item: { item_id, variant_id } }) => <Render id={item_id} variant_id={variant_id} category='items' />}
    numColumns={4}
    contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot }}
  />
}
*/
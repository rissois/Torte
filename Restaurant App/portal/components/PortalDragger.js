import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { LargeText } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import { PortalRowDraggable } from './PortalRow';
import singularize from '../../utils/functions/singularize';

const widthOfRowIndicatorToRightEnd = Layout.window.width - (3 * Layout.marHor)

const extractors = {
  sections: item => item,
  items: item => item.item_id + item.variant_id,
  modifiers: item => item,
  mods: item => item.item_id + item.option_id + item.variant_id,
  upsells: item => item.item_id + item.option_id + item.variant_id,
  photos: item => item.item_id + item.variant_id,
  meals: item => item
}

const mapToProps = (category, item, setChildIDs) => {
  switch (category) {
    case 'meals':
    case 'sections':
    case 'modifiers': {
      return {
        id: item,
        variant: null,
        category,
        remove: () => setChildIDs(prev => prev.filter(p => p !== item))
      }
    }
    case 'items': {
      return {
        id: item.item_id,
        variant_id: item.variant_id,
        category,
        remove: () => setChildIDs(prev => prev.filter(p => p.item_id !== item?.item_id || p.variant_id !== item?.variant_id))
      }
    }
    case 'mods':
    case 'upsells': {
      return {
        id: item.item_id || item.option_id,
        variant_id: item.variant_id,
        category: item.item_id ? 'items' : 'options',
        remove: () => setChildIDs(prev => prev.filter(p => p.item_id !== item?.item_id || p.option_id !== item?.option_id || p.variant_id !== item?.variant_id))
      }
    }
    case 'photos': {
      return {
        id: item.item_id,
        variant: item.variant_id,
        category: 'items',
        remove: () => setChildIDs(prev => prev.filter(p => p.item_id !== item?.item_id || p.variant_id !== item?.variant_id))
      }
    }

  }
}

export default function PortalDragger({ category, child_ids, setChildIDs, max, isAltered }) {
  const [dragIndicatorWidth, setDragIndicatorWidth] = useState(null)
  const [remeasure, setRemeasure] = useState((Date.now()).toString())

  useEffect(() => {
    setRemeasure((Date.now()).toString())
  }, [child_ids])

  const renderItem = useCallback(({ item, index, drag, isActive }) => {
    return <PortalRowDraggable
      isMuted={max && index >= max && !isActive}
      {...mapToProps(category, item, setChildIDs)}
      drag={drag}
      isActive={isActive}
      setDragIndicatorWidth={setDragIndicatorWidth}
      isPhoto={category === 'photos'}
      isAltered={isAltered}
    />
  }, [max, isAltered])


  return <DraggableFlatList
    data={child_ids}
    keyExtractor={extractors[category]}
    renderItem={renderItem}
    // Do you want to test if actually changed?
    onDragEnd={({ data }) => setChildIDs(data)}
    {...max && { extraData: child_ids }} // Updates renderItem index for isMuted
    layoutInvalidationKey={remeasure} // Ensures onDrag position starts at new location when child_ids altered externally (e.g. reset)
    dragHitSlop={{ top: 0, bottom: 0, left: -Layout.marHor, right: -(widthOfRowIndicatorToRightEnd - dragIndicatorWidth) }}
    ListEmptyComponent={() => <View style={{ marginVertical: 30 }}><LargeText center>NO {singularize(category).toUpperCase()}(S)</LargeText></View>}
  />
}

/*
  renderPlaceholder: Component to be rendered underneath the hovering component
  onDragBegin: Called when row becomes active.
  onRelease: Called when active row touch ends.
  onDragEnd: Called after animation has completed. Returns updated ordering of data
  autoscrollThreshold: 	Distance from edge of container where list begins to autoscroll when dragging.
  autoscrollSpeed: 	Determines how fast the list autoscrolls.
  onRef:	Returns underlying Animated FlatList ref.
  animationConfig:	Configure list animations. See reanimated spring config
  activationDistance:	Distance a finger must travel before the gesture handler activates. Useful when using a draggable list within a TabNavigator so that the list does not capture navigator gestures.
  layoutInvalidationKey:	Changing this value forces a remeasure of all item layouts. Useful if item size/ordering updates after initial mount.
  onScrollOffsetChange:	Called with scroll offset. Stand-in for onScroll.
  onPlaceholderIndexChange:	Called when the index of the placeholder changes
  dragItemOverflow:	If true, dragged item follows finger beyond list boundary.
  dragHitSlop:	Enables control over what part of the connected view area can be used to begin recognizing the gesture. Numbers need to be non-positive (only possible to reduce responsive area).
  containerStyle:	Style of the main component.
  simultaneousHandlers:	References to other gesture handlers, mainly useful when using this component within a ScrollView. See Cross handler interactions.
*/

const styles = StyleSheet.create({

});


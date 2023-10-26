import React, { } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { usePanel } from '../../utils/hooks/usePanel';
import { PanelPhoto } from './Photo';

// https://react-redux.js.org/api/hooks#useselector-examples

export default function MenuPanel(parent_ids) {
  const { panel_id } = parent_ids

  const { bottom_order, is_visible, top_order, is_large_on_left, large_order } = usePanel(panel_id)

  if (!is_visible) return null

  return (
    <View style={{ flexDirection: 'row', }}>
      {
        is_large_on_left && large_order.map(photo => <PanelPhoto key={photo.item_id + photo.variant_id} {...photo} height={2} {...parent_ids} />)
      }
      <View>
        <View style={{ flexDirection: 'row', }}>
          {
            top_order.map(photo => <PanelPhoto key={photo.item_id + photo.variant_id} {...photo} height={1} {...parent_ids} />)
          }
        </View>
        <View style={{ flexDirection: 'row', }}>
          {
            bottom_order.map(photo => <PanelPhoto key={photo.item_id + photo.variant_id} {...photo} height={1} {...parent_ids} />)
          }
        </View>
      </View>
      {
        !is_large_on_left && large_order.map(photo => <PanelPhoto key={photo.item_id + photo.variant_id} {...photo} height={2} {...parent_ids} />)
      }
    </View>
  )
}

const styles = StyleSheet.create({

});


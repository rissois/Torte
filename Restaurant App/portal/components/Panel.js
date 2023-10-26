import React, { useState, useMemo, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import useCategoryChild from '../hooks/useCategoryChild';
import { PortalPanelPhoto } from './PortalPhoto';

export const PanelByID = ({ panel_id }) => {
  const { large_order, top_order, bottom_order, is_large_on_left, } = useCategoryChild('panels', panel_id)

  if (!panel_id) return null

  return <Panel large_order={large_order} top_order={top_order} bottom_order={bottom_order} is_large_on_left={is_large_on_left} />
}

export default function Panel({ large_order, top_order, bottom_order, is_large_on_left, }) {
  const isLargeOnly = large_order[0]?.width === 3
  const [photoSize, setPhotoSize] = useState(null)

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', }} onLayout={({ nativeEvent }) => setPhotoSize(nativeEvent.layout.width / 3)}>
      {
        is_large_on_left && large_order.map(photo => <PortalPanelPhoto key={photo.item_id + photo.variant_id} {...photo} height={photoSize * 2} width={photoSize * photo.width} />)
      }
      {!isLargeOnly && <View style={{ flexDirection: large_order.length ? 'column' : 'row', flexWrap: 'wrap' }}>
        {
          top_order.map((photo, index) => <PortalPanelPhoto key={photo.item_id + photo.variant_id || 'blank ' + index} {...photo} height={photoSize} width={photoSize * photo.width} />)
        }
        {
          bottom_order.map((photo, index) => <PortalPanelPhoto key={photo.item_id + photo.variant_id || 'blank ' + index} {...photo} height={photoSize} width={photoSize * photo.width} />)
        }
      </View>}
      {
        !is_large_on_left && large_order.map(photo => <PortalPanelPhoto key={photo.item_id + photo.variant_id} {...photo} height={photoSize * 2} width={photoSize * photo.width} />)
      }
    </View>
  )
}


const styles = StyleSheet.create({
});


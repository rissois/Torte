import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, } from 'react-redux';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import Layout from '../../utils/constants/Layout';
import { usePhoto, usePhotoFromItem } from '../../utils/hooks/usePhoto';
import { doTrackersSet } from '../../redux/actions/actionsTrackers';
import { useIsItemVariantPassingFilters, } from '../../utils/hooks/useItems';
import Colors from '../../utils/constants/Colors';

const PANEL_PHOTO_WIDTH = Layout.window.width / 3
const ITEM_PHOTO_WIDTH = Layout.window.width * 0.7

export function PanelPhoto({ section_id, item_id, variant_id, panel_id, width, height }) {
  const dispatch = useDispatch()

  const photo = usePhotoFromItem(item_id, variant_id)
  const isPhotoPassingFilters = useIsItemVariantPassingFilters(item_id, variant_id)

  const onPress = useCallback(() => {
    dispatch(doTrackersSet({
      section_id,
      item_id,
      variant_id,
      panel_id
    }))
  }, [item_id, variant_id, section_id, panel_id])

  if (!photo) return null

  return <TouchableOpacity disabled={!isPhotoPassingFilters} onPress={onPress}>
    <View>
      <Photo uri={photo.uri} height={PANEL_PHOTO_WIDTH * height} width={PANEL_PHOTO_WIDTH * width} />
      {!isPhotoPassingFilters ? <View style={styles.failsFilters} /> : photo.isFetching && !photo.uri && <IndicatorOverlay opacity={'00'} />}
    </View>
  </TouchableOpacity>
}

export function ItemPhoto({ photo_id, isContain }) {
  const photo = usePhoto(photo_id)

  if (!photo) return null

  return <View style={{ alignSelf: 'center' }}>
    <Photo uri={photo.uri} height={ITEM_PHOTO_WIDTH} width={ITEM_PHOTO_WIDTH} isContain={isContain} />
    {photo.isFetching && !photo.uri && <IndicatorOverlay opacity={'00'} />}
  </View>
}

function Photo({ uri = '', height, width, isContain }) {
  return (
    <Image
      style={{ height, width }}
      source={{ uri: uri || null }}
      resizeMode={isContain ? 'contain' : 'cover'}
    />
  )
}

const styles = StyleSheet.create({
  failsFilters: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background + 'DA',
  }
});


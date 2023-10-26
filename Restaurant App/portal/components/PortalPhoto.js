import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { LargeText } from '../../utils/components/NewStyledText';
import useCategoryChild from '../hooks/useCategoryChild';
import Colors from '../../utils/constants/Colors';


export function PortalPanelPhoto({ item_id, variant_id, height, width, isContained }) {
  const { photo } = useCategoryChild('items', item_id)

  if (!photo?.id) return <View style={{ height, width, backgroundColor: Colors.red, justifyContent: 'center' }}>
    <LargeText center bold>MISSING</LargeText>
    <LargeText center bold>PHOTO</LargeText>
  </View>

  return <PortalPhoto photo_id={photo.id} height={height} width={width} />
}

export function PortalPhoto({ photo_id, uri: localPhotoURI, height, width, isContained }) {
  const { uri, isFetching } = useCategoryChild('photos', photo_id)

  if (!uri && !localPhotoURI) return null

  return (
    <View style={{ alignSelf: 'center' }}>
      <Image
        style={{ height, width }}
        source={{ uri: localPhotoURI || uri }}
        resizeMode={isContained ? 'contain' : 'cover'}
      />
      {isFetching && !(localPhotoURI || uri) && <IndicatorOverlay opacity={'00'} />}
    </View>
  )
}

const styles = StyleSheet.create({

});


import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, } from 'react-redux';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import Layout from '../../utils/constants/Layout';
import { usePhotoIDFromItem } from '../../utils/hooks/usePhoto';
import { doTrackersSet } from '../../redux/actions/actionsTrackers';
import { useIsItemVariantPassingFilters, } from '../../utils/hooks/useItems';
import Colors from '../../utils/constants/Colors';
import { getStorage, getDownloadURL, ref } from 'firebase/storage'
import { useRestaurantID } from '../../utils/hooks/useBill';
import firebaseApp from '../../firebase/firebase';

const storage = getStorage(firebaseApp)

const PANEL_PHOTO_WIDTH = Layout.window.width / 3
const ITEM_PHOTO_WIDTH = Layout.window.width * 0.7

const downloadURL = async (restaurant_id, photo_id) => {
  const storagePhotoPath = `restaurants/${restaurant_id}/${photo_id}`
  const storagePhotoRef = ref(storage, storagePhotoPath)
  return await getDownloadURL(storagePhotoRef)
}

export function PanelPhoto({ section_id, item_id, variant_id, panel_id, width, height }) {
  const dispatch = useDispatch()

  const photo_id = usePhotoIDFromItem(item_id, variant_id)
  const restaurant_id = useRestaurantID()
  const [isFetching, setIsFetching] = useState(true)
  const [uri, setURI] = useState('')

  const getURI = useCallback(async (photo_id) => {
    setIsFetching(true)
    try {
      const hold = await downloadURL(restaurant_id, photo_id)
      setURI(hold)
    }
    catch (error) {
      console.log('PanelPhoto ERROR: ', error)
      setURI('')
    }
    finally {
      setIsFetching(false)
    }
  }, [restaurant_id])

  useEffect(() => {
    getURI(photo_id)
  }, [photo_id])

  const isPhotoPassingFilters = useIsItemVariantPassingFilters(item_id, variant_id)

  const onPress = useCallback(() => {
    dispatch(doTrackersSet({
      section_id,
      item_id,
      variant_id,
      panel_id
    }))
  }, [item_id, variant_id, section_id, panel_id])

  if (!uri && !isFetching) return null

  return <TouchableOpacity disabled={!isPhotoPassingFilters} onPress={onPress}>
    <View>
      <Photo uri={uri} height={PANEL_PHOTO_WIDTH * height} width={PANEL_PHOTO_WIDTH * width} />
      {!isPhotoPassingFilters ? <View style={styles.failsFilters} /> : isFetching && !uri && <IndicatorOverlay opacity={'00'} />}
    </View>
  </TouchableOpacity>
}

export function ItemPhoto({ photo_id, isContain }) {
  const restaurant_id = useRestaurantID()
  const [isFetching, setIsFetching] = useState(true)
  const [uri, setURI] = useState('')

  const getURI = useCallback(async (photo_id) => {
    setIsFetching(true)
    try {
      const hold = await downloadURL(restaurant_id, photo_id)
      setURI(hold)
    }
    catch (error) {
      console.log('ITEMPHOTO ERROR: ', error)
      setURI('')
    }
    finally {
      setIsFetching(false)
    }
  }, [restaurant_id])

  useEffect(() => {
    getURI(photo_id)
  }, [photo_id])

  if (!uri && !isFetching) return null

  return <View style={{ alignSelf: 'center' }}>
    <Photo uri={uri} height={ITEM_PHOTO_WIDTH} width={ITEM_PHOTO_WIDTH} isContain={isContain} />
    {isFetching && !uri && <IndicatorOverlay opacity={'00'} />}
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


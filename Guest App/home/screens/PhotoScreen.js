import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { LargeText, } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import Header from '../../utils/components/Header';
import SafeView from '../../utils/components/SafeView';
import { getStorage, getDownloadURL, ref } from 'firebase/storage'
import firebaseApp from '../../firebase/firebase';
import { useDispatch, useSelector } from 'react-redux';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { selectReceiptCreator, selectReceiptID } from '../../redux/selectors/selectorsReceipt';
import { doReceiptSetURI } from '../../redux/actions/actionsReceipt.web';

const storage = getStorage(firebaseApp)

export default function PhotoScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const user_id = useSelector(selectReceiptCreator)
  const receipt_id = useSelector(selectReceiptID)
  const reduxURI = useSelector(state => state.receipt.uri)
  const [uri, setURI] = useState(reduxURI)

  const [isFetching, setIsFetching] = useState(!reduxURI)

  useEffect(() => {
    const getURI = async () => {
      setIsFetching(true)
      try {
        console.log(`user_id ${user_id}`)
        console.log(`receipt_id ${receipt_id}`)
        const storagePhotoPath = `receipts/${user_id}/${receipt_id}`
        const storagePhotoRef = ref(storage, storagePhotoPath)
        const response = await getDownloadURL(storagePhotoRef)
        dispatch(doReceiptSetURI(response))
        setURI(response)
      }
      catch (error) {
        if (reduxURI) dispatch(doReceiptSetURI(''))
        console.log('PhotoScreen getURI error: ', error)
      }
      finally {
        setIsFetching(false)
      }
    }

    if (!uri) getURI()
  }, [])

  if (isFetching) return <SafeView>
    <Header back />
    <View style={{ flex: 1 }}>
      <IndicatorOverlay text='Fetching image...' />
    </View>
  </SafeView>

  if (!uri) return <SafeView>
    <Header back />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <LargeText center>Unable to get image</LargeText>
    </View>
  </SafeView>

  return <SafeView>
    <Image
      style={{ height: Layout.window.height, width: Layout.window.width }}
      resizeMode='contain'
      source={{ uri }}
    />

    <View style={StyleSheet.absoluteFill}>
      <Header back />
    </View>
  </SafeView>
}
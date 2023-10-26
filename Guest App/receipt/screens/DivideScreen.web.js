import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  Modal,
  Text,
  FlatList,
} from 'react-native';
import Header from '../../utils/components/Header';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { useSelector } from 'react-redux';
import ReceiptItemPan from '../components/ReceiptItemPan';
import ReceiptItem from '../components/ReceiptItem';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { selectReceiptItemIDs } from '../../redux/selectors/selectorsReceiptItems';
import { selectMyClaimSubtotal } from '../../redux/selectors/selectorsReceiptUsers';
import centsToDollar from '../../utils/functions/centsToDollar';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import ReceiptHeader from '../components/ReceiptHeader';


if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export default function DivideScreen({ navigation, route }) {
  const closeModal = useCallback(() => setSelectedReceiptItem(''), [])
  useModalCloser('Divide', closeModal)
  const tabBarHeight = useBottomTabBarHeight()

  const myClaimedSubtotal = useSelector(selectMyClaimSubtotal)

  const receiptItemIDs = useSelector(selectReceiptItemIDs)
  const [selectedReceiptItem, setSelectedReceiptItem] = useState('')

  const [savingIDs, setSavingIDs] = useState([])

  useEffect(() => {
    if (route?.params?.isFirst) navigation.navigate('QR')
  }, [])

  return (
    <SafeView unsafeColor={Colors.background}>
      <Modal
        visible={!!selectedReceiptItem}
        animationType='slide'
      >
        <ReceiptItem {...{ setSavingIDs }} receipt_item_id={selectedReceiptItem} clear={closeModal} />
      </Modal>

      <ReceiptHeader qr />

      {/* 
      Splitting as can be a dropdown list here 
        User name (you)
        Dummy 1
        Dummy 2
      */}

      <FlatList
        data={receiptItemIDs}
        style={[Platform.OS === 'web' && { height: Layout.window.height }, { paddingHorizontal: 20, }]}
        contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot }}
        indicatorStyle='white'
        keyExtractor={item => item}
        ListHeaderComponent={() => (
          <View style={{ borderColor: Colors.green, borderWidth: StyleSheet.hairlineWidth, padding: 8, alignSelf: 'center' }}>
            <MediumText bold center>Tap to split. <Text style={{ color: Colors.green }}>Try swiping!</Text></MediumText>
          </View>
        )}
        renderItem={({ item: receipt_item_id }) => (
          <ReceiptItemPan {...{ receipt_item_id, setSavingIDs }} isSaving={savingIDs.includes(receipt_item_id)} onTap={() => setSelectedReceiptItem(receipt_item_id)} />
        )}
      />

      <View style={{ marginBottom: tabBarHeight, marginTop: 20, marginHorizontal: 20, padding: 20, borderTopColor: Colors.white, borderTopWidth: 1 }}>
        <LargeText bold center>Subtotal: {centsToDollar(myClaimedSubtotal)}</LargeText>
      </View>
    </SafeView>
  )
}



const styles = StyleSheet.create({

});
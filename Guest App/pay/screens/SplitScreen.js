import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  Modal,
  SectionList,
  Text,
} from 'react-native';
import Header from '../../utils/components/Header';
import { ExtraLargeText, LargeText, MediumText, SerifText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { useDispatch, useSelector } from 'react-redux';

import ClaimAll from '../components/ClaimAll';

import BottomButton from '../../utils/components/BottomButton';
import { selectBillItemsByUser } from '../../redux/selectors/selectorsBillItems';
import BillItemPan from '../components/BillItemPan';
import BillItem from '../components/BillItem';
import centsToDollar from '../../utils/functions/centsToDollar';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { selectMyClaimNumber, selectMyClaimSubtotal } from '../../redux/selectors/selectorsBillUsers';
import { useBillCode, useTableName } from '../../utils/hooks/useBill';


if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export default function SplitScreen({ navigation, route }) {
  const tableName = useTableName()
  const billCode = useBillCode()
  const closeModal = useCallback(() => setSelectedBillItem(''), [])
  useModalCloser('Split', closeModal)

  const userItems = useSelector(selectBillItemsByUser)
  const myClaimNumber = useSelector(selectMyClaimNumber)
  const [selectedBillItem, setSelectedBillItem] = useState('')
  const userSubtotal = useSelector(selectMyClaimSubtotal)

  return (
    <SafeView unsafeColor={Colors.background}>
      <Modal
        visible={!!selectedBillItem}
        animationType='slide'
      >
        <BillItem bill_item_id={selectedBillItem} clear={closeModal} />
      </Modal>

      <Header back>
        <LargeText center>{tableName} - #{billCode}</LargeText>
      </Header>

      <SectionList
        sections={userItems}
        style={[Platform.OS === 'web' && { height: Layout.window.height }, { paddingHorizontal: 20, }]}
        keyExtractor={bill_item_id => bill_item_id}
        ListHeaderComponent={() => (
          <View style={{ borderColor: Colors.green, borderWidth: StyleSheet.hairlineWidth, padding: 8, alignSelf: 'center' }}>
            <MediumText bold center>Tap to split. <Text style={{ color: Colors.green }}>Try swiping!</Text></MediumText>
          </View>
        )}
        renderSectionHeader={({ section: { name, data, isClaimAllAvailable, isClaimAllDisabled } }) => {
          return <View style={{ flexDirection: 'row', backgroundColor: Colors.background, alignItems: 'center', paddingTop: 10, marginBottom: 6, paddingBottom: 6, borderBottomColor: Colors.white, borderBottomWidth: 1 }}>
            <LargeText bold style={{ flex: 1 }}>{name} items</LargeText>
            <ClaimAll bill_item_ids={data} isClaimAllDisabled={isClaimAllDisabled} isClaimAllAvailable={isClaimAllAvailable} />
          </View>
        }}
        renderSectionFooter={() => <View style={{ height: 20 }} />}
        renderItem={({ item: bill_item_id }) => (
          <BillItemPan bill_item_id={bill_item_id} onTap={() => setSelectedBillItem(bill_item_id)} />
        )}
        ListFooterComponent={() => <View style={{ height: Layout.scrollViewPadBot }} />}
        indicatorStyle='white'
      />

      <BottomButton
        disabled={!myClaimNumber}
        backgroundColor={myClaimNumber ? Colors.purple : Colors.darkgrey}
        text={myClaimNumber ? `Pay ${centsToDollar(userSubtotal)}` : 'Select items'}
        onPress={() => navigation.navigate('Pay')}
      />
    </SafeView>
  )
}



const styles = StyleSheet.create({

});
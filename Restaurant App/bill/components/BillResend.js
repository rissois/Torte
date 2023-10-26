import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { DefaultText, ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { FlatList } from 'react-native-gesture-handler';
import centsToDollar from '../../utils/functions/centsToDollar';
import Layout from '../../utils/constants/Layout';
import { useDispatch, } from 'react-redux';
import StyledButton from '../../utils/components/StyledButton';
import { useBillItem, useBillItemIDsReprint, } from '../../utils/hooks/useBillItem';
import { MaterialCommunityIcons, } from '@expo/vector-icons';
import { doPrintKitchen } from '../../redux/actions/actionsPrint';



// NOTE: does not show voided
export default function BillResend({ bill_id, setShowReprint, }) {
  const dispatch = useDispatch()

  const billItemIDs = useBillItemIDsReprint(bill_id)
  const [selectedIDs, setSelectedIDs] = useState([])

  useEffect(() => {
    setSelectedIDs(prev => prev.some(bill_item_id => !billItemIDs.includes(bill_item_id)) ? prev.filter(bill_item_id => billItemIDs.includes(bill_item_id)) : prev)
  }, [billItemIDs])

  return <View style={{ flex: 1 }}>
    <View style={{ paddingBottom: 8, marginBottom: 8, borderBottomColor: Colors.lightgrey, borderBottomWidth: 1, marginHorizontal: Layout.marHor }}>
      <ExtraLargeText center>(RE)SEND ITEMS</ExtraLargeText>
      <MediumText center>(items highlight in grey have never been sent)</MediumText>
    </View>

    <FlatList
      contentContainerStyle={{ marginHorizontal: Layout.marHor, paddingBottom: Layout.scrollViewPadBot }}
      data={billItemIDs}
      keyExtractor={item => item}
      renderItem={({ item: bill_item_id }) => {
        return <BillItem bill_id={bill_id} bill_item_id={bill_item_id} isSelected={selectedIDs.includes(bill_item_id)} setSelectedIDs={setSelectedIDs} />
      }}
    />
    <View style={{ flexDirection: 'row', marginHorizontal: 40, paddingVertical: 20 }}>
      <StyledButton color={selectedIDs.length === billItemIDs.length ? Colors.red : Colors.purple} text={selectedIDs.length === billItemIDs.length ? 'Unselect all' : 'Select all'} onPress={() => setSelectedIDs(prev => billItemIDs.length === prev.length ? [] : billItemIDs)} />
      <View style={{ width: 40 }} />
      <StyledButton style={{ flex: 1 }} color={Colors.darkgreen} disabled={!selectedIDs.length} text={'PRINT SELECTED'} onPress={() => {
        dispatch(doPrintKitchen(selectedIDs, bill_id, true))
        setShowReprint(false)
      }} />
    </View>

  </View>

}

function BillItem({ bill_id, bill_item_id, isSelected, setSelectedIDs }) {
  const {
    name,
    captions: { one_line } = {},
    summary: { subtotal } = {},
    timestamps: { marked, printed }
  } = useBillItem(bill_id, bill_item_id)


  return <TouchableOpacity style={{ marginVertical: 4 }} onPress={() => setSelectedIDs(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : [...prev, bill_item_id])}>
    <View style={{ backgroundColor: (marked || printed) ? Colors.background : Colors.darkgrey, paddingHorizontal: 20, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', }}>
        <View style={{ justifyContent: 'center' }}>
          <MaterialCommunityIcons
            name={'checkbox-marked-circle-outline'}
            size={40}
            color={isSelected ? Colors.green : Colors.darkgrey + '55'}
            style={{ paddingRight: 30 }}
          />
        </View>
        <View style={styles.fullText}>
          <LargeText>{name}</LargeText>
          <DefaultText style={{ paddingTop: 4 }}>{one_line}</DefaultText>
        </View>
        <LargeText>{centsToDollar(subtotal)}</LargeText>
      </View>


    </View>
  </TouchableOpacity>
  {/* <RowSelectable
    name={name}
    internal_name={'printer'}
    isSelected={isSelected}
    setSelected={() => setSelectedIDs(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : [...prev, bill_item_id])}
  /> */}
}



const styles = StyleSheet.create({
  fullText: {
    flex: 1,
    marginRight: 30,
  },
  textPadding: {
    paddingTop: 6,
  },
  altered: {
    fontWeight: 'bold',
  },
  unaltered: {
    color: Colors.midgrey,
  },
  strikeThrough: {
    textDecorationLine: 'line-through'
  },
});


import React, { useState, useEffect, useRef, useMemo, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Header from '../../utils/components/Header';
import { ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import ReceiptHeader from '../components/ReceiptHeader';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Colors from '../../utils/constants/Colors';
import { selectReceiptGratuity, selectReceiptSubtotal, selectReceiptTax, selectReceiptUserNames } from '../../redux/selectors/selectorsReceipt';
import { selectReceiptSummaries } from '../../redux/selectors/selectorsReceiptItems';
import { useMyID } from '../../utils/hooks/useUser.web';
import { firstAndL } from '../../utils/functions/names';
import centsToDollar from '../../utils/functions/centsToDollar';
import Layout from '../../utils/constants/Layout';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const viewabilityConfig = { viewAreaCoveragePercentThreshold: 70, minimumViewTime: 100 }

export default function ReceiptsScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight()
  const myID = useMyID()

  const [selectedUser, setSelectedUser] = useState(myID)

  const userNames = useSelector(selectReceiptUserNames, shallowEqual)
  const receiptSummaries = useSelector(selectReceiptSummaries)
  const tableSubtotal = useSelector(selectReceiptSubtotal)
  const tableTax = useSelector(selectReceiptTax)
  const tableGratuity = useSelector(selectReceiptGratuity)
  const [priceWidth, setPriceWidth] = useState(null)
  const [quantityWidth, setQuantityWidth] = useState(null)
  const summaryRef = useRef(null)
  const userRef = useRef(null)

  const [tipPercentage, setTipPercentage] = useState(tableGratuity ? 5 : 20)

  const userIDs = useMemo(() => ['table', ...Object.keys(userNames).sort((a, b) => {
    if (a === myID) return -1
    if (b === myID) return 1
    return a - b
  })], [userNames])

  useEffect(() => {
    if (selectedUser) {
      const index = userRef?.current?.props?.data.findIndex(id => id === selectedUser)
      if (~index && userRef?.current?.props?.data?.length) {
        userRef.current.scrollToIndex({ index, viewPosition: 0.5, })
      }
    }
  }, [selectedUser])

  const scrollSummary = useCallback(({ viewableItems, }) => {
    const user_id = viewableItems[0]?.item
    if (user_id) {
      setSelectedUser(user_id)
    }
  }, []);
  const viewabilityConfigCallbackPairs = useRef([{ onViewableItemsChanged: scrollSummary, viewabilityConfig },]);

  // useFocusEffect(useCallback(() => {
  //   setSelectedUser(myID)
  // }, []))

  return (
    <SafeView>
      <ReceiptHeader qr />

      {/* User scroll */}
      <View style={{ paddingVertical: 10 }}>
        <FlatList
          ref={userRef}
          contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1, justifyContent: 'center' }}
          horizontal
          data={userIDs}
          onScrollToIndexFailed={(info) => {
            /* handle error here /*/
          }}
          keyExtractor={user_id => user_id}
          renderItem={({ item: user_id }) => {
            const name = user_id === 'table' ? 'Table' : user_id === myID ? 'You' : firstAndL(userNames[user_id])
            return <TouchableOpacity key={user_id} onPress={() => {
              setSelectedUser(user_id)
              const index = summaryRef?.current?.props?.data.findIndex(id => id === user_id)
              if (~index) {
                summaryRef.current.scrollToIndex({ index, })
              }
            }}>
              <View style={{ paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 10, borderRadius: 50, backgroundColor: selectedUser === user_id ? Colors.darkgreen : undefined }}>
                <MediumText>{name}</MediumText>
              </View>
            </TouchableOpacity>
          }}
        />
      </View>

      {/* User groups */}
      <FlatList
        ref={summaryRef}
        style={{ flex: 1 }}
        data={userIDs}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={Layout.window.width}
        onScrollToIndexFailed={(info) => {
          /* handle error here /*/
        }}
        keyExtractor={user_id => user_id}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        renderItem={({ item: user_id }) => {
          const subtotal = receiptSummaries[user_id]?.subtotal
          const tip = Math.round(subtotal * tipPercentage / 100)
          const tax = user_id === 'table' ? tableTax : Math.round(subtotal * tableTax / tableSubtotal)
          const isTaxInexact = tableTax && user_id !== 'table' && subtotal * tableTax % tableSubtotal
          const gratuity = user_id === 'table' ? tableGratuity : Math.round(subtotal * tableGratuity / tableSubtotal)
          const isGratuityInexact = tableGratuity && user_id !== 'table' && subtotal * tableGratuity % tableSubtotal

          return <View style={{ flex: 1, width: Layout.window.width }}>
            <FlatList
              data={receiptSummaries[user_id]?.items || []}
              keyExtractor={item => item?.name + item?.caption}
              contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.1 }}
              indicatorStyle='white'
              ListEmptyComponent={() => <MediumText center style={{ marginTop: 20 }}>(no items selected)</MediumText>}
              renderItem={({ item }) => {
                return <View style={{ marginVertical: 6, }}>
                  <View style={{ flexDirection: 'row', }}>
                    <View style={{ minWidth: quantityWidth, }} onLayout={({ nativeEvent }) => setQuantityWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
                      <MediumText center>{item.denom === 1 ? item.num : `${item.num}/${item.denom}`}</MediumText>
                    </View>
                    <MediumText style={{ flex: 1, marginHorizontal: 10 }}>{item.name}</MediumText>
                    <View style={{ minWidth: priceWidth, alignItems: 'flex-end' }} onLayout={({ nativeEvent }) => setPriceWidth(prev => Math.max(prev, nativeEvent.layout.width))}>
                      <MediumText>{centsToDollar(item.subtotal)}</MediumText>
                    </View>
                  </View>
                  <MediumText style={{ marginLeft: quantityWidth + 10, marginRight: priceWidth + 10 }}>{item.caption}</MediumText>
                </View>
              }}
            />
            <View style={{ margin: 20, marginBottom: tabBarHeight, padding: 10, borderTopColor: Colors.white, borderTopWidth: 1 }}>
              <SummaryLine text="Subtotal" value={subtotal} />
              <SummaryLine text="Tax" value={tax} inexact={isTaxInexact} />
              <SummaryLine text="Total" value={subtotal + tax} inexact={isTaxInexact} />
              {!!tableGratuity && <SummaryLine text="Auto grat." value={gratuity} inexact={isGratuityInexact} />}
              {user_id === myID ? <View>
                <SummaryLine text={tableGratuity ? "Add'l tip" : "Tip"} value={tip} />
                <View style={{ flexDirection: 'row', marginVertical: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <TouchableOpacity style={{ paddingHorizontal: 20 }} disabled={!tipPercentage} onPress={() => setTipPercentage(prev => prev > 0 ? prev - 1 : prev)}>
                    <MaterialIcons name='remove-circle-outline' size={30} color={tipPercentage > 0 ? Colors.white : Colors.darkgrey} />
                  </TouchableOpacity>
                  <View style={{ minWidth: 66 }}>
                    <ExtraLargeText>{tipPercentage}%</ExtraLargeText>
                  </View>
                  <TouchableOpacity style={{ paddingHorizontal: 20 }} disabled={tipPercentage >= 100} onPress={() => setTipPercentage(prev => prev < 100 ? prev + 1 : prev)}>
                    <MaterialIcons name='add-circle-outline' size={30} color={tipPercentage < 100 ? Colors.white : Colors.darkgrey} />
                  </TouchableOpacity>
                </View>
                <SummaryLine text="Final" value={subtotal + tax + gratuity + tip} inexact={isTaxInexact || isGratuityInexact} />
              </View> :
                !!tableGratuity && <SummaryLine text="Final" value={subtotal + tax + gratuity} inexact={isTaxInexact || isGratuityInexact} />
              }
            </View>
          </View>
        }}
      />
    </SafeView>
  )
}

const SummaryLine = ({ text, value, inexact }) => {
  return <View style={{ flexDirection: 'row', marginVertical: 4 }}>
    <MediumText bold style={{ flex: 1 }}>{text}</MediumText>
    <MediumText bold>{centsToDollar(value)}</MediumText>
  </View>
}

const styles = StyleSheet.create({
});
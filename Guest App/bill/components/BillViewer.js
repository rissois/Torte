import React, { useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  PixelRatio,
} from 'react-native';
import { DefaultText, MediumText, SmallText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import useBillSummaries from '../hooks/useBillSummaries';
import { ScrollView } from 'react-native-gesture-handler';
import Layout from '../../utils/constants/Layout';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import centsToDollar from '../../utils/functions/centsToDollar';
import SummaryValue from './SummaryValue';
import { useMyID } from '../../utils/hooks/useUser';

const twoDigitWidth = 40 * PixelRatio.getFontScale()
const circleWidth = 7 * PixelRatio.getFontScale()

const viewabilityConfig = { viewAreaCoveragePercentThreshold: 70, minimumViewTime: 100 }

export default function BillViewer({ selectedUser, setSelectedUser, billViewerRef, isReceipt, isLoading, tips = 0, discounts = 0 }) {

  const billSummaries = useBillSummaries(isReceipt)

  const onViewableItemsChanged = useCallback(({ viewableItems, }) => {
    const user_id = viewableItems[0]?.item?.id
    if (user_id) {
      setSelectedUser(user_id)
    }
  }, []);
  const viewabilityConfigCallbackPairs = useRef([{ onViewableItemsChanged, viewabilityConfig },]);

  const myID = useMyID()

  return (<>
    <FlatList
      horizontal
      // paging would likely be better, but had issues with onViewableItemsChanged
      // See Menu for simpler declarations for onViewableItemsChanged
      ref={billViewerRef}
      snapToInterval={Layout.window.width}
      showsHorizontalScrollIndicator={false}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      decelerationRate='fast'
      data={billSummaries}
      keyExtractor={item => item.id}
      onScrollToIndexFailed={(info) => {
        /* handle error here /*/
      }}
      renderItem={({ item: summary, index }) => (
        <View style={styles.page}>
          <ScrollView
            indicatorStyle='white'
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {summary.items.map(item => {
              return <SummaryItem {...item} key={item.name + item.caption + item.subtotal} isRedShown={!index || !isReceipt} />
            })}
          </ScrollView>

          <View style={{ marginVertical: 10, paddingHorizontal: 8, paddingTop: 8, borderTopColor: Colors.white, borderTopWidth: 2 }}>
            <SummaryValue text='Subtotal' value={summary.subtotal} />
            <SummaryValue text='Tax' value={summary.tax} />
            {
              isReceipt && selectedUser === myID ? <>
                <SummaryValue text='Tips' value={tips} />
                {!!discounts && <SummaryValue text='Discounts' value={discounts} />}
                <SummaryValue text='Total' value={summary.subtotal + summary.tax + tips - discounts} />
              </> :
                <SummaryValue text='Total' value={summary.subtotal + summary.tax} />
            }
          </View>
        </View>
      )}
    />
    {isLoading && <IndicatorOverlay text='Loading...' />}
  </>
  )
}



const SummaryItem = ({ num, denom, name, caption, subtotal, isPaid, isRedShown, }) => {

  return <View style={{ flexDirection: 'row', }}>
    <View style={{ height: 20 * PixelRatio.getFontScale(), justifyContent: 'center', }}>
      <View style={{ width: circleWidth, height: circleWidth, borderRadius: circleWidth, backgroundColor: isRedShown && !isPaid ? Colors.red : undefined }} />
    </View>
    <View style={{ minWidth: twoDigitWidth, }}>
      <MediumText center>{num}{denom > 1 ? `/${denom}` : ''}</MediumText>
    </View>
    <View style={{ flex: 1, marginRight: 8, marginBottom: 12 }}>
      <MediumText >{name}</MediumText>
      {!!caption && <SmallText lightgrey>{caption}</SmallText>}
    </View>
    <MediumText >{centsToDollar(subtotal)}</MediumText>
  </View>
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: Layout.window.width * 0.8,
    marginHorizontal: Layout.window.width * 0.1
  },
  voided: {
    textDecorationLine: 'line-through'
  },
  itemText: {

  },
});
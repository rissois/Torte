import React, { useEffect, useRef, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,

} from 'react-native';
import { MediumText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import useBillSummaries from '../hooks/useBillSummaries';
import { firstAndL } from '../../utils/functions/names';


export default function BillUserScroller({ selectedUser, setSelectedUser, billViewerRef, isReceipt }) {
  const scrollerRef = useRef(null)

  const billSummaries = useBillSummaries(isReceipt)

  useEffect(() => {
    if (selectedUser) {
      const index = scrollerRef?.current?.props?.data.findIndex(summary => summary.id === selectedUser)
      console.log(`selected user index ${index} and data length ${scrollerRef?.current?.props?.data?.length}`)
      if (~index && scrollerRef?.current?.props?.data?.length) {
        scrollerRef.current.scrollToIndex({ index, viewPosition: 0.5, })
      }
    }
  }, [selectedUser])

  return (

    <FlatList
      horizontal
      ref={scrollerRef}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1, justifyContent: 'center' }}
      data={billSummaries}
      keyExtractor={item => item.id}
      onScrollToIndexFailed={(info) => {
        /* handle error here /*/
      }}
      renderItem={({ item: user }) => {
        const isSelected = user.id === selectedUser
        return <TouchableOpacity onPress={() => {
          setSelectedUser(user.id)
          const index = scrollerRef?.current?.props?.data.findIndex(summary => summary.id === user.id)
          console.log(`Touched index ${index} with data ${!!billViewerRef?.current?.props?.data?.length}`)
          if (billViewerRef?.current?.props?.data?.length) {
            billViewerRef.current.scrollToIndex({ index, })
          }
        }}>
          <View style={[styles.section, { ...isSelected && { backgroundColor: Colors.darkgreen } }]}>
            <MediumText style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              marginBottom: 2,
            }}>{user.id === 'server' ? 'Server' : firstAndL(user.name)}</MediumText>
          </View>
        </TouchableOpacity>
      }}
    />
  )
}


const styles = StyleSheet.create({
  section: {
    marginHorizontal: 4,
    borderRadius: 20,
  },
});
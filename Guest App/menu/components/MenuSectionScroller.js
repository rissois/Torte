import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';

import { DefaultText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { useSelector } from 'react-redux';
import { selectMenuSectionList, } from '../../redux/selectors/selectorsMenus';

// https://react-redux.js.org/api/hooks#useselector-examples

export default function MenuSectionScroller({ sectionListRef, viewableSection, sectionHeaderHeights }) {
  const sectionList = useSelector(selectMenuSectionList)

  const scrollerRef = useRef(null)

  useEffect(() => {
    if (viewableSection) {
      const index = sectionList.findIndex(section => section.id === viewableSection)
      // 
      if (~index && scrollerRef?.current?.props?.data.length) {
        scrollerRef?.current?.scrollToIndex({ index, viewOffset: 16 })
      }
    }
  }, [viewableSection, sectionList])

  return (
    <FlatList
      horizontal
      ref={scrollerRef}
      showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: Colors.paper, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, }} // flexGrow: 1, justifyContent: 'center'
      data={sectionList}
      keyExtractor={section => section.id}
      onScrollToIndexFailed={(info) => {
        /* handle error here /*/
      }}
      renderItem={({ item: section, index: sectionIndex }) => {
        const isSelected = section.id === viewableSection
        return <TouchableOpacity
          // disabled={Platform.OS === 'web'} 
          onPress={() => {
            if (sectionListRef?.current?.props?.sections.length > sectionIndex) {
              sectionListRef?.current?.scrollToLocation({ animated: true, sectionIndex, ...Platform.OS === 'web' ? { itemIndex: 1, viewOffset: -1 } : { itemIndex: 0 } })
            }
            else {
              sectionListRef?.current?.scrollToLocation({ animated: true, sectionIndex: sectionListRef?.current?.props?.sections.length - 1, ...Platform.OS === 'web' ? { itemIndex: 1, viewOffset: -1 } : { itemIndex: 0 } })
            }
          }}>
          <View style={[styles.section, { ...isSelected && { backgroundColor: Colors.darkgrey } }]}>
            <DefaultText style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              marginBottom: 2, color: isSelected ? Colors.paper : Colors.darkgrey
            }}>{section.name}</DefaultText>
          </View>
        </TouchableOpacity>
      }}

    />
  )
}


const styles = StyleSheet.create({
  section: {
    marginVertical: 5,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  sectionText: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 2, // Evens out line height
  }
});


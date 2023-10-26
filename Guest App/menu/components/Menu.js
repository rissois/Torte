import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  SectionList,
  TouchableWithoutFeedback,
} from 'react-native';
import MenuItems from './MenuItems';
import MenuSections from './MenuSections';
import Layout from '../../utils/constants/Layout';
import { selectMenuSectionList } from '../../redux/selectors/selectorsMenus';

import MenuPanel from './MenuPanel';
import Colors from '../../utils/constants/Colors';
import { SmallText, DefaultText, MediumText } from '../../utils/components/NewStyledText';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import useManageWalkthrough from '../../transactions/useManageWalkthrough';

// https://react-redux.js.org/api/hooks#useselector-examples

export default function Menu({ sectionListRef, setViewableSection }) {
  const sectionList = useSelector(selectMenuSectionList)
  const [filterWalkthrough, writeFilterWalkthrough] = useManageWalkthrough('filter')

  // Invariant Violation: Changing onViewableItemsChanged on the fly is not supported?
  // See POS EditModifiers
  const handleScroll = useCallback(({ viewableItems }) => {
    const section_id = viewableItems[0]?.section?.id
    if (section_id) {
      setViewableSection(section_id)
    }
  }, [])

  return (
    <>
      <SectionList
        style={{ flex: 1 }}
        ref={sectionListRef}
        sections={sectionList}
        onViewableItemsChanged={handleScroll}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 20 }}
        onScrollToIndexFailed={(info) => {
          /* handle error here /*/
        }}
        keyExtractor={itemIDs => itemIDs.item_id + itemIDs.variant_id}
        ListHeaderComponent={() => (
          <View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={{ marginVertical: 10, paddingBottom: Layout.scrollViewPadBot }}>
            <SmallText center style={{ marginHorizontal: 40, marginVertical: 10, }}>* Contains ingredients that are rare or undercooked. Consuming raw or undercooked meats, poultry, seafood or eggs may increase your risk of food-borne illness.</SmallText>
            <SmallText center style={{ marginHorizontal: 40, marginVertical: 10, }}>Please inform your server before ordering if anyone in your party has a food allergy.</SmallText>
          </View>
          // <ItemPhoto photo_id={'logo'} isContain /> 
        )}
        renderSectionHeader={({ section: { name, description } }) => (
          <MenuSections name={name} description={description} />
        )}
        renderSectionFooter={renderFooter}
        renderItem={({ item, section }) => (
          <MenuItems item_id={item.item_id} variant_id={item.variant_id} section_id={section.id} />
        )}
        indicatorStyle='white'
        stickySectionHeadersEnabled
      />

      {filterWalkthrough && <TouchableWithoutFeedback onPress={writeFilterWalkthrough}>
        <View style={{ position: 'absolute', flexDirection: 'row', top: 4, right: 4, backgroundColor: Colors.black + 'F1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 }}>
          <View style={{ paddingRight: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MediumText>Press the </MediumText>
              <Feather
                name='filter'
                size={17}
                color={Colors.white}
              />
              <MediumText> for</MediumText>
            </View>
            <MediumText>dietary restrictions</MediumText>
          </View>
          <MaterialCommunityIcons name='close-circle' color={Colors.white} size={24} />
        </View>
      </TouchableWithoutFeedback>}
    </>
  )
}

const renderFooter = ({ section: { panel_id, id, data, name } }) => (
  <View>
    {!data.length && <View style={{ minHeight: 70, justifyContent: 'center', paddingHorizontal: 40 }}>
      <DefaultText red center>There are no items in {name.toUpperCase()} that meet your dietary filters.</DefaultText>
    </View>}
    {!!panel_id && <MenuPanel panel_id={panel_id} section_id={id} />}
  </View>
)


const styles = StyleSheet.create({

});


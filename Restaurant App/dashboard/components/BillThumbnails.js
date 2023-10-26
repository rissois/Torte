import React, { useState, useCallback } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Switch,
  UIManager,
  View,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { useSelector } from 'react-redux';
import { selectTablesAlphabetically } from '../../redux/selectors/selectorsTables';
import { FlatList } from 'react-native-gesture-handler';
import TableThumbnail from './TableThumbnail';
import { LargeText, MediumText } from '../../utils/components/NewStyledText';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BillThumbnails({ setBillID }) {
  const tables = useSelector(selectTablesAlphabetically)
  const [isHidingEmpty, setIsHidingEmpty] = useState(true)

  const animateHide = useCallback(isHiding => {
    LayoutAnimation.configureNext({ ...LayoutAnimation.Presets.easeInEaseOut, duration: 170 });
    setIsHidingEmpty(isHiding)
  }, [])

  return (
    <FlatList
      ListHeaderComponent={() => <View style={{ backgroundColor: Colors.darkgrey, borderColor: Colors.white, borderWidth: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <MediumText>Hide empty tables   </MediumText>
        <Switch
          trackColor={{ false: Colors.midgrey, true: Colors.green }}
          thumbColor={Colors.white}
          ios_backgroundColor={Colors.midgrey}
          onValueChange={animateHide}
          value={isHidingEmpty}
          style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
        />
      </View>}
      ListFooterComponent={() => <View style={{ marginHorizontal: 20, flex: 1, }}>
        {isHidingEmpty && <LargeText center style={{ marginVertical: 30 }}>Hiding all tables without an active bill</LargeText>}
      </View>}
      stickyHeaderIndices={[0]}
      contentContainerStyle={{
        // borderTopColor: Colors.lightgrey, borderTopWidth: 1,
      }}
      stickyH
      data={tables}
      keyExtractor={item => item}
      renderItem={({ item: table_id }) => <TableThumbnail table_id={table_id} setBillID={setBillID} isHidingEmpty={isHidingEmpty} />}
    />
  )
}

const styles = StyleSheet.create({

});


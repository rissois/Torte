import React, { useEffect, useMemo, useState } from 'react';
import {
  PixelRatio,
  StyleSheet,
  View,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { DefaultText, MediumText } from '../../utils/components/NewStyledText';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { selectTrackedMenu } from '../../redux/selectors/selectorsMenus';
import { selectIsMissingMenu, } from '../../redux/selectors/selectorsTrackers';
import { selectMealName } from '../../redux/selectors/selectorsRestaurant2';

const closeHeight = 27 * PixelRatio.getFontScale()


export default function MenuChanger({ isChangerOpen, closeChangerDrawer, openChangerDrawer }) {
  const { name: menuName } = useSelector(selectTrackedMenu)
  const mealName = useSelector(selectMealName)

  const isMissingMenu = useSelector(selectIsMissingMenu)

  // useEffect(() => {
  //   if (!isMissingMenu) {
  //     const mealName = restaurant.meals[meal_id]?.name ?? ''
  //     setFullMenuName(mealName + ' ' + (menuName ?? 'missing') + ' menu')
  //   }
  // }, [restaurant, menuName, mealName, isMissingMenu])

  return <TouchableOpacity disabled={isMissingMenu && !isChangerOpen} onPress={() => {
    if (isChangerOpen) {
      closeChangerDrawer()
    }
    else {
      openChangerDrawer()
    }
  }}>
    <View style={styles.changerRow}>
      <View style={{ flexDirection: 'row', justifyContent: isMissingMenu ? 'center' : 'flex-start', flex: 1, alignItems: 'center' }}>
        <MaterialIcons size={closeHeight} color={Colors.darkgrey} name='chrome-reader-mode' />
        <MediumText darkgrey style={{ paddingLeft: 8, paddingRight: isMissingMenu ? 0 : 8 }}>{isMissingMenu ? 'Select a menu' : `${mealName} ${menuName}`}</MediumText>
      </View>
      {isMissingMenu ? null : isChangerOpen ? <MaterialIcons size={closeHeight} color={Colors.darkgrey} name='close' style={{ marginVertical: -closeHeight }} /> : <DefaultText red>change</DefaultText>}
    </View>
  </TouchableOpacity >
}

const styles = StyleSheet.create({
  changerRow: {
    backgroundColor: Colors.paper,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.darkgrey,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }
});


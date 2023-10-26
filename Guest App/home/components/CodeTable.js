/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useCallback, } from 'react';
import {
  View,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import CodeTableInput from './CodeTableInput';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// 
export default function CodeTable({
  tableRef,
  table,
  setTable,
  restaurant_id,
  startBillAndNavigate,
  handlePriorBill,
  changeTable,
  isFetchingBill,
  isFetchingTable,
  setIsFetchingTable
}) {

  const resetTable = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTable(null)
    setTimeout(() => tableRef?.current?.focus(), 100)
  }, [])


  if (!restaurant_id) return null
  if (table) {
    return <View>
      <LargeText center>{table?.name}</LargeText>
      <TouchableOpacity
        disabled={isFetchingBill}
        onPress={resetTable}
      >
        <DefaultText center style={{ color: isFetchingBill ? Colors.darkgrey : Colors.red }}>(change table)</DefaultText>
      </TouchableOpacity>
    </View>
  }

  return <CodeTableInput
    tableRef={tableRef}
    table={table}
    restaurant_id={restaurant_id}
    startBillAndNavigate={startBillAndNavigate}
    handlePriorBill={handlePriorBill}
    changeTable={changeTable}
    isFetchingBill={isFetchingBill}
    isFetchingTable={isFetchingTable}
    setIsFetchingTable={setIsFetchingTable}
  />
}


import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { LargeText, } from '../../utils/components/NewStyledText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { militaryToDate, } from '../../utils/functions/dateAndTime';
import dateTimePickerStyles from '../constants/dateTimePickerStyles';



export default function MealStartEndPicker({ start, end, setTime, isCompact }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', flex: 8, }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
      <LargeText>Start: </LargeText>
      <DateTimePicker
        value={militaryToDate(start)}
        onChange={setTime(true)}
        {...dateTimePickerStyles}
        {...isCompact && { display: 'compact', style: { width: 100 } }}
      />
    </View>

    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
      <LargeText>End:   </LargeText>
      <DateTimePicker
        value={militaryToDate(end)}
        onChange={setTime()}
        {...dateTimePickerStyles}
        {...isCompact && { display: 'compact', style: { width: 100 } }}
      />
    </View>
  </View>
}


const styles = StyleSheet.create({

});


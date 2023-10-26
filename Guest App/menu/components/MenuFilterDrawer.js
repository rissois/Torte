import React, { } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { DefaultText, MediumText } from '../../utils/components/NewStyledText';
import { doFiltersReset, doFilterToggle } from '../../redux/actions/actionsFilters';
import { selectFilters } from '../../redux/selectors/selectorsFilters';
import { initialFilters } from '../../redux/reducers/reducerFilters';

// https://react-redux.js.org/api/hooks#useselector-examples

export default function MenuFilterDrawer({ isFilterOpen, toggleFilterDrawer }) {
  const dispatch = useDispatch()

  const filters = useSelector(selectFilters)

  return (
    <View style={[styles.container, { width: isFilterOpen ? '100%' : 0, }]}>
      <TouchableWithoutFeedback onPress={toggleFilterDrawer}>
        <View style={styles.warningView}>
          <DefaultText center bold>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center style={styles.warning}>(tap anywhere to close)</DefaultText>
          {/* <DefaultText red center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText red center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText red center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText red center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText red center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText red center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText>
          <DefaultText center bold style={styles.warning}>Always inform your server of any allergies or dietary needs</DefaultText> */}
        </View>
      </TouchableWithoutFeedback>
      <View>
        <ScrollView style={{ backgroundColor: Colors.red, paddingVertical: 2 }}>
          {
            Object.keys(initialFilters).map(key => {
              const isOn = filters[key].on
              return (
                <TouchableOpacity key={key} onPress={() => dispatch(doFilterToggle(key))}>
                  <View key={key} style={[styles.filter, { ...isOn && { backgroundColor: Colors.white } }]}>
                    <MediumText style={{ ...isOn && { color: Colors.red } }}>{filters[key].name}</MediumText>
                  </View>
                </TouchableOpacity>
              )
            })
          }
          <TouchableOpacity onPress={() => dispatch(doFiltersReset())}>
            <View style={[styles.filter, { marginTop: 30 }]}>
              <MediumText>clear all</MediumText>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.black + 'FA',
    flexDirection: 'row'
  },
  warningView: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  warning: {
    marginTop: 80,
  },
  filter: {
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
});


import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import capitalize from '../functions/capitalize';
import commaList from '../functions/commaList';


export default function EmployeesScreen({ navigation, route }) {
  const { employees } = useSelector(state => state)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name='arrow-back'
                size={38}
                color={Colors.softwhite}
              />
            </TouchableOpacity>
          </View>
          <HeaderText>Employees</HeaderText>
          <View style={{ flex: 1 }}></View>
        </View>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <MainText center>Do you need to assign servers to tables?</MainText>
          <TouchableOpacity style={[styles.assignmentsButton, styles.shadow]} onPress={() => {
            navigation.replace('TableAssignments', { manager: true })
          }}>
            <LargeText>Table assignments</LargeText>
          </TouchableOpacity>
        </View>
        <FlatList
          contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.1, }}
          keyExtractor={item => item}
          data={Object.keys(employees).sort((a, b) => employees[a].name > employees[b].name)}
          ListEmptyComponent={() => <LargeText center>No employees found</LargeText>}
          ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
          renderItem={({ item: employee_id }) => {
            let roles = employees[employee_id]?.roles.length ? commaList(employees[employee_id].roles.map(role => capitalize(role))) : 'no permissions'
            return <TouchableOpacity onPress={() => {
              navigation.navigate('Employee', { employee_id })
            }}>
              <View style={[styles.employee, styles.shadow]}>
                <View style={{ flex: 1 }}>
                  <LargeText>{employees[employee_id].name}</LargeText>
                  <MainText>{roles}</MainText>
                </View>
                <TouchableOpacity style={{ paddingHorizontal: 20 }} onPress={() => {
                  navigation.navigate('Pin', { employee_id, change_pin: employees[employee_id].pin })
                }}>
                  <MainText center style={{ color: Colors.red }}>{employees[employee_id].pin ? 'Change' : 'Create'}{'\n'}pin</MainText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          }}
          ListFooterComponent={() => {
            return <TouchableOpacity onPress={() => {
              navigation.navigate('Employee')
            }} style={[styles.shadow, { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingVertical: 40 }]}>
              <MaterialIcons name='add-circle' size={50} color={Colors.green} style={{ marginHorizontal: 20, }} />
              <HeaderText>Add a new employee</HeaderText>
            </TouchableOpacity>
          }}
        />
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  assignmentsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.purple,
    marginVertical: 12,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.30,
    shadowRadius: 5.30,

    elevation: 7,
  },
  employee: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.darkgrey,
    borderRadius: 12,
  }
});

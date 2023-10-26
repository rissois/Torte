import React, { useState, } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { useSelector } from 'react-redux';
import { LargeText, HeaderText } from './PortalText'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  TouchableOpacity,
} from 'react-native-gesture-handler';

export default function TableSelector(props) {
  const { cancel, confirm, creatingBill } = props
  const tables = useSelector(state => state.tables)
  const table_order = useSelector(state => state.system.table_order)

  const [selectedTable, setSelectedTable] = useState('')

  return <View style={{ flex: 1, backgroundColor: Colors.black + 'EF', paddingVertical: Layout.window.width * 0.1, }}>
    <View style={{
      flex: 1,
      marginHorizontal: Layout.window.width * 0.1,
      backgroundColor: Colors.darkgrey,
    }}
    >
      <View style={{ flexDirection: 'row', padding: 16 }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={cancel}>
            <MaterialIcons
              name='close'
              size={34}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
        <LargeText center>Create a bill at table:</LargeText>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView style={{}} >
        {
          table_order.map(table_id => {
            return <TouchableOpacity key={table_id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomColor: Colors.softwhite, borderBottomWidth: 1 }}
              onPress={() => setSelectedTable(prev => {
                if (prev === table_id) return ''
                return table_id
              })}>
              <MaterialCommunityIcons
                name='checkbox-marked-circle-outline'
                color={selectedTable === table_id ? Colors.green : Colors.darkgrey}
                size={40}
                style={{ marginRight: 20, }}
              />
              <HeaderText style={styles.tableNumber}>{tables[table_id].table_details.code}</HeaderText>
              <HeaderText>    {tables[table_id].table_details.name}</HeaderText>
              {
                creatingBill.includes(table_id) &&
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: `rgba(0,0,0,0.4)`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  <ActivityIndicator color="#fff" animating size="large" />
                </View>
              }
            </TouchableOpacity>
          })
        }

        <HeaderText center style={{ marginVertical: 40 }}>No further tables</HeaderText>
      </ScrollView>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', }}>
      <TouchableOpacity onPress={cancel}>
        <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.red, fontWeight: 'bold' }}>CANCEL</LargeText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        confirm(tables[selectedTable])
        setSelectedTable('')
      }}>
        <LargeText style={{ marginVertical: Layout.spacer.medium, color: Colors.green, fontWeight: 'bold' }}>CONFIRM</LargeText>
      </TouchableOpacity>
    </View>
  </View>
}

const styles = StyleSheet.create({
  tableNumber: {
    fontSize: 40,
    fontWeight: 'bold',
  },
});
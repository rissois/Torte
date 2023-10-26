import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text
} from 'react-native';

import { useFocusEffect, } from '@react-navigation/native';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import CountUp from './CountUp';
import { useSelector, useDispatch } from 'react-redux';
import { LargeText } from './PortalText';
import Plurarize from './Plurarize';
import useFilteredOrders from '../hooks/useFilteredOrders';



export default function OrderBlock(props) {
  let { table_id, bill_id, untransferred = false } = props
  const { [untransferred ? 'untransferredByTable' : table_id ? 'transferredByTable' : 'transferredByBill']: { [table_id || bill_id]: sorted_orders }, untransferredByTable } = useFilteredOrders()

  if (untransferred) {
    return <View style={styles.alertContainer}>
      <View style={styles.ledeView}>
        <LargeText center>{sorted_orders[0].table_name}</LargeText>
        <Text style={styles.ledeText}><Plurarize nouns={{ s: 'order', p: 'orders' }} value={untransferredByTable[table_id].length} /> waiting <CountUp time={sorted_orders[0].time ?? null} add_time={10000} /></Text>
      </View>
    </View>
  }

  if (table_id) {
    return <View style={styles.alertContainer}>
      <View style={[styles.ledeView, { backgroundColor: Colors.darkgreen }]}>
        <Text style={[styles.ledeText, { letterSpacing: 2 }]}>{sorted_orders[0].table_name}</Text>
        <Text style={styles.ledeText}>Last transfer was <CountUp time={sorted_orders[0].time ?? null} add_time={0} /> ago</Text>
      </View>
      {/* <Text style={{ fontSize: 20 }}>{ref_code}</Text> */}
    </View>
  }

  //
  return <View style={styles.alertContainer}>
    <View style={[styles.ledeView, { backgroundColor: Colors.darkgreen }]}>
      <Text style={[styles.ledeText, { letterSpacing: 2 }]}>Bill #{sorted_orders[0].ref_code} - {sorted_orders[0].table_name}</Text>
      <Text style={styles.ledeText}>Last transfer was <CountUp time={sorted_orders[0].time ?? null} add_time={0} /> ago</Text>
    </View>
    {/* <Text style={{ fontSize: 20 }}>{ref_code}</Text> */}
  </View>


}

const styles = StyleSheet.create({
  alertContainer: {
    width: '100%',
    backgroundColor: Colors.backgroundColor,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,

    elevation: 9,
  },
  ledeView: {
    width: '100%',
    backgroundColor: Colors.red,
    paddingVertical: 20
  },
  ledeText: {
    textAlign: 'center',
    color: Colors.white,
    fontSize: 24,
    letterSpacing: 1,
    fontWeight: 'bold'
  },

});


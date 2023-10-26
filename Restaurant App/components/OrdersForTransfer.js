import React, { useEffect, useState, } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';

import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import CountUp from './CountUp';
import commaList from '../functions/commaList'
import filterTitles from '../constants/filterTitles';
import centsToDollar from '../functions/centsToDollar';
import batchOrderTransferred from '../transactions/batchOrderTransferred';
import { useSelector, useDispatch } from 'react-redux';
import { setOrderChecks, setOrderWriting, toggleOrderCheck, } from '../redux/actionsOrders';
import capitalize from '../functions/capitalize';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { htmlOrders } from '../functions/printHTML';
import useRestaurant from '../hooks/useRestaurant';
import * as Print from 'expo-print';
import { isDemo } from '../constants/demo';

export default function OrdersForTransfer(props) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()


  let {
    order_id,
    untransferred,
    setDisplayOrders,
  } = props

  const { order_no, ref_code, orders = {}, checks = [], writing, submission_time, bill_id, submission_id } = useSelector(state => state.orders[order_id] ?? {})

  const { authorized_users = [], table_details = {}, server_details = {} } = useSelector(state => state.bills[bill_id] ?? {})

  /*
  In the future, group identical items.
  */




  const [itemsByPosition] = useState(Object.values(orders).flatMap(users => Object.values(users).flatMap(items => items)).sort((a, b) => a.full_item_position.localeCompare(b.full_item_position)))
  const [isFullyChecked, setIsFullyChecked] = useState(false)

  useEffect(() => {
    let arr = []
    arr.length = itemsByPosition.length
    dispatch(setOrderChecks(order_id, arr.fill(false)))
  }, [itemsByPosition])

  useEffect(() => {
    setIsFullyChecked(checks.length && checks.every(check => check))
  }, [checks])



  return <View key={order_id} style={{
    marginTop: 40,
    marginHorizontal: 40,
  }}>
    <TouchableOpacity disabled={!untransferred} onPress={() => {
      dispatch(toggleOrderCheck(order_id))
    }}>
      <View style={{
        borderBottomColor: Colors.white,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
      }}>

        {untransferred && <MaterialCommunityIcons
          name={'checkbox-multiple-marked'}
          size={42}
          color={isFullyChecked ? Colors.green : Colors.background}
        />}

        <Text style={[styles.subheaderText, { flex: 1, marginLeft: untransferred ? 20 : 0 }]}>Bill #{ref_code}-{order_no}</Text>
        <Text style={styles.subheaderText}><CountUp time={submission_time?.toMillis() ?? null} add_time={10000} />{untransferred ? '' : ' ago'}</Text>
        {false && <TouchableOpacity style={{ paddingLeft: 16 }} onPress={async () => {
          try {
            let printer = await Print.selectPrinterAsync()

            Print.printAsync({
              html: htmlOrders({ ref_code, order_no, table_details, server_details }, itemsByPosition),
              printerUrl: printer.url
            })
          }
          catch (error) {
            console.log('print error: ', error)
          }

        }}>
          <MaterialIcons
            name='print'
            size={50}
            color={Colors.white}
          />
        </TouchableOpacity>}
      </View>
    </TouchableOpacity>

    {
      itemsByPosition.map((item, index) => <TouchableOpacity disabled={!untransferred} onPress={() => {
        dispatch(toggleOrderCheck(order_id, index))
      }}
        key={index} style={{ flexDirection: 'row', marginTop: 30, }}>
        {untransferred ? <View>
          <MaterialCommunityIcons
            name={'checkbox-marked'}
            size={60}
            color={checks[index] ? Colors.green : Colors.background}
            style={{ paddingHorizontal: 20 }}
          />
        </View> : <View style={{ width: 20 }} />}
        <View style={{ marginTop: 8, flex: 1, }}>
          <View style={{ flexDirection: 'row', }}>
            <View style={{ width: 60, }}>
              <Text style={styles.subheaderText}>{item.num}</Text>
            </View>
            <Text style={[styles.subheaderText, { textTransform: 'uppercase', flex: 1 }]} >{item.name}</Text>
            <Text style={styles.subheaderText}>{centsToDollar(item.total)}</Text>
          </View>

          <View style={{ marginLeft: 60 }}>
            <Text style={styles.detailsText}>Guest #{authorized_users.indexOf(item.ordered_by) + 1 || 'unknown'}</Text>
            {
              // Each filter gets it's own line
              !!item.filters && Object.keys(item.filters).map(filter => <Text key={filter} style={[styles.detailsText, { color: Colors.red, fontWeight: 'bold' }]}>{filterTitles[filter]}{typeof item.filters[filter] === 'number' ? ' (' + centsToDollar(item.filters[filter]) + ')' : ''}</Text>)
            }
            {
              !!item.specifications && Object.keys(item.specifications).map(spec_id => <Text key={spec_id} style={styles.detailsText}>{capitalize(item.specifications[spec_id].name)}: {commaList(item.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name + (option.price ? ' (' + centsToDollar(option.price * (option.quantity ?? 1)) + ')' : '')))}</Text>)
            }
            {
              !!item.modifications && Object.keys(item.modifications).map(mod_id => <Text key={mod_id} style={styles.detailsText}>{(item.modifications[mod_id].quantity > 1 ? item.modifications[mod_id].quantity + 'X ' : '') + item.modifications[mod_id].name}{item.modifications[mod_id].price ? ' (' + centsToDollar(item.modifications[mod_id].price * (item.modifications[mod_id].quantity ?? 1)) + ')' : ''}</Text>)
            }
            {
              !!item.comment && <Text key={'comment'} style={styles.detailsText}>{item.comment}</Text>
            }
          </View>
        </View>
      </TouchableOpacity>)
    }

    {untransferred && <TouchableOpacity disabled={writing === true} style={{ alignSelf: 'center', marginTop: 30 }} onPress={async () => {
      try {
        dispatch(setOrderWriting(order_id, true))

        await batchOrderTransferred(restaurant_id, bill_id, order_id, submission_id)

        setDisplayOrders(prev => {
          let next = [...prev]
          next.splice(next.findIndex(({ order_id: oid }) => oid === order_id), 1)
          return next
        })

        dispatch(setOrderWriting(order_id, false))
      }
      catch (error) {
        dispatch(setOrderWriting(order_id, 'failed'))

        console.log(error)
      }
    }}>
      <View style={{ paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, backgroundColor: writing === 'failed' ? Colors.red : writing === true ? Colors.midgrey : Colors.purple }}>
        <Text style={styles.subheaderText}>{writing === 'failed' ? 'Failed to mark, try again?' : writing === true ? 'Marking order' : `Mark order ${order_no} as entered into POS`}</Text>
      </View>
    </TouchableOpacity>}

  </View >
}

const styles = StyleSheet.create({
  subheaderText: {
    color: Colors.white,
    fontSize: 37,
  },
  mainText: {
    color: Colors.white,
    fontSize: 28
  },
  detailsText: {
    color: Colors.white,
    fontSize: 32,
  }



});


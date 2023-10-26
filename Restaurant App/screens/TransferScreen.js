import React, { useEffect, useState, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import batchOrderTransferred from '../transactions/batchOrderTransferred';

import Plurarize from '../components/Plurarize';
import { setOrderWriting } from '../redux/actionsOrders';
import OrdersForTransfer from '../components/OrdersForTransfer';
import { LargeText, MainText } from '../components/PortalText';
import * as Print from 'expo-print';
import { htmlOrders } from '../functions/printHTML';
import useFilteredOrders from '../hooks/useFilteredOrders';
import useRestaurant from '../hooks/useRestaurant';
import commaList from '../functions/commaList';
import filterTitles from '../constants/filterTitles';

export default function TransferScreen({ navigation, route }) {
  let { table_id, bill_id, untransferred } = route.params

  const { [untransferred ? 'untransferredByTable' : table_id ? 'transferredByTable' : 'transferredByBill']: { [table_id || bill_id]: sorted_orders = [] } } = useFilteredOrders()

  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()

  const orders = useSelector(state => state.orders)
  const { [table_id]: { table_details: { name } } = { table_details: {} } } = useSelector(state => state.tables)

  const [displayOrders, setDisplayOrders] = useState(sorted_orders)
  const [allowTransferAll, setAllowTransferAll] = useState(false)

  const [allergens, setAllergens] = useState([])

  useEffect(() => {
    let allergensAcrossOrders = []
    displayOrders.forEach(({ order_id }) => {
      Object.keys(orders[order_id]?.orders ?? {}).forEach(user_id => {
        orders[order_id].orders[user_id].forEach(item => {
          if (item.filters) {
            Object.keys(item.filters).forEach(filter => {
              if (!allergensAcrossOrders.includes(filter)) {
                allergensAcrossOrders.push(filter)
              }
            })
          }
        })
      })
    })
    setAllergens(allergensAcrossOrders)

    setAllowTransferAll(displayOrders.some(({ order_id }) => !orders[order_id]?.writing))
  }, [orders, displayOrders])


  useEffect(() => {
    if (!sorted_orders.length) {
      navigation.goBack()
    }
  }, [sorted_orders])

  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, }}>
    <View style={styles.header}>
      <View>
        <TouchableOpacity onPress={() => { navigation.goBack() }}>
          <MaterialIcons
            name='arrow-back'
            size={50}
            color={Colors.white}
            style={{ marginTop: 8 }}
          />
        </TouchableOpacity>
      </View>
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={styles.headerText}>{name}</Text>
        {untransferred ? <Text style={styles.subheaderText}><Plurarize value={sorted_orders.length} nouns={{ s: 'order', p: 'orders' }} /> waiting to be transferred</Text>
          : <Text style={styles.mainText}>(previously transferred orders)</Text>}
      </View>
      <View style={{ marginTop: 8, opacity: 0 }}>
        <TouchableOpacity disabled={true} style={{ paddingLeft: 16 }} onPress={async () => {
          try {
            let printer = await Print.selectPrinterAsync()

            Print.printAsync({
              html: htmlOrders(),
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
        </TouchableOpacity>
      </View>
    </View>

    <LargeText center style={{ color: Colors.red, fontWeight: 'bold' }}>{allergens.length ? 'SPECIFIED DIETS: ' + commaList(allergens.map(key => filterTitles[key])) : 'No specified dietary restrictions'}</LargeText>
    <MainText center style={{ marginHorizontal: Layout.window.width * 0.2 }}>Please ensure all specifications and add-ons are appropriate for dietary restrictions</MainText>

    <ScrollView style={{ flex: 1, }}>
      <View style={{ marginBottom: 50 }}>
        {displayOrders.map(({ order_id }, index) => {
          // return null
          return <OrdersForTransfer
            key={order_id}
            untransferred={untransferred}
            order_id={order_id}
            setDisplayOrders={setDisplayOrders}
          />
        })}
        {
          displayOrders.length < sorted_orders.length && <View style={{ marginTop: 70 }}>
            <TouchableOpacity onPress={() => {
              setDisplayOrders(sorted_orders)
            }}>
              <Text style={{ textAlign: 'center', fontSize: 32, color: Colors.white }}>There <Plurarize verbs={{ s: 'is', p: 'are' }} value={sorted_orders.length - displayOrders.length} nouns={{ s: 'new order', p: 'new orders' }} /> not shown</Text>
              <Text style={{ textAlign: 'center', fontSize: 26, color: Colors.lightgrey }}>Press here to view all together</Text>
            </TouchableOpacity>
          </View>
        }
      </View>
    </ScrollView>



    {
      untransferred && displayOrders.length > 1 && <TouchableOpacity disabled={!allowTransferAll} style={{ alignSelf: 'center', marginVertical: 30 }} onPress={async () => {
        displayOrders.forEach(async ({ order_id }) => {
          if (orders[order_id]?.writing !== true) {
            try {
              dispatch(setOrderWriting(order_id, true))

              await batchOrderTransferred(restaurant_id, orders[order_id]?.bill_id, order_id, orders[order_id]?.submission_id)

              setDisplayOrders(prev => {
                let next = [...prev]
                next.splice(next.findIndex(({ order_id: oid }) => oid === order_id), 1)
                return next
              })

              dispatch(setOrderWriting(order_id, false))

            }
            catch (error) {
              dispatch(setOrderWriting(order_id, 'failed'))

              Alert.alert('Failed to transfer order.', 'Please try to mark individually. Let Torte support know if this issue persists.')

              console.log('Write order transferred error: ', error)
            }
          }
        })
      }}>
        <View style={{ paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, backgroundColor: Colors.red }}>
          <Text style={styles.subheaderText}>{allowTransferAll ? 'Mark all as entered into POS' : 'Marking orders'}</Text>
        </View>
      </TouchableOpacity>
    }
  </SafeAreaView >
}



const styles = StyleSheet.create({
  centered: {
    width: '100%',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    margin: 16,
  },
  headerText: {
    color: Colors.white,
    fontSize: 52,
  },
  subheaderText: {
    color: Colors.white,
    fontSize: 42,
  },
  mainText: {
    color: Colors.white,
    fontSize: 34
  },



});


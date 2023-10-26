import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, SuperLargeText } from '../../utils/components/NewStyledText';
import { useSelector } from 'react-redux';
import { FlatList } from 'react-native-gesture-handler';
import { selectChronologicalOrderAlerts } from '../../redux/selectors/selectorsOrderAlerts';

export default function OrderAlerts({ openOrder }) {
  // const orders = useSelector(state => state.orders)
  const orderAlerts = useSelector(selectChronologicalOrderAlerts)

  return (
    <FlatList
      data={orderAlerts}
      keyExtractor={item => item.table_id}
      renderItem={({ item: { created, table_id } }) => <TouchableOpacity onPress={() => openOrder(table_id)}>
        <OrderAlert created={created} table_id={table_id} />
      </TouchableOpacity>}
    />
  )
}

const OrderAlert = ({ created, table_id }) => {
  const elapsedTime = useElapsedTime(created)
  const table_name = useSelector(state => state.tables[table_id].name)

  return (
    <View style={styles.orderAlert}>
      <SuperLargeText center>{table_name}</SuperLargeText>
      <ExtraLargeText center bold>{elapsedTime}</ExtraLargeText>
    </View>
  )
}


const useElapsedTime = (millis) => {
  const [elapsed, setElapsed] = useState('calculating')

  /*
  consider useFocusEffect
  consider function for time, fired before interval delay (and timeout delay?)
  consider seconds_elapsed calculated once before setInterval, then ++
  consider tracking minutes and seconds instead, then if seconds >= 60 increment minutes
  */

  const elapsedFunction = (millis) => {
    const seconds_elapsed = Math.round((Date.now() - millis) / 1000)
    let minutes = parseInt(seconds_elapsed / 60, 10);
    let seconds = parseInt(seconds_elapsed % 60, 10);

    seconds = seconds < 10 ? "0" + seconds : seconds;

    // Hours? Days?

    setElapsed(minutes + ":" + seconds)
  }

  useEffect(() => {
    elapsedFunction(millis)

    let interval
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        elapsedFunction(millis)
      }, 1000);
    }, 1000 - (Date.now()) % 1000)

    return () => {
      timeout && clearTimeout(timeout)
      interval && clearInterval(interval)
    }
  }, [millis])

  return elapsed
}

const styles = StyleSheet.create({
  orderAlert: {
    backgroundColor: Colors.red,
    marginVertical: 20,
    paddingVertical: 20,
    marginHorizontal: 30,

    shadowColor: "#000",
    shadowOffset: {
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,

    elevation: 20,
  }
});


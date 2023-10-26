import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { useRestaurantID, useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import { PortalCheckField, PortalDropdownField, PortalTextField } from '../components/PortalFields';
import Layout from '../../utils/constants/Layout';
import { regexIsIP, } from '../../utils/functions/regex';
import StyledButton from '../../utils/components/StyledButton';
import { useItemNamesWithPrinter } from '../../utils/hooks/useItem';
import { RowSelectable } from '../components/PortalRow';
import { SuperLargeText } from '../../utils/components/NewStyledText';
import usePrivateNestedField from '../../hooks/usePrivateNestedField';
import PortalGroup from '../components/PortalGroup';

const TEST_PRINTER_RESPONSE = [
  {
    bt: "",
    ip: "192.168.128.205",
    mac: "00:26:AB:D5:2C:30",
    name: "TM-T20",
    target: "TCP:192.168.128.205",
    usb: "",
    station: "Bar",
  },
  {
    bt: "",
    ip: "192.168.128.202",
    mac: "00:26:AB:D5:22:31",
    name: "TM-T20",
    target: "TCP:192.168.128.202",
    usb: "",
    station: "Kitchen",
  },
  {
    bt: "",
    ip: "192.168.128.209",
    mac: "00:26:AB:D5:46:CF",
    name: "TM-T20",
    target: "TCP:192.168.128.209",
    usb: "",
    station: "Server station",
  },
]

const equalPrinters = (p1, p2) => {
  return Object.keys(p1).length === Object.keys(p2).length &&
    Object.keys(p1).every(id => p1[id].name === p2[id]?.name && p1[id].ip === p2[id]?.ip)
}

const formatPrinters = printer => printer === undefined ? 'Select a printer' : printer?.station || 'MISSING NAME'


export default function PrintersScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const restaurant_id = useRestaurantID()
  const currentPrinters = usePrivateNestedField('Printers', 'printers')
  const currentReceiptPrinter = usePrivateNestedField('Printers', 'receipt_printer')
  const [isLocked, setLocked] = useState(true)
  const [printers, setPrinters] = useState(currentPrinters)
  const [newPrinters, setNewPrinters] = useState(null)
  const [selectedPrinters, setSelectedPrinters] = useState([])
  const [receipt_printer, setReceiptPrinter] = useState(currentReceiptPrinter)
  // const [isReceiptPrinting, setIsReceiptPrinting] = useState(!!currentReceiptPrinter)

  // const isAltered = isReceiptPrinting !== !!currentReceiptPrinter
  //   || (!currentReceiptPrinter || currentReceiptPrinter !== receipt_printer)
  //   || !equalPrinters(printers, currentPrinters)

  const isAltered = currentReceiptPrinter !== receipt_printer || !equalPrinters(printers, currentPrinters)

  const clearNewPrinters = useCallback(() => {
    setNewPrinters(null)
    setSelectedPrinters([])
  }, [])

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setPrinters(currentPrinters)
          setReceiptPrinter(currentReceiptPrinter)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    if (Object.keys(printers).some(printer_id => !printers[printer_id].name || !regexIsIP(printers[printer_id].ip))) {
      dispatch(doAlertAdd('There is an error with one or more printers'))
    }
    else {
      return restaurantRef.collection('Private').doc('Printers').set({
        id: 'Printers',
        restaurant_id,
        receipt_printer,
        printers
      }).then(() => {
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('PrintersScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  const unlock = useMemo(() => (
    <TouchableOpacity style={{ paddingHorizontal: 10, height: '100%' }} onPress={() => setLocked(prev => !prev)}>
      <MaterialIcons
        name={isLocked ? 'lock-outline' : 'lock-open'}
        size={20}
        color={isLocked ? Colors.darkgrey + '44' : Colors.white}
      />
    </TouchableOpacity>
  ), [isLocked])

  const discoverPrinters = useCallback(() => {
    const discovered = TEST_PRINTER_RESPONSE

    const currentIPs = Object.keys(printers).map(printer_id => printers[printer_id].ip)
    const newIPPrinters = discovered.reduce((acc, printer) => {
      if (currentIPs.includes(printer.ip)) return acc

      const printer_id = (restaurantRef.collection('fake').doc()).id
      return { ...acc, [printer_id]: { ...printer, id: printer_id, station: '' } }
    }, {})

    if (Object.keys(newIPPrinters).length) {
      setSelectedPrinters(Object.keys(newIPPrinters))
      setNewPrinters(newIPPrinters)
    }
    else if (discovered.length) dispatch(doAlertAdd('Unable to find new printers', 'All printers are already shown. Please let Torte know if this is an error'))
    else dispatch(doAlertAdd('Unable to find any printers', 'Please try again and let Torte know if this is an error'))
  }, [printers])

  const orderedPrinters = useMemo(() => Object.keys(printers).sort((a, b) => printers[a].station - printers[b].station), [printers])

  return (
    <>
      <PortalForm
        headerText='Edit printers'
        save={save}
        reset={reset}
        isAltered={isAltered}
        right={unlock}
      >
        <PortalGroup text='Receipt printer'>
          {/* Only done for appearance of all printers */}
          <View style={{ marginHorizontal: Layout.marHor, }}>
            <PortalDropdownField
              text='Receipt printer'
              value={receipt_printer}
              options={printers}
              orderedKeys={orderedPrinters}
              setValue={setReceiptPrinter}
              format={formatPrinters}
              isRequired
            />
          </View>
        </PortalGroup>
        <PortalGroup text='All printers'>

          <View style={{ marginHorizontal: Layout.marHor, }}>
            {
              Object.keys(printers).map(printer_id => <Printer setReceiptPrinter={setReceiptPrinter} key={printer_id} setPrinters={setPrinters} {...printers[printer_id]} printer_id={printer_id} isLocked={isLocked} />)
            }
            <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <StyledButton center text='Find printers' color={Colors.darkgreen} onPress={discoverPrinters} />

              {!isLocked && <StyledButton center text='Manually add printer' color={Colors.purple} onPress={() => setPrinters(prev => {
                const id = restaurantRef.collection('fake').doc()
                return { ...prev, [id]: { name: '', station: '', id, ip: '', } }
              })} />}
            </View>
          </View>
        </PortalGroup>

      </PortalForm>

      {/* Largely duplicated from PortalSelector */}
      {!!newPrinters && <View style={[StyleSheet.absoluteFill, styles.absolute]}>
        <View style={{ marginVertical: 20 }}>
          <SuperLargeText center>Select any printer(s)</SuperLargeText>
        </View>
        <FlatList
          contentContainerStyle={{ paddingHorizontal: Layout.marHor }}
          indicatorStyle='white'
          data={Object.keys(newPrinters)}
          keyExtractor={item => item}
          renderItem={({ item: printer_id }) => (
            <RowSelectable
              name={newPrinters[printer_id].name}
              internal_name={newPrinters[printer_id].ip}
              isSelected={selectedPrinters.includes(printer_id)}
              setSelected={() => setSelectedPrinters(prev => prev.includes(printer_id) ? prev.filter(id => id !== printer_id) : [...prev, printer_id])}
            />)}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <StyledButton text='Add printers' disabled={!selectedPrinters.length} onPress={() => {
            let toAdd = {}
            selectedPrinters.forEach(printer_id => toAdd[printer_id] = newPrinters[printer_id])
            setPrinters(prev => ({ ...prev, ...toAdd }))
            clearNewPrinters()
          }} />
          <StyledButton text='Cancel' color={Colors.red} onPress={clearNewPrinters} />
        </View>
      </View>}
    </>
  )
}

const Printer = ({ setPrinters, setReceiptPrinter, name, ip, id, isLocked, station }) => {
  const dispatch = useDispatch()

  const itemsWithPrinter = useItemNamesWithPrinter(id)
  const isPrinterWithItems = !!itemsWithPrinter.length


  const setName = useCallback(text => {
    setPrinters(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        name: text
      }
    }))
  }, [])

  const setStation = useCallback(text => {
    setPrinters(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        station: text
      }
    }))
  }, [])

  const setIP = useCallback(text => {
    setPrinters(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ip: text
      }
    }))
  }, [])

  return <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 + 6, paddingBottom: 6, borderBottomColor: Colors.lightgrey, borderBottomWidth: StyleSheet.hairlineWidth }}>
    <View style={{ flex: 1 }}>
      <PortalTextField
        text='Name'
        value={station}
        onChangeText={setStation}
        placeholder='(required)'
        isRequired
      />

      <PortalTextField
        text='IP Address'
        value={ip}
        onChangeText={setIP}
        // subtext={isLocked ? undefined : 'We highly caution against changing the IP yourself'}
        isLocked={isLocked}
        placeholder='000.000.000.000'
        isRequired
      // isRed={!regexIsIP(ip)}
      />

      <PortalTextField
        text='Device'
        value={name}
        onChangeText={setName}
        placeholder='(TM-T20)'
        isRequired
        isLocked={isLocked}
      />
    </View>

    <TouchableOpacity onPress={() => isPrinterWithItems ?
      dispatch(doAlertAdd('Cannot delete printer', ['This printer is being used by the following items: ', ...itemsWithPrinter])) :
      dispatch(doAlertAdd(`Delete printer ${station}?`, undefined, [
        {
          text: 'Yes, delete',
          onPress: () => {
            setPrinters(prev => {
              const { [id]: remove, ...rest } = prev
              return rest
            })
            setReceiptPrinter(prev => prev.id === id ? '' : prev)
          }
        },
        {
          text: 'No, cancel',
        }
      ]))
    }>
      <MaterialCommunityIcons
        name={isPrinterWithItems ? 'lock-outline' : 'delete-forever'}
        size={32}
        color={isPrinterWithItems ? Colors.midgrey : Colors.red}
        style={{ paddingHorizontal: 30 }}
      />
    </TouchableOpacity>
  </View>
}



const styles = StyleSheet.create({
  absolute: {
    flex: 1,
    backgroundColor: Colors.black + 'F1',
    zIndex: 99,
    padding: Layout.marHor,
  },
});


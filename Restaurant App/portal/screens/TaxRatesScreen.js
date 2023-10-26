import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity
} from 'react-native';
import { LargeText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';

import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import PortalForm from '../components/PortalForm';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import { PortalTextField } from '../components/PortalFields';
import Layout from '../../utils/constants/Layout';
import { regexIsDecimal } from '../../utils/functions/regex';
import StyledButton from '../../utils/components/StyledButton';
import { useItemNamesWithTaxRate } from '../../utils/hooks/useItem';



const equalTaxRates = (o1, o2) => {
  return Object.keys(o1).length === Object.keys(o2).length &&
    Object.keys(o1).every(id => o1[id].name === o2[id].name && o1[id].percent == o2[id].percent)
  // Object.keys(o1).every(id => Object.keys(o1[id]).every(key => o1[id][key] == o2[id][key]))
}


export default function TaxRatesScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  const currentTaxRates = useRestaurantNestedFields('tax_rates')
  const [tax_rates, setTaxRates] = useState(currentTaxRates)

  const isAltered = !equalTaxRates(tax_rates, currentTaxRates)

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setTaxRates(currentTaxRates)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    if (Object.keys(tax_rates).some(tax_rate_id => !tax_rates[tax_rate_id].name)) {
      dispatch(doAlertAdd('One or more tax rates is missing a name'))
    }
    else {
      return restaurantRef.update({
        tax_rates
      }).then(() => {
        dispatch(doSuccessAdd())
      }).catch(error => {
        console.log('TaxRatesScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  return (
    <PortalForm
      headerText='Edit tax rates'
      save={save}
      reset={reset}
      isAltered={isAltered}
    >

      <View style={{ marginHorizontal: Layout.marHor, }}>
        <LargeText center style={{ marginVertical: 20, }}>NOTE: Any changes to tax rates will affect all items that have been assigned that tax rate.</LargeText>
        {
          Object.keys(tax_rates).map(tax_rate_id => <TaxRate key={tax_rate_id} setTaxRates={setTaxRates} {...tax_rates[tax_rate_id]} tax_rate_id={tax_rate_id} />)
        }
        <View style={{ marginTop: 40 }}>
          <StyledButton center text='Add new tax rate' onPress={() => setTaxRates(prev => {
            const id = restaurantRef.collection('fake').doc()
            return { ...prev, [id]: { name: '', percent: 0 } }
          })} />
        </View>
      </View>

    </PortalForm>
  )
}

const TaxRate = ({ setTaxRates, tax_rate_id, name, percent, }) => {
  const dispatch = useDispatch()
  const itemsWithTaxRate = useItemNamesWithTaxRate(tax_rate_id)
  const isTaxRateWithItems = !!itemsWithTaxRate.length

  const setName = useCallback(text => {
    setTaxRates(prev => ({
      ...prev,
      [tax_rate_id]: {
        ...prev[tax_rate_id],
        name: text
      }
    }))
  }, [])

  const setPercent = useCallback(text => {
    if (!text) {
      text = '0'
    }

    if (regexIsDecimal(text)) {
      if (text[0] === '0' && parseInt(text[1])) {
        // trim leading 0s
        text = text[1]
      }

      setTaxRates(prev => ({
        ...prev,
        [tax_rate_id]: {
          ...prev[tax_rate_id],
          percent: text
        }
      }))
    }
  }, [])

  return <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 + 6, paddingBottom: 6, borderBottomColor: Colors.lightgrey, borderBottomWidth: StyleSheet.hairlineWidth }}>
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', }}>
      <PortalTextField
        text='Name'
        value={name}
        onChangeText={setName}
        placeholder='(required)'
        isRequired
      />

      <PortalTextField
        key={tax_rate_id}
        text='Percent'
        value={percent.toString()}
        onChangeText={setPercent}
        afterCursor='%'
      />
    </View>

    <TouchableOpacity onPress={() => isTaxRateWithItems ? dispatch(doAlertAdd('Cannot delete tax rate', ['This tax rate is being used by the following items: ', ...itemsWithTaxRate])) : setTaxRates(prev => {
      const { [tax_rate_id]: remove, ...rest } = prev
      return rest
    })}>
      <MaterialCommunityIcons
        name={isTaxRateWithItems ? 'lock-outline' : 'delete-forever'}
        size={32}
        color={isTaxRateWithItems ? Colors.midgrey : Colors.red}
        style={{ paddingHorizontal: 30 }}
      />
    </TouchableOpacity>
  </View>
}



const styles = StyleSheet.create({

});


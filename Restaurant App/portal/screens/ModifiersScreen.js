import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, } from '@react-navigation/native';

import { useDispatch, } from 'react-redux';
import firebase from 'firebase';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalForm from '../components/PortalForm';
import { PortalCheckField, PortalEnumField, PortalTextField } from '../components/PortalFields';
import PortalGroup from '../components/PortalGroup';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';

import PortalDelete from '../components/PortalDelete';
import { ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import useCategoryChild from '../hooks/useCategoryChild';
import PortalDragger from '../components/PortalDragger';
import PortalAddOrCreate from '../components/PortalAddOrCreate';
import PortalSelector from '../components/PortalSelector';

const equalMods = (m1, m2) => m1.length === m2.length && m1.every((option, index) => option.item_id === m2[index].item_id && option.option_id === m2[index].option_id && option.preselected === m2[index].preselected && option.variant_id === m2[index].variant_id)

const rangeFields = {
  any: 'any',
  exact: 'exact',
  between: 'between',
  max: 'max',
  min: 'min'
}

const getRangeField = (min, max) => (
  min === max ? rangeFields.exact
    : max === Infinity
      ? min ? rangeFields.min
        : rangeFields.any
      : min ? rangeFields.between
        : rangeFields.max
)

const initialRanges = {
  exact: {
    min: 1,
    max: 1,
  },
  between: {
    min: 1,
    max: 2,
  },
  min: {
    min: 1,
    max: Infinity, // const
  },
  max: {
    min: 0, // const
    max: 1,
  },
  any: {
    min: 0, // const
    max: Infinity, // const
  }
}


export default function ModifiersScreen({ navigation, route }) {

  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const { id, item_id, } = route.params ?? {}



  const {
    is_deleted = false,
    name: currentName = '',
    internal_name: currentInternalName = '',
    is_minimized: currentIsMinimized = false,
    is_visible: currentIsVisible = false,
    max: currentMax = 1,
    min: currentMin = 0,
    modifier_first_free: currentModifierFirstFree = 0,
    mods: currentMods = []
  } = useCategoryChild('modifiers', id)

  useEffect(() => {
    if (is_deleted) navigation.goBack()
  }, [is_deleted])


  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(currentInternalName)
  const [is_minimized, setIsMinimized] = useState(currentIsMinimized)
  const [is_visible, setIsVisible] = useState(currentIsVisible)

  const [range, setRange] = useState(getRangeField(currentMin, currentMax))
  const [ranges, setRanges] = useState({ ...initialRanges, [range]: { min: currentMin, max: currentMax } })

  const [showModSelector, setShowModSelector] = useState(false)

  const [mods, setMods] = useState(currentMods)

  const [modifier_first_free, setModifierFirstFree] = useState(currentModifierFirstFree)

  useFocusEffect(useCallback(() => {
    setMods(prev => equalMods(prev, currentMods) ? prev : currentMods)
  }, [currentMods,]))


  const isAltered = name !== currentName
    || internal_name !== currentInternalName
    || is_minimized !== currentIsMinimized
    || is_visible !== currentIsVisible
    || ranges[range].min !== currentMin
    || ranges[range].max !== currentMax
    || !equalMods(mods, currentMods)
    || modifier_first_free !== currentModifierFirstFree


  const reset = () => {
    dispatch(doAlertAdd
      ('Undo all changes?', undefined, [
        {
          text: 'Yes',
          onPress: () => {
            const currentRange = getRangeField(currentMin, currentMax)
            setName(currentName)
            setInternalName(currentInternalName)
            setIsMinimized(currentIsMinimized)
            setIsVisible(currentIsVisible)
            setRange(currentRange)
            setRanges({ ...initialRanges, [currentRange]: { min: currentMin, max: currentMax } })
            setMods(currentMods)
            setModifierFirstFree(currentModifierFirstFree)
          }
        },
        {
          text:
            'No'
        }
      ]))

  }

  const save = () => {
    let failed = []
    if (!name) failed.push('Missing name')
    if (ranges[range].min > ranges[range].max) failed.push('Min cannot be larger than max')
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', [...failed]))
    }
    else {
      const batch = firebase.firestore().batch()

      const modifierRef = id ? restaurantRef.collection('Modifiers').doc(id) : restaurantRef.collection('Modifiers').doc()

      batch.set(modifierRef, {
        internal_name,
        is_minimized,
        is_visible,
        ...ranges[range], // max and min
        modifier_first_free,
        name,
        mods,
        ...!id && {
          id: modifierRef.id,
          is_deleted: false,
          restaurant_id: restaurantRef.id,
        },
      }, { merge: true })

      if (!id) {
        if (item_id) {
          batch.set(restaurantRef.collection('Items').doc(item_id), {
            modifier_ids: firebase.firestore.FieldValue.arrayUnion(modifierRef.id)
          }, { merge: true })
        }
      }

      return batch.commit().then(() => {
        dispatch(doSuccessAdd())
        // if (menu_id) navigation.goBack()
        if (!id) navigation.setParams({ id: modifierRef.id })
      }).catch(error => {
        console.log('Modifiers save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  return (
    <>
      <PortalForm
        headerText={id ? `Edit ${name}` : 'Create modifier'}
        save={save}
        reset={reset}
        isAltered={isAltered}
        saveText='Save modifier'
      >
        <PortalEnumField
          text='Is this modifier visible?'
          subtext='You can hide modifier while you work on them'
          isRed={!is_visible}
          value={is_visible ? 'YES' : 'HIDDEN'}
          options={[true, false]}
          setValue={setIsVisible}
        />


        <PortalGroup text='Basic info'>
          <PortalTextField
            text='Name'
            value={name}
            onChangeText={setName}
            isRequired
            placeholder='(required)'
          />
          <PortalTextField
            text='Internal name'
            value={internal_name}
            onChangeText={setInternalName}
            placeholder='(optional)'
            subtext={`Used to distinguish between two items with similar names`}
          />

        </PortalGroup>


        <PortalGroup text='Quantity'>
          <Range
            range={range}
            setRange={setRange}
            ranges={ranges}
            setRanges={setRanges}
            name={name}
          />
          <View style={{ height: 30 }} />

          <PortalTextField
            text='First # free?'
            value={modifier_first_free}
            onChangeText={setModifierFirstFree}
            isNumber
          />
        </PortalGroup>

        <PortalGroup text='Mods'>
          <PortalDragger
            category='mods'
            child_ids={mods}
            setChildIDs={setMods}
            isAltered={isAltered}
          />
          <PortalAddOrCreate
            category='mods'
            navigationParams={id ? { modifier_id: id, } : null}
            isAltered={isAltered}
            createNew={() => dispatch(doAlertAdd('What type of mod?', 'Most mods are OPTIONS, but you can use an ITEM as an mod.', [
              {
                text: 'Option',
                onPress: () => navigation.push('Options', { modifier_id: id, modifier_name: name })
              },
              {
                text: 'Item',
                onPress: () => navigation.push('Items', { modifier_id: id, modifier_name: name })
              },
              {
                text: 'Cancel',
              }
            ]))}
            addExisting={() => setShowModSelector(true)}
          />
        </PortalGroup>



        {!!id && <PortalDelete category='modifiers' id={id} />}
      </PortalForm>

      {
        !!showModSelector && <PortalSelector
          category={'mods'}
          selected={mods}
          setSelected={setMods}
          parent='modifiers'
          close={() => setShowModSelector(false)}
        />
      }
    </>
  )
}

function Range({ range, setRange, ranges, setRanges, name }) {
  const showMin = range === rangeFields.min || range === rangeFields.between || range === rangeFields.exact
  const showMax = range === rangeFields.max || range === rangeFields.between

  const RangeSelector = ({ text, rangeField }) => useMemo(() => (
    <PortalCheckField
      text={text}
      value={range === rangeField}
      onPress={() => setRange(rangeField)}
    />
  ), [range])

  const onChangeText = isMax => text => {
    setRanges(prev => ({
      ...prev,
      [range]: {
        ...prev[range],
        ...range === rangeFields.exact
          ? { max: text, min: text }
          : { [isMax ? 'max' : 'min']: text }
      }
    }))
  }


  return <View>
    <LargeText style={{ marginVertical: 8 }}>How many {name} can a guest select?</LargeText>
    <View style={{ flexDirection: 'row', }}>
      <View style={{ marginLeft: Layout.marHor }}>
        <RangeSelector
          text='Between two numbers'
          rangeField={rangeFields.between}
        />

        <RangeSelector
          text='Must be exact'
          rangeField={rangeFields.exact}
        />

        <RangeSelector
          text='Any number'
          rangeField={rangeFields.any}
        />

        <RangeSelector
          text='Set a maximum'
          rangeField={rangeFields.max}
        />

        <RangeSelector
          text='Set a minimum'
          rangeField={rangeFields.min}
        />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
        {showMin && <View style={{}}>
          <ExtraLargeText style={{ marginBottom: 8, marginLeft: 2 }}>{range === rangeFields.exact ? 'Exactly' : 'Minimum'}</ExtraLargeText>
          <PortalTextField
            value={ranges[range].min}
            onChangeText={onChangeText()}
            isIncremental
            min={1}
            {...range === rangeFields.between && { max: ranges[range].max - 1 }}
          />
        </View>}

        {showMax && <View>
          <ExtraLargeText style={{ marginBottom: 8, marginLeft: 2 }}>Maximum</ExtraLargeText>
          <PortalTextField
            value={ranges[range].max}
            onChangeText={onChangeText(true)}
            isIncremental
            min={range === rangeFields.between ? Number(ranges[range].min) + 1 : 0}
          />
        </View>}
      </View>
    </View>
  </View>
}


const styles = StyleSheet.create({

});


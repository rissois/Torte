import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import equalArrays from '../../utils/functions/equalArrays';
import firebase from 'firebase';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalForm from '../components/PortalForm';
import { PortalEnumField, PortalTextField } from '../components/PortalFields';
import PortalGroup from '../components/PortalGroup';
import PortalDragger from '../components/PortalDragger';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useFocusEffect } from '@react-navigation/native';
import PortalAddOrCreate from '../components/PortalAddOrCreate';
import PortalSelector from '../components/PortalSelector';
import PortalDelete from '../components/PortalDelete';
import useCategoryChild from '../hooks/useCategoryChild';

export default function MenusScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const { id, meal_id, start, end } = route.params ?? {}

  const {
    is_deleted = false,
    name: currentName = '',
    internal_name: currentInternalName = '',
    is_visible: currentIsVisible = '',
    section_order: currentSectionOrder = [],
  } = useCategoryChild('menus', id)

  useEffect(() => {
    if (is_deleted) navigation.goBack()
  }, [is_deleted])

  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(currentInternalName)
  const [is_visible, setIsVisible] = useState(currentIsVisible)
  const [section_order, setSectionOrder] = useState(currentSectionOrder)
  const [showChildCategory, setShowChildCategory] = useState('')

  useFocusEffect(useCallback(() => {
    setSectionOrder(prev => equalArrays(prev, currentSectionOrder) ? prev : currentSectionOrder)
  }, [currentSectionOrder]))

  const isAltered = name !== currentName
    || internal_name !== currentInternalName
    || is_visible !== currentIsVisible
    || !equalArrays(section_order, currentSectionOrder, true)

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setName(currentName)
          setInternalName(currentInternalName)
          setIsVisible(currentIsVisible)
          setSectionOrder(currentSectionOrder)
        }
      },
      {
        text: 'No'
      }
    ]))
  }

  const save = () => {
    let failed = []
    if (!name) failed.push('Missing name')
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', [...failed]))
    }
    else {
      const batch = firebase.firestore().batch()
      const menuRef = id ? restaurantRef.collection('Menus').doc(id) : restaurantRef.collection('Menus').doc()

      batch.set(menuRef, {
        name,
        internal_name,
        is_visible,
        section_order,
        ...!id && {
          id: menuRef.id,
          restaurant_id: restaurantRef.id,
          is_deleted: false,
        },
      }, { merge: true })

      if (!id) {
        if (meal_id) {
          batch.set(restaurantRef, {
            meals: {
              [meal_id]: {
                menus: firebase.firestore.FieldValue.arrayUnion({
                  menu_id: menuRef.id,
                  is_strict: false,
                  start,
                  end,
                })
              }
            }
          }, { merge: true })
        }
      }

      return batch.commit().then(() => {
        dispatch(doSuccessAdd())
        // if (meal_id) navigation.goBack()
        if (!id) navigation.setParams({ id: menuRef.id })
      }).catch(error => {
        console.log('MenusScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  return (
    <>
      <PortalForm
        headerText={id ? `Edit ${name}` : 'Create menu'}
        save={save}
        reset={reset}
        isAltered={isAltered}
        saveText='Save menu'
      >
        <PortalEnumField
          text='Is this menu visible?'
          subtext='You can hide menus while you work on them'
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
            subtext={`Used to distinguish between two menus with similar names`}
          />

        </PortalGroup>

        <PortalGroup text='Sections' isDrag>
          <PortalDragger
            category='sections'
            child_ids={section_order}
            setChildIDs={setSectionOrder}
            isAltered={isAltered}
          />
          <PortalAddOrCreate
            category='sections'
            navigationParams={id ? { menu_id: id } : null}
            isAltered={isAltered}
            addExisting={() => setShowChildCategory('sections')}
          />
        </PortalGroup>

        {!!id && <PortalDelete category='menus' id={id} />}
      </PortalForm>

      {!!showChildCategory && <PortalSelector
        category={showChildCategory}
        selected={section_order}
        setSelected={setSectionOrder}
        parent='menus'
        close={() => setShowChildCategory('')}
      />}
    </>
  )
}


const styles = StyleSheet.create({

});


import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useDispatch, } from 'react-redux';
import equalArrays from '../../utils/functions/equalArrays';
import firebase from 'firebase';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalForm from '../components/PortalForm';
import { PortalEnumField, PortalTextField } from '../components/PortalFields';
import PortalGroup from '../components/PortalGroup';
import PortalDragger from '../components/PortalDragger';
import StyledButton from '../../utils/components/StyledButton';
import Colors from '../../utils/constants/Colors';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useFocusEffect } from '@react-navigation/native';
import PortalAddOrCreate from '../components/PortalAddOrCreate';
import PortalSelector from '../components/PortalSelector';
import PortalDelete from '../components/PortalDelete';
import useCategoryChild from '../hooks/useCategoryChild';
import { PanelByID } from '../components/Panel';
import Layout from '../../utils/constants/Layout';
import { ExtraLargeText } from '../../utils/components/NewStyledText';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function SectionsScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const { id, menu_id } = route.params ?? {}

  const {
    is_deleted = false,
    name: currentName = '',
    internal_name: currentInternalName = '',
    is_visible: currentIsVisible = false,
    item_order: currentItemOrder = [],
    description: currentDescription = '',
    panel_id: currentPanelID = '',
  } = useCategoryChild('sections', id)

  useEffect(() => {
    if (is_deleted) navigation.goBack()
  }, [is_deleted])

  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(currentInternalName)
  const [description, setDescription] = useState(currentDescription)
  const [is_visible, setIsVisible] = useState(currentIsVisible)
  const [item_order, setItemOrder] = useState(currentItemOrder)
  const [panel_id, setPanelID] = useState(currentPanelID)

  const [showChildCategory, setShowChildCategory] = useState('')


  useFocusEffect(useCallback(() => {
    setPanelID(currentPanelID)
    setItemOrder(prev => equalArrays(prev, currentItemOrder) ? prev : currentItemOrder)
  }, [currentPanelID, currentItemOrder]))

  const isAltered = name !== currentName
    || internal_name !== currentInternalName
    || description !== currentDescription
    || is_visible !== currentIsVisible
    || panel_id !== currentPanelID
    || !equalArrays(item_order, currentItemOrder, true)

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setName(currentName)
          setInternalName(currentInternalName)
          setDescription(currentDescription)
          setIsVisible(currentIsVisible)
          setItemOrder(currentItemOrder)
          setPanelID(currentPanelID)
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

      const sectionRef = id ? restaurantRef.collection('Sections').doc(id) : restaurantRef.collection('Sections').doc()

      batch.set(sectionRef, {
        name,
        internal_name,
        is_visible,
        item_order,
        description,
        panel_id,
        portal_helper: {
          item_ids: item_order.filter(item => item.item_id).map(item => item.item_id),
          item_variant_ids: item_order.filter(item => item.variant_id).map(item => item.variant_id)
        },
        ...!id && {
          id: sectionRef.id,
          is_deleted: false,
          restaurant_id: restaurantRef.id,
        },
      }, { merge: true })

      if (menu_id && !id) {
        batch.set(restaurantRef.collection('Menus').doc(menu_id), {
          section_order: firebase.firestore.FieldValue.arrayUnion(sectionRef.id)
        }, { merge: true })
      }

      return batch.commit().then(() => {
        dispatch(doSuccessAdd())
        // if (menu_id) navigation.goBack()
        if (!id) navigation.setParams({ id: sectionRef.id })
      }).catch(error => {
        console.log('SectionsScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  const navigateToPanel = useCallback(() => {
    if (isAltered) dispatch(doAlertAdd('Unsaved changed', 'Save all changes before viewing this panel'))
    else navigation.navigate('Panels', { id: panel_id })
  }, [isAltered, panel_id])

  return (
    <>
      <PortalForm
        headerText={id ? `Edit ${name}` : 'Create section'}
        save={save}
        reset={reset}
        isAltered={isAltered}
        saveText='Save section'
      >
        <PortalEnumField
          text='Is this section visible?'
          subtext='You can hide sections while you work on them'
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
            subtext={`Used to distinguish between two sections with similar names`}
          />
          <PortalTextField
            text='Description'
            value={description}
            onChangeText={setDescription}
            placeholder='(optional)'
            subtext='Generally not needed'
          />

        </PortalGroup>


        <View style={{ height: 30 }} />

        <PortalGroup text='Items' isDrag>
          <PortalDragger
            category='items'
            child_ids={item_order}
            setChildIDs={setItemOrder}
            isAltered={isAltered}
          />
          <PortalAddOrCreate
            category='items'
            navigationParams={id ? { section_id: id, section_name: name } : null}
            isAltered={isAltered}
            addExisting={() => setShowChildCategory('items')}
          />
        </PortalGroup>

        <PortalGroup text='Panel'>
          <View style={{ marginHorizontal: Layout.marHor * 2 }}>
            {panel_id ? <TouchableOpacity onPress={navigateToPanel}><PanelByID panel_id={panel_id} /></TouchableOpacity> : <ExtraLargeText center style={{ marginTop: 30 }}>No panel selected</ExtraLargeText>}
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 30 }}>
              <StyledButton onPress={() => setShowChildCategory('panels')} text='Select panel' center color={Colors.purple} />
              <StyledButton color={Colors.red} disabled={!panel_id} text='Remove panel' center onPress={() => setPanelID('')} />
            </View>
          </View>
        </PortalGroup>

        {!!id && <PortalDelete category='sections' id={id} />}
      </PortalForm>

      {!!showChildCategory && <PortalSelector
        category={showChildCategory}
        selected={showChildCategory === 'items' ? item_order : panel_id}
        setSelected={showChildCategory === 'items' ? setItemOrder : setPanelID}
        parent='sections'
        close={() => setShowChildCategory('')}
      />}
    </>
  )
}


const styles = StyleSheet.create({

});


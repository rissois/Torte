import React, { useState, useEffect, useMemo, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import { useDispatch, } from 'react-redux';
import firebase from 'firebase';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doSuccessAdd } from '../../redux/actions/actionsSuccess';
import PortalForm from '../components/PortalForm';
import { PortalEnumField, PortalTextField } from '../components/PortalFields';
import PortalGroup from '../components/PortalGroup';
import PortalDragger from '../components/PortalDragger';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import PortalSelector from '../components/PortalSelector';
import PortalDelete from '../components/PortalDelete';
import useCategoryChild from '../hooks/useCategoryChild';
import StyledButton from '../../utils/components/StyledButton';
import Panel from '../components/Panel';
import PanelDisplay from '../components/PanelDisplay';
import PanelOrientation from '../components/PanelOrientation';
import { DISPLAY_TYPES, } from '../constants/panel';

const GROUP_TYPES = {
  top: 'top',
  bottom: 'bottom',
  large: 'large',
}


const getDisplayType = (bottom, large) => (
  large.length ? DISPLAY_TYPES.large
    : bottom.length ? DISPLAY_TYPES.double
      : DISPLAY_TYPES.single
)

const getOrientation = order => order.map(photo => photo.width)

const equalOrder = (o1, o2) => o1.length === o2.length && o1.every((photo, index) => photo.item_id === o2[index]?.item_id && photo.variant_id === o2[index].variant_id && photo.width === o2[index].width)
const combineOrderAndOrientation = (order, orientation) => orientation.map((width, index) => ({ ...order[index], width }))

export default function PanelsScreen({ navigation, route }) {
  /*
    If you just save the orientations separately, you can actually create backup photos to drop in for invalidated items (not in section / filtered out)
  */

  const dispatch = useDispatch()
  const { id, section_id, } = route.params ?? {}
  const restaurantRef = useRestaurantRef()

  const {
    is_deleted = false,
    name: currentName = '',
    internal_name: currentInternalName = '',
    is_visible: currentIsVisible = '',
    top_order: currentTopOrder = [],
    bottom_order: currentBottomOrder = [],
    large_order: currentLargeOrder = [],
    is_large_on_left: currentIsLargeOnLeft = true,
  } = useCategoryChild('panels', id)

  useEffect(() => {
    if (is_deleted) navigation.goBack()
  }, [is_deleted])

  const currentTopOrientation = useMemo(() => getOrientation(currentTopOrder), [currentTopOrder])
  const currentBottomOrientation = useMemo(() => getOrientation(currentBottomOrder), [currentBottomOrder])
  const currentLargeOrientation = useMemo(() => getOrientation(currentLargeOrder), [currentLargeOrder])
  const currentDisplayType = useMemo(() => getDisplayType(currentBottomOrder, currentLargeOrder), [currentBottomOrder, currentLargeOrder])

  const [name, setName] = useState(currentName)
  const [internal_name, setInternalName] = useState(currentInternalName)
  const [is_visible, setIsVisible] = useState(currentIsVisible)

  const [top_order, setTopOrder] = useState(currentTopOrder)
  const [bottom_order, setBottomOrder] = useState(currentBottomOrder)
  const [large_order, setLargeOrder] = useState(currentLargeOrder)

  const [topOrientation, setTopOrientation] = useState(currentTopOrientation.length ? currentTopOrientation : [1, 1, 1])
  const [bottomOrientation, setBottomOrientation] = useState(currentBottomOrientation.length ? currentBottomOrientation : [1, 1, 1])
  const [largeOrientation, setLargeOrientation] = useState(currentLargeOrientation.length ? currentLargeOrientation : [3])
  const [is_large_on_left, setIsLargeOnLeft] = useState(currentIsLargeOnLeft)

  const [displayType, setDisplayType] = useState(currentDisplayType)

  const [showPhotosForGroupType, setShowPhotosForGroupType] = useState('')

  const panel = useMemo(() => {
    let top = []
    let bottom = []
    let large = []
    switch (displayType) {
      case DISPLAY_TYPES.double: {
        bottom = combineOrderAndOrientation(bottom_order, bottomOrientation)
      }
      case DISPLAY_TYPES.single: {
        top = combineOrderAndOrientation(top_order, topOrientation)
        break;
      }
      case DISPLAY_TYPES.large: {
        large = combineOrderAndOrientation(large_order, largeOrientation)

        if (largeOrientation[0] !== 3) {
          top = combineOrderAndOrientation(top_order, [1])
          bottom = combineOrderAndOrientation(bottom_order, [1])
        }
        break;
      }
    }
    return { top_order: top, bottom_order: bottom, large_order: large }
  }, [top_order, topOrientation, bottom_order, bottomOrientation, large_order, largeOrientation, displayType])

  const isTopAltered = useMemo(() => {
    if (displayType === DISPLAY_TYPES.large) {
      if (largeOrientation[0] === 3) return false
      return !equalOrder(combineOrderAndOrientation(top_order, [1]), currentTopOrder)
    }
    return !equalOrder(combineOrderAndOrientation(top_order, topOrientation), currentTopOrder)
  }, [top_order, topOrientation, currentTopOrder, largeOrientation, displayType])

  const isBottomAltered = useMemo(() => {
    if (displayType === DISPLAY_TYPES.top) return false
    if (displayType === DISPLAY_TYPES.large) {
      if (largeOrientation[0] === 3) return false
      return !equalOrder(combineOrderAndOrientation(bottom_order, [1]), currentBottomOrder)
    }
    return !equalOrder(combineOrderAndOrientation(bottom_order, bottomOrientation), currentBottomOrder)
  }, [bottom_order, bottomOrientation, currentBottomOrder, largeOrientation, displayType])

  const isLargeAltered = useMemo(() => {
    if (displayType !== DISPLAY_TYPES.large) return false
    return !equalOrder(combineOrderAndOrientation(large_order, largeOrientation), currentLargeOrder)
  }, [large_order, largeOrientation, currentLargeOrder, displayType])

  const isLargeOnly = useMemo(() => displayType === DISPLAY_TYPES.large && largeOrientation[0] === 3, [largeOrientation, displayType])

  const isAltered = name !== currentName
    || internal_name !== currentInternalName
    || is_visible !== currentIsVisible
    || displayType !== currentDisplayType
    || (displayType === DISPLAY_TYPES.single && isTopAltered)
    || (displayType === DISPLAY_TYPES.double && (isTopAltered || isBottomAltered))
    || (displayType === DISPLAY_TYPES.large &&
      (
        isLargeAltered ||
        (
          largeOrientation[0] === 2 &&
          (
            is_large_on_left !== currentIsLargeOnLeft || isTopAltered || isBottomAltered
          )
        )
      )
    )

  const reset = () => {
    dispatch(doAlertAdd('Undo all changes?', undefined, [
      {
        text: 'Yes',
        onPress: () => {
          setName(currentName)
          setInternalName(currentInternalName)
          setIsVisible(currentIsVisible)
          setTopOrder(currentTopOrder)
          setBottomOrder(currentBottomOrder)
          setLargeOrder(currentLargeOrder)
          setTopOrientation(currentTopOrientation)
          setBottomOrientation(currentBottomOrientation)
          setIsLargeOnLeft(currentIsLargeOnLeft)
          setDisplayType(getDisplayType(currentBottomOrder, currentLargeOrder))
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
    switch (displayType) {
      case DISPLAY_TYPES.double: {
        if (!bottom_order.length || bottom_order.length < bottomOrientation.length) failed.push('Bottom row is missing photos')
        // No break, we want to check top as well
      }
      case DISPLAY_TYPES.single: {
        if (!top_order.length || top_order.length < topOrientation.length) failed.push(displayType === DISPLAY_TYPES.single ? 'Missing photos' : 'Top row is missing photos')
        break;
      }
      case DISPLAY_TYPES.large: {
        if (!large_order.length) failed.push('Missing large photo')

        if (largeOrientation[0] !== 3) {
          if (!top_order.length) failed.push('Missing top photo')
          if (!bottom_order.length) failed.push('Missing bottom photo')
        }
        break;
      }
    }
    if (failed.length) {
      dispatch(doAlertAdd('Incorrect fields', [...failed]))
    }
    else {
      const batch = firebase.firestore().batch()
      const panelRef = id ? restaurantRef.collection('Panels').doc(id) : restaurantRef.collection('Panels').doc()

      batch.set(panelRef, {
        name,
        internal_name,
        is_visible,
        is_large_on_left,
        ...panel,
        portal_helper: {
          // item_ids: Object.keys(panel).reduce((acc, row) => [...acc, panel[row].map(photo => photo.item_id)], []),
          // item_variant_ids: Object.keys(panel).reduce((acc, row) => [...acc, panel[row].map(photo => photo.variant_id)], [])
        },
        ...!id && {
          id: panelRef.id,
          restaurant_id: restaurantRef.id,
          is_deleted: false,
        },
      }, { merge: true })

      if (section_id && !id) {
        batch.set(restaurantRef.collection('Sections').doc(section_id), {
          panel_id: panelRef.id,
        }, { merge: true })
      }

      return batch.commit().then(() => {
        dispatch(doSuccessAdd())
        // if (meal_id) navigation.goBack()
        if (!id) navigation.setParams({ id: panelRef.id })
      }).catch(error => {
        console.log('PanelsScreen save error: ', error)
        dispatch(doAlertAdd('Unable to save new details', [error.message, 'Please contact Torte if the error persists']))
      })
    }
  }

  return (
    <>
      <PortalForm
        headerText={id ? `Edit ${name}` : 'Create panel'}
        save={save}
        reset={reset}
        isAltered={isAltered}
        saveText='Save panel'
      >
        <PortalEnumField
          text='Is this panel visible?'
          subtext='You can hide panels while you work on them'
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
        </PortalGroup>

        <PortalGroup text='Panel style'>
          <PanelDisplay displayType={displayType} setDisplayType={setDisplayType} />
        </PortalGroup>

        {displayType === DISPLAY_TYPES.large && (
          <PortalGroup text='Large photo'>
            <PanelOrientation is_large_on_left={is_large_on_left} setIsLargeOnLeft={setIsLargeOnLeft} orientation={largeOrientation} setOrientation={setLargeOrientation} displayType={displayType} />
            <PortalDragger
              category='photos'
              child_ids={large_order}
              setChildIDs={setLargeOrder}
              max={1}
              isAltered={isAltered}
            />
            <StyledButton center text='Add a photo' style={{ marginVertical: 30 }} onPress={() => setShowPhotosForGroupType(GROUP_TYPES.large)} />
          </PortalGroup>)}

        {!isLargeOnly && (
          <PortalGroup text={displayType === DISPLAY_TYPES.large ? 'Top photo' : displayType === DISPLAY_TYPES.single ? 'Photos' : 'Top photos'}>
            <PanelOrientation orientation={topOrientation} setOrientation={setTopOrientation} displayType={displayType} />
            <PortalDragger
              category='photos'
              child_ids={top_order}
              setChildIDs={setTopOrder}
              max={displayType === DISPLAY_TYPES.large ? 1 : topOrientation.length}
              isAltered={isAltered}
            />
            <StyledButton center text='Add a photo' style={{ marginVertical: 30 }} onPress={() => setShowPhotosForGroupType(GROUP_TYPES.top)} />
          </PortalGroup>)}

        {!isLargeOnly && displayType !== DISPLAY_TYPES.single && (
          <PortalGroup text={displayType === DISPLAY_TYPES.large ? 'Bottom photo' : 'Bottom photos'}>
            <PanelOrientation orientation={bottomOrientation} setOrientation={setBottomOrientation} displayType={displayType} />
            <PortalDragger
              category='photos'
              child_ids={bottom_order}
              setChildIDs={setBottomOrder}
              isAltered={isAltered}
              max={displayType === DISPLAY_TYPES.large ? 1 : bottomOrientation.length}
            />
            <StyledButton center text='Add a photo' style={{ marginVertical: 30 }} onPress={() => setShowPhotosForGroupType(GROUP_TYPES.bottom)} />
          </PortalGroup>)}

        <PortalGroup text='Preview'>
          <View style={{ marginHorizontal: Layout.marHor * 2, alignItems: 'center' }}>
            <Panel {...panel} is_large_on_left={is_large_on_left} />
          </View>
        </PortalGroup>

        {!!id && <PortalDelete category='panels' id={id} />}
      </PortalForm>

      {!!showPhotosForGroupType && <PortalSelector
        category={'items'}
        {
        ...showPhotosForGroupType === GROUP_TYPES.top ? {
          selected: top_order,
          setSelected: setTopOrder,
        } : showPhotosForGroupType === GROUP_TYPES.bottom ? {
          selected: bottom_order,
          setSelected: setBottomOrder,
        } : {
          selected: large_order,
          setSelected: setLargeOrder,
        }
        }
        parent='panels'
        close={() => setShowPhotosForGroupType('')}
      />}
    </>
  )
}



const styles = StyleSheet.create({

});


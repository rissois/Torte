import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import StyledButton from '../../utils/components/StyledButton';
import singularize from '../../utils/functions/singularize';
import Colors from '../../utils/constants/Colors';
import capitalize from '../../utils/functions/capitalize';
import { useNavigation } from '@react-navigation/native';
import { LargeText, MediumText } from '../../utils/components/NewStyledText';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';


const parents = {
  sections: 'menus',
  items: 'sections'
}

export default function PortalAddOrCreate({ category, navigationParams, isAltered, createNew, addExisting }) {
  const isUnsaved = isAltered || !navigationParams
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const [singularCategory] = useState(singularize(category))
  const [capitalizedCategory] = useState(capitalize(category))
  const [singularParent] = useState(singularize(parents[category]))

  return <View style={{ marginVertical: 30, }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
      <StyledButton
        center
        color={isUnsaved ? Colors.darkgrey : Colors.darkgreen}
        text={`Create a new ${singularCategory}`}
        onPress={() => {
          if (isUnsaved) {
            dispatch(doAlertAdd(
              isAltered ? 'You have unsaved changes' : `Unsaved ${singularParent}`,
              `Please save this ${singularParent} before creating a new ${singularCategory}`,
            ))
          }
          else if (createNew) {
            createNew()
          }
          else {
            navigation.navigate(capitalizedCategory, navigationParams)
          }
        }
        } />
      <StyledButton center color={Colors.purple} onPress={addExisting} text={`Add existing ${singularCategory}`} />
    </View>
    {
      // isUnsaved && <MediumText center style={{ marginTop: 12 }}>(you must save this {singularParent} before you can create a new {singularCategory})</MediumText>
    }
  </View>
}

/*
  renderPlaceholder: Component to be rendered underneath the hovering component
  onDragBegin: Called when row becomes active.
  onRelease: Called when active row touch ends.
  onDragEnd: Called after animation has completed. Returns updated ordering of data
  autoscrollThreshold: 	Distance from edge of container where list begins to autoscroll when dragging.
  autoscrollSpeed: 	Determines how fast the list autoscrolls.
  onRef:	Returns underlying Animated FlatList ref.
  animationConfig:	Configure list animations. See reanimated spring config
  activationDistance:	Distance a finger must travel before the gesture handler activates. Useful when using a draggable list within a TabNavigator so that the list does not capture navigator gestures.
  layoutInvalidationKey:	Changing this value forces a remeasure of all item layouts. Useful if item size/ordering updates after initial mount.
  onScrollOffsetChange:	Called with scroll offset. Stand-in for onScroll.
  onPlaceholderIndexChange:	Called when the index of the placeholder changes
  dragItemOverflow:	If true, dragged item follows finger beyond list boundary.
  dragHitSlop:	Enables control over what part of the connected view area can be used to begin recognizing the gesture. Numbers need to be non-positive (only possible to reduce responsive area).
  containerStyle:	Style of the main component.
  simultaneousHandlers:	References to other gesture handlers, mainly useful when using this component within a ScrollView. See Cross handler interactions.
*/

const styles = StyleSheet.create({

});


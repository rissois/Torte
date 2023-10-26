import React, { useEffect, useRef } from 'react';
import {
  Platform,
  UIManager,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Colors from '../constants/Colors';
import { ExtraLargeText, } from './NewStyledText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doSuccessRemove } from '../../redux/actions/actionsSuccess';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


export default function SuccessAlert(props) {
  const dispatch = useDispatch()
  const success = useSelector(state => state.success)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (success) {
      Animated.sequence([
        // Flicker if rapid changes
        Animated.timing(
          opacity,
          {
            toValue: 0,
            duration: 0,
            useNativeDriver: false

          }),
        Animated.timing(
          opacity,
          {
            toValue: 1,
            duration: 100,
            delay: 100,
            useNativeDriver: false

          }),
        Animated.timing(
          opacity,
          {
            toValue: 0,
            duration: 600,
            delay: 2500,
            useNativeDriver: false

          }),
      ]).start(() => dispatch(doSuccessRemove(success)))
    }
  }, [success])

  if (!success) return null
  // TURN OFF SHOW, then read in the new
  return <Animated.View style={[styles.box, { opacity }]}>
    <ExtraLargeText style={{ marginHorizontal: 20 }}>Save successful!</ExtraLargeText>
    <TouchableOpacity onPress={() => {
      dispatch(doSuccessRemove(success))
    }}>
      <MaterialCommunityIcons
        name='close-circle'
        size={30}
        color={Colors.white}
      />
    </TouchableOpacity>
  </Animated.View>
  // const dispatch = useDispatch()
  // const success = useSelector(state => state.success[0])
  // const [showSuccess, setShowSuccess] = useState(false)

  // useEffect(() => {
  //   LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  //   setShowSuccess(!!success)
  //   if (success) {
  //     setTimeout(() => {
  //       // dispatch clear
  //     }, 300)
  //   }
  // }, [success])

  // if (!success) return null
  // return <View style={{ position: 'absolute', top: 0, right: 0, margin: 30, backgroundColor: Colors.purple }}>

  // </View>
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.darkgreen,
    margin: 30,
    paddingVertical: 24,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: {
      height: 5,
      width: 3,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,

    elevation: 20,
    flexDirection: 'row',
  }
})
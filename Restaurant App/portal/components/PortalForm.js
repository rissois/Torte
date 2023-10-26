import React, { useState, useCallback } from 'react';
import {
  Keyboard,
  StyleSheet,
  View,
} from 'react-native';
import SafeView from '../../utils/components/SafeView';
import Layout from '../../utils/constants/Layout';
import Colors from '../../utils/constants/Colors';
import StyledButton from '../../utils/components/StyledButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../utils/components/Header';
import { ExtraLargeText, LargeText } from '../../utils/components/NewStyledText';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { MaterialIcons } from '@expo/vector-icons';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';

export default function PortalForm({
  isAltered,
  reset,
  save,
  headerText,
  subheader,
  children,
  isLocked,
  saveText,
  uploadProgress,
  right,
}) {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const { top: topInset } = useSafeAreaInsets()
  const [headerHeight, setHeaderHeight] = useState(null)
  const [buttonHeight, setButtonHeight] = useState(null)

  const [isSaving, setIsSaving] = useState(false)

  const backFn = useCallback(() => {
    if (isAltered) {
      dispatch(doAlertAdd('Leave without saving changes?', undefined, [
        {
          text: 'Yes',
          onPress: () => navigation.goBack()
        },
        {
          text: 'No'
        }
      ]))
    }
    else {
      navigation.goBack()
    }
  }, [isAltered])

  const handleSave = useCallback(async () => {
    try {
      Keyboard.dismiss()
      setIsSaving(true)
      await save()
    }
    catch (error) {
      console.log('Portal Form error: ', error)
      dispatch(doAlertAdd('Error saving', error.message))
    }
    finally {
      setIsSaving(false)
    }
  }, [save])

  return (
    <SafeView>
      <View onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}>
        <Header back backFn={backFn} right={right}>
          <ExtraLargeText center>{headerText}</ExtraLargeText>
        </Header>
        {subheader}
        {isLocked && <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'center', justifyContent: 'center', }}>
          <LargeText>Please contact Torte if you need to change any information with a </LargeText>
          <MaterialIcons
            name='lock-outline'
            size={30}
            color={Colors.white}
          />
        </View>}
      </View>

      <View style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps='handled'
          extraHeight={headerHeight + topInset + buttonHeight} // extra space for text below
          keyboardOpeningTime={100}
          ListHeaderComponent={() => <View style={{ height: 500, width: 500, backgroundColor: 'red' }} />}
        >
          <View style={{ marginHorizontal: Layout.marHor, paddingTop: buttonHeight, paddingBottom: Layout.scrollViewPadBot }}>
            {children}
          </View>
        </KeyboardAwareScrollView>


        <LinearGradient
          onLayout={({ nativeEvent }) => setButtonHeight(nativeEvent.layout.height)}
          colors={[Colors.background, Colors.background + 'DA', Colors.background + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.9, 1]}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingBottom: 20,
          }}>
          <StyledButton center disabled={!isAltered} color={Colors.red} text={isAltered ? 'Undo changes' : 'No changes'} onPress={reset} />
          <StyledButton center disabled={!isAltered} text={isAltered ? saveText || 'Save' : 'No changes'} onPress={handleSave} />
        </LinearGradient>
        {isSaving && <IndicatorOverlay text={`Saving...${uploadProgress ? `\nPhoto upload: ${uploadProgress}%` : ''}`} />}
      </View>
    </SafeView>
  )
}

const styles = StyleSheet.create({

});


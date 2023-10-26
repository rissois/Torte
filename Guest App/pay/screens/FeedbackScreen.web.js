import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  TextInput,
  ScrollView
} from 'react-native';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SuperLargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';


import BottomButton from '../../utils/components/BottomButton';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../utils/constants/Layout';
import { FontAwesome } from '@expo/vector-icons';

import {
  PanGestureHandler,
  TapGestureHandler,
  State,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { doBillEnd } from '../../redux/actions/actionsBill';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useMyID } from '../../utils/hooks/useUser';
import { useBillRef } from '../../utils/hooks/useBill';
import { selectMyFeedback } from '../../redux/selectors/selectorsBillUsers';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { setDoc, doc } from '@firebase/firestore';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


const MAX_CHARACTERS = 500
const STAR_SIZE = 29
const LINE_MARGIN = 4

export default function FeedbackScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const billRef = useBillRef()

  const myID = useMyID()

  const {
    overall: prev_overall = 0,
    service: prev_service = 0,
    food: prev_food = 0,
    comment: prev_comment = '',
  } = useSelector(selectMyFeedback)

  const isFeedbackExisting = prev_overall || prev_service || prev_food || prev_comment

  const [overall, setOverall] = useState(prev_overall)
  const [service, setService] = useState(prev_service)
  const [scrollHeight, setScrollHeight] = useState(null)
  const [food, setFood] = useState(prev_food)
  const [comment, setComment] = useState(prev_comment)
  const [isSaving, setIsSaving] = useState(false)

  const isFeedbackAltered = useMemo(() => isFeedbackExisting && (overall !== prev_overall || service !== prev_service || food !== prev_food || comment !== prev_comment), [overall, service, food, comment])
  const isNewFeedback = useMemo(() => !isFeedbackExisting && (overall || service || food || comment), [overall, service, food, comment])

  const submitFeedback = async () => {
    try {
      if (isFeedbackAltered || isNewFeedback) {
        setIsSaving(true)
        await setDoc(doc(billRef, 'BillFeedbacks', myID), {
          bill_id: billRef.id,
          comment,
          food,
          id: myID,
          overall,
          service,
          restaurant_id: billRef.parent.parent.id,
          user_id: myID,
        })
      }

      dispatch(doBillEnd())

      /*
      YOU NEED TO CLEAR THINGS
      */
    }
    catch (error) {
      dispatch(doAlertAdd('Unable to submit feedback', 'Sorry about that. Let us know if the issue persists.'))
      console.log('Feedback screen error: ', error)
    }
    finally {
      setIsSaving(false)
      navigation.navigate('Home')
    }

  }

  return (
    <SafeView unsafeColor={Colors.background}>
      {/* Interesting idea: TextInput Modal PopUp */}
      {/* <Modal
        visible={isEditingComment}
        animationType='slide'
        transparent={true}
        onShow={() => commentRef?.current?.focus()}
      >
        <SafeView unsafeColor={Colors.black + 'F9'}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Header left={<BackIcon name='close' backFn={() => setIsEditingComment(false)} />} />
            </View>
            <View style={{ marginHorizontal: Layout.marHor }}>
              <LargeText>Tell the restaurant more about your experience:</LargeText>
              <View style={{ marginVertical: 20, minHeight: Layout.window.height * 0.1, padding: 8, borderWidth: 1, borderColor: Colors.white, borderRadius: 8 }}>
                <TextInput
                  ref={commentRef}
                  style={{ color: Colors.white }}
                  multiline
                  placeholder="Add a comment"
                  placeholderTextColor={Colors.white + 'AA'}
                  onChangeText={text => {
                    if (text.length <= maxCharacters) {
                      setComment(text)
                    }
                  }}
                  keyboardAppearance='dark'
                  returnKeyType={'done'}

                  autoCorrect
                  selectTextOnFocus
                  autoFocus={false}
                  blurOnSubmit
                  onSubmitEditing={() => setIsEditingComment(false)}
                  value={comment}
                />
              </View>
              <View style={{ alignItems: 'flex-end', marginBottom: 30 }}>
                <DefaultText>Remaining characters: {maxCharacters - comment.length}</DefaultText>
              </View>

              <StyledButton center text='Done' onPress={() => setIsEditingComment(false)} />
            </View>
            <View style={{ flex: 1 }} />

          </KeyboardAvoidingView>
        </SafeView>
      </Modal> */}

      <ScrollView
        style={{ paddingHorizontal: Layout.marHor, height: Layout.window.height, paddingBottom: Layout.scrollViewPadBot }}
      // keyboardShouldPersistTaps='handled'
      >
        <View >
          <SuperLargeText center bold style={{ marginBottom: 12 }}>PAYMENT COMPLETE</SuperLargeText>
          <ExtraLargeText center>Thank you!</ExtraLargeText>
        </View>

        <MediumText bold center style={{ marginVertical: 30 }}>{isFeedbackExisting ? "You may edit your feedback if you'd like." : 'Please provide feedback for the restaurant!'}</MediumText>

        <View style={{ marginHorizontal: Layout.marHor * 0.5, }}>
          <StarRow title='Overall' stars={overall} setStars={setOverall} />
          <StarRow title='Service' stars={service} setStars={setService} />
          <StarRow title='Food' stars={food} setStars={setFood} />

          <View style={{ marginVertical: 20 }}>
            <LargeText>Comment</LargeText>
            <View style={{
              backgroundColor: Colors.darkgrey,
              paddingHorizontal: 10,
              paddingVertical: 20,
              borderRadius: 8,
              marginTop: 8,
            }}>
              <TextInput
                style={{
                  color: Colors.white,
                  fontSize: 17,
                  outline: 'none',
                  height: scrollHeight,

                }}
                placeholder='Add a comment?'
                placeholderTextColor={Colors.lightgrey}
                value={comment}
                onChangeText={setComment}
                onChange={e => setScrollHeight(e.target.scrollHeight)}
                multiline
                maxLength={MAX_CHARACTERS}
              />
            </View>
            <View style={{ alignItems: 'flex-end', }}>
              <DefaultText>Remaining characters: {MAX_CHARACTERS - comment.length}</DefaultText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 30 }}>
            {!!isFeedbackExisting && <TouchableOpacity onPress={() => {
              setOverall(prev_overall)
              setService(prev_service)
              setFood(prev_food)
              setComment(prev_comment)
            }}><DefaultText center>reset</DefaultText></TouchableOpacity>}
            <TouchableOpacity onPress={() => {
              setOverall(0)
              setService(0)
              setFood(0)
              setComment('')
            }}><DefaultText center>{isFeedbackExisting ? 'clear' : 'clear feedback'}</DefaultText></TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <BottomButton
        backgroundColor={Colors.purple}
        text={isNewFeedback ? 'Save feedback' : isFeedbackAltered ? 'Edit feedback' : 'Return home'}
        onPress={submitFeedback}
      />

      {!!isSaving && <IndicatorOverlay text='Saving feedback...' />}
    </SafeView>
  )
}

const StarRow = ({ title, stars, setStars, }) => {
  const [starWidth, setStarWidth] = useState(0)

  return <View style={{ marginTop: 12 }}>
    <LargeText >{title}</LargeText>
    <PanGestureHandler
      onGestureEvent={({ nativeEvent }) => {
        setStars(Math.max(Math.min(Math.ceil(nativeEvent.x / starWidth), 5), 0))
      }}
    >
      <View style={{ flexDirection: 'row', }}>
        {
          [...Array(5)].map((e, i) => {
            return <TapGestureHandler key={i} onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.BEGAN) {
                setStars(i + 1)
              }
            }}>
              <View onLayout={({ nativeEvent }) => setStarWidth(nativeEvent.layout.width)} style={{ flex: 1, alignItems: 'center', marginTop: 10, marginVertical: LINE_MARGIN, }}>
                <FontAwesome
                  name={i < stars ? 'star' : 'star-o'}
                  size={STAR_SIZE}
                  color={stars ? Colors.yellow : Colors.midgrey}
                />
              </View>
            </TapGestureHandler>
          })
        }
      </View>
    </PanGestureHandler>
  </View>
}



const styles = StyleSheet.create({

});
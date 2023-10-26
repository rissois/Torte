import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  TextInput,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SuperLargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';


import BottomButton from '../../utils/components/BottomButton';
import { useDispatch, useSelector } from 'react-redux';
import CenteredScrollView from '../../utils/components/CenteredScrollView';
import Layout from '../../utils/constants/Layout';
import { FontAwesome } from '@expo/vector-icons';

import {
  PanGestureHandler,
  TapGestureHandler,
  State,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import BackIcon from '../../utils/components/BackIcon';
import StyledButton from '../../utils/components/StyledButton';
import Header from '../../utils/components/Header';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { doBillEnd } from '../../redux/actions/actionsBill';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useMyID } from '../../utils/hooks/useUser';
import { useBillRef } from '../../utils/hooks/useBill';
import { selectMyFeedback } from '../../redux/selectors/selectorsBillUsers';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


const maxCharacters = 500
const starSize = 29
const lineMargin = 4

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

  const commentRef = useRef(null)
  const [overall, setOverall] = useState(prev_overall)
  const [service, setService] = useState(prev_service)
  const [food, setFood] = useState(prev_food)
  const [comment, setComment] = useState(prev_comment)
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const submitFeedback = async () => {
    const isFeedbackChanged = isFeedbackExisting && (overall !== prev_overall || service !== prev_service || food !== prev_food || comment !== prev_comment)
    const isNewFeedback = !isFeedbackExisting && (overall || service || food || comment)

    try {
      if (isFeedbackChanged || isNewFeedback) {
        setIsSaving(true)
        await billRef?.collection('BillFeedbacks').doc(myID).set({
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

  useModalCloser('Feedback', () => setIsEditingComment(false))

  return (
    <SafeView unsafeColor={Colors.background}>
      <Modal
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
                >
                  <DefaultText>{comment}</DefaultText>
                </TextInput>
              </View>
              <View style={{ alignItems: 'flex-end', marginBottom: 30 }}>
                <DefaultText>Remaining characters: {maxCharacters - comment.length}</DefaultText>
              </View>

              <StyledButton center text='Done' onPress={() => setIsEditingComment(false)} />
            </View>
            <View style={{ flex: 1 }} />

          </KeyboardAvoidingView>
        </SafeView>
      </Modal>

      <View style={{ flex: 1, }}>

        <CenteredScrollView
          main={<View style={{ marginHorizontal: Layout.marHor }}>
            <View style={{ marginBottom: 60 }}>
              <SuperLargeText center bold style={{ marginBottom: 12 }}>PAYMENT COMPLETE</SuperLargeText>
              <ExtraLargeText center>Thank you!</ExtraLargeText>
            </View>
            <MediumText bold center>{isFeedbackExisting ? "You may edit your feedback if you'd like." : 'Please provide feedback for the restaurant!'}</MediumText>
            <View style={{ marginHorizontal: Layout.marHor * 0.5 }}>
              <StarRow title='Overall' stars={overall} setStars={setOverall} />
              <StarRow title='Service' stars={service} setStars={setService} />
              <StarRow title='Food' stars={food} setStars={setFood} />
              <View style={{ marginVertical: 20 }}>
                <LargeText >Comment</LargeText>
                <TouchableOpacity onPress={() => {
                  setIsEditingComment(true)
                  commentRef?.current?.focus()
                }}>
                  <View style={{
                    backgroundColor: Colors.darkgrey,
                    paddingHorizontal: 10,
                    paddingVertical: 20,
                    borderRadius: 8,
                    marginTop: 8,
                  }}>
                    <DefaultText>
                      {isEditingComment ? '(editing)' : comment || 'Add a comment?'}
                    </DefaultText>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
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
          </View>}
        />

      </View>

      <BottomButton
        backgroundColor={Colors.purple}
        text='Return home'
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
              <View onLayout={({ nativeEvent }) => setStarWidth(nativeEvent.layout.width)} style={{ flex: 1, alignItems: 'center', marginTop: 10, marginVertical: lineMargin, }}>
                <FontAwesome
                  name={i < stars ? 'star' : 'star-o'}
                  size={starSize}
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
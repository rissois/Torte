import React, { useRef, } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
  Animated,
  Text
} from 'react-native';
import { DefaultText, SmallText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { useDispatch, } from 'react-redux';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import centsToDollar from '../../utils/functions/centsToDollar';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { doTransactPaySplit } from '../redux-actions/actionsPaySplit';
import plurarize from '../../utils/functions/plurarize';
import { useIsClaimingBillItem } from '../../utils/hooks/useFirestore';
import { useBillItemSplitDetails } from '../../utils/hooks/useBillItems';

const twoDigitWidth = 24 * PixelRatio.getFontScale()

const colorClaimed = Colors.green + 'AA'

export default function BillItemPan({ bill_item_id, onTap }) {
  const dispatch = useDispatch()
  const isSaving = useIsClaimingBillItem(bill_item_id)
  const [name, caption, subtotal, denom, availableLength, myClaimedLength, myPaidLength, myClaimedSubtotal, myPaidSubtotal] = useBillItemSplitDetails(bill_item_id)

  const background = availableLength ? Colors.darkgrey : myClaimedLength ? colorClaimed : Colors.background

  const translateX = useRef(new Animated.Value(0)).current
  // this is a useSelector to grab the specific item

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX < -50 && nativeEvent.velocityX < 0.1 && myClaimedLength) { // LEFT
        dispatch(doTransactPaySplit(bill_item_id, myClaimedLength - 1, denom))
      }
      else if (nativeEvent.translationX > 50 && nativeEvent.velocityX > -0.1 && availableLength) { //RIGHT
        dispatch(doTransactPaySplit(bill_item_id, myClaimedLength + 1, denom))
      }
      translateX.setValue(0)
    }
  }

  const onTapHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      onTap()
    }
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
      enabled={!!(availableLength || myClaimedLength) && !isSaving}
      activeOffsetX={[-15, 15]}
      failOffsetX={myClaimedLength ? [-30, 30] : availableLength ? [0, 30] : [-30, 0]}
    >
      <TapGestureHandler
        enabled={!!(availableLength || myClaimedLength) && !isSaving}
        maxDeltaX={5}
        shouldCancelWhenOutside
        onHandlerStateChange={onTapHandlerStateChange}
      >
        <View>
          <Animated.View
            style={[styles.billItem, {
              transform: [
                {
                  translateX: translateX
                },
              ],
              backgroundColor: translateX.interpolate({
                inputRange: [-100, -10, 0, 10, 100],
                outputRange: [Colors.red, background, background, background, Colors.darkgreen],
                extrapolate: 'clamp'
              })
            }]}>
            <View style={{ minWidth: twoDigitWidth, alignItems: 'center', opacity: Number(denom > 1) }}>
              {/* What if you did extra small text for paid? */}
              <SmallText center>{(availableLength || myClaimedLength) ? myClaimedLength : myPaidLength}</SmallText>
              <View style={{ paddingHorizontal: 2, marginTop: 1, paddingTop: 1, borderTopColor: Colors.white, borderTopWidth: 1 }}>
                <SmallText center>{denom}</SmallText>
              </View>
            </View>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <DefaultText numberOfLines={1} ellipsizeMode='tail'>{name}</DefaultText>
              {/* {!!(isVoided || caption) && <View style={{ flexDirection: 'row', flex: 1 }}> */}
              {/* {!!isVoided && <SmallText bold red>VOIDED </SmallText>} */}
              {!!caption && <SmallText numberOfLines={1} ellipsizeMode='tail' >{caption}</SmallText>}
              {/* </View>} */}
            </View>
            <DefaultText>{centsToDollar(myClaimedLength ? myClaimedSubtotal : subtotal)}</DefaultText>
            {denom > 1 && !!myClaimedLength && !!availableLength && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, backgroundColor: Colors.darkgreen }} />}
            {isSaving && <IndicatorOverlay horizontal text='Saving changes' />}
          </Animated.View>
          {!!myPaidLength && <DefaultText center style={{ color: Colors.green }}>^ Already paid for {plurarize(myPaidLength, 'portion', 'portions')} ({centsToDollar(myPaidSubtotal)})</DefaultText>}
        </View>
      </TapGestureHandler>
    </PanGestureHandler>
  )
}



const styles = StyleSheet.create({
  billItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 58,
  },
  voided: {
    textDecorationLine: 'line-through',
  }
});
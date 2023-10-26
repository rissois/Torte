import React, { useState, useCallback, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText } from '../../utils/components/NewStyledText';
import BoxGenerator from '../../components/BoxGenerator';
import { DISPLAY_TYPES, SELECTION_BORDER_WIDTH } from '../constants/panel';

export default function PanelOrientation({ orientation, setOrientation, setIsLargeOnLeft, is_large_on_left, displayType, }) {
  const isLarge = !!setIsLargeOnLeft

  const [isLeftMemory, setIsLeftMemory] = useState(orientation[1] !== 2)

  // useEffect(() => {
  //   setOrientation(prev => prev.length ? prev : displayType === DISPLAY_TYPES.large ? isLarge ? [2] : [1] : [1, 1, 1])
  // }, [])

  const setNumber = useCallback(number => {
    setOrientation(number === 1 ? [3] : number === 3 ? [1, 1, 1] : isLeftMemory ? [2, 1] : [1, 2])
  }, [isLeftMemory])

  return <View>
    {
      displayType === DISPLAY_TYPES.large
        ? isLarge && <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <TouchableOpacity onPress={() => {
            setIsLeftMemory(true)
            setIsLargeOnLeft(true)
            setOrientation([2])
          }}
            style={{ alignItems: 'center', borderWidth: SELECTION_BORDER_WIDTH, borderColor: orientation[0] === 2 && is_large_on_left ? Colors.purple : Colors.background, paddingVertical: 20, flex: 1 }}>
            <BoxGenerator top={[1]} bottom={[1]} left />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setOrientation([3])
          }}
            style={{ alignItems: 'center', borderWidth: SELECTION_BORDER_WIDTH, borderColor: orientation[0] === 3 ? Colors.purple : Colors.background, paddingVertical: 20, flex: 1 }}>
            <BoxGenerator large />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setIsLeftMemory(false)
            setIsLargeOnLeft(false)
            setOrientation([2])
          }}
            style={{ alignItems: 'center', borderWidth: SELECTION_BORDER_WIDTH, borderColor: orientation[0] === 2 && !is_large_on_left ? Colors.purple : Colors.background, paddingVertical: 20, flex: 1 }}>
            <BoxGenerator top={[1]} bottom={[1]} right />
          </TouchableOpacity>

        </View>
        : <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <LargeText style={{ marginRight: 20 }}>How many photos for this row?</LargeText>
            {
              [1, 2, 3].map(number => <Numbers key={number.toString()} number={number} isSelected={orientation.length === number} setNumber={setNumber} />)
            }
          </View>

          {
            orientation.length === 2 && <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 10 }}>
              <TouchableOpacity onPress={() => {
                setIsLeftMemory(true)
                setOrientation([2, 1])
              }}>
                <View style={{ borderWidth: SELECTION_BORDER_WIDTH, borderColor: isLeftMemory ? Colors.purple : Colors.background, padding: 20, }}>
                  <BoxGenerator top={[2, 1]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setIsLeftMemory(false)
                setOrientation([1, 2])
              }}>
                <View style={{ borderWidth: SELECTION_BORDER_WIDTH, borderColor: !isLeftMemory ? Colors.purple : Colors.background, padding: 20, }}>
                  <BoxGenerator top={[1, 2]} />
                </View>
              </TouchableOpacity>
            </View>
          }
        </View>
    }
  </View>
}

const Numbers = ({ number, isSelected, setNumber }) => {
  return <View style={{ marginHorizontal: 20 }}>
    <TouchableOpacity onPress={() => setNumber(number)}>
      <View style={{ alignItems: 'center', backgroundColor: isSelected ? Colors.white : Colors.background, height: 60, width: 60, justifyContent: 'center' }}>
        <ExtraLargeText bold style={{ color: isSelected ? Colors.background : Colors.white }}>{number}</ExtraLargeText>
      </View></TouchableOpacity></View>
}


const styles = StyleSheet.create({

});


import React, { useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import Colors from '../../utils/constants/Colors';
import useCategoryLiveAlphatical from '../hooks/useCategoryLiveAlphatical';
import { PortalRowSelectable } from './PortalRow';
import StyledButton from '../../utils/components/StyledButton';
import { LinearGradient } from 'expo-linear-gradient';
import equalArrays from '../../utils/functions/equalArrays';
import { ExtraLargeText } from '../../utils/components/NewStyledText';
import PortalSegment from './PortalSegment';

const parentChildFunctions = {
  periods: {
    meals: {
      checkIsSelected: (selected, id) => () => selected.includes(id),
      setSelected: (setSelected, id) => () => setSelected(prev => {
        if (prev.includes(id)) return prev.filter(meal_id => meal_id !== id)
        return [...prev, id]
      })
    }
  },
  meals: {
    menus: {
      checkIsSelected: (selected, id) => () => selected.some(({ menu_id }) => menu_id === id),
      setSelected: (setSelected, id, extraData) => () => setSelected(prev => {
        if (prev.some(({ menu_id }) => menu_id === id)) return prev.filter(({ menu_id }) => menu_id !== id)
        return [...prev, { menu_id: id, is_strict: false, ...extraData }]
      })
    }
  },
  menus: {
    sections: {
      checkIsSelected: (selected, id) => () => selected.includes(id),
      setSelected: (setSelected, id) => () => setSelected(prev => {
        if (prev.includes(id)) return prev.filter(p_id => p_id !== id)
        return [...prev, id]
      }),
    }
  },
  sections: {
    items: {
      checkIsSelected: (selected, id) => (variant_id = '') => selected.some(item => item.item_id === id && item.variant_id === variant_id),
      setSelected: (setSelected, id) => (variant_id = '') => setSelected(prev => {
        if (prev.some(item => item.item_id === id && item.variant_id === variant_id)) return prev.filter(item => item.item_id !== id || item.variant_id !== variant_id)
        return [...prev, { item_id: id, variant_id }]
      }),
    },
    panels: {
      checkIsSelected: (selected, id) => () => selected === id,
      setSelected: (setSelected, id) => () => setSelected(prev => prev === id ? '' : id)
    }
  },
  items: {
    modifiers: {
      checkIsSelected: (selected, id) => () => selected.includes(id),
      setSelected: (setSelected, id) => () => setSelected(prev => {
        if (prev.includes(id)) return prev.filter(p_id => p_id !== id)
        return [...prev, id]
      }),
    },
    items: {
      checkIsSelected: (selected, id) => (variant_id = '',) => selected.some(item => item.item_id === id && !item.option_id && item.variant_id === variant_id),
      setSelected: (setSelected, id,) => (variant_id = '') => setSelected(prev => {
        if (prev.some(item => item.item_id === id && !item.option_id && item.variant_id === variant_id)) return prev.filter(item => item.item_id !== id || item.option_id || item.variant_id !== variant_id)
        return [...prev, { item_id: id, option_id: '', variant_id }]
      }),
    },
    options: {
      checkIsSelected: (selected, id) => (variant_id = '',) => selected.some(item => !item.item_id && item.option_id === id && item.variant_id === variant_id),
      setSelected: (setSelected, id,) => (variant_id = '') => setSelected(prev => {
        if (prev.some(item => !item.item_id && item.option_id === id && item.variant_id === variant_id)) return prev.filter(item => item.item_id || item.option_id !== id || item.variant_id !== variant_id)
        return [...prev, { item_id: '', option_id: id, variant_id }]
      }),
    }
  },
  modifiers: {
    items: {
      checkIsSelected: (selected, id) => (variant_id = '',) => selected.some(item => item.item_id === id && !item.option_id && item.variant_id === variant_id),
      setSelected: (setSelected, id,) => (variant_id = '') => setSelected(prev => {
        if (prev.some(item => item.item_id === id && !item.option_id && item.variant_id === variant_id)) return prev.filter(item => item.item_id !== id || item.option_id || item.variant_id !== variant_id)
        return [...prev, { item_id: id, option_id: '', variant_id }]
      }),
    },
    options: {
      checkIsSelected: (selected, id) => (variant_id = '',) => selected.some(item => !item.item_id && item.option_id === id && item.variant_id === variant_id),
      setSelected: (setSelected, id,) => (variant_id = '') => setSelected(prev => {
        if (prev.some(item => !item.item_id && item.option_id === id && item.variant_id === variant_id)) return prev.filter(item => item.item_id || item.option_id !== id || item.variant_id !== variant_id)
        return [...prev, { item_id: '', option_id: id, variant_id }]
      }),
    }
  },
  panels: {
    items: {
      checkIsSelected: (selected, id) => () => selected.some(item => item.item_id === id),
      setSelected: (setSelected, id) => () => setSelected(prev => {
        if (prev.some(item => item.item_id === id)) return prev.filter(item => item.item_id !== id)
        return [...prev, { item_id: id, variant_id: '' }]
      })
    }
  },
  tables: {
    tables: {
      checkIsSelected: (selected, id) => () => selected === id,
      setSelected: (setSelected, id) => () => setSelected(prev => prev === id ? '' : id)
    }
  },
}


export default function PortalSelector({ category, selected, setSelected, parent, close, ...extraData }) {
  const [viewableCategory, setViewableCategory] = useState(category === 'upsells' || category === 'mods' ? 'options' : category)
  const [copy, setCopy] = useState(category === 'panels' ? selected : [...selected])
  const [buttonHeight, setButtonHeight] = useState(null)

  const isAltered = category === 'panels' ? copy !== selected : !equalArrays(copy, selected)

  const ids = useCategoryLiveAlphatical(viewableCategory)

  const functions = useMemo(() => parentChildFunctions[parent || category][viewableCategory], [parent, viewableCategory])

  const segmentDisplay = useMemo(() => {
    if (category !== 'upsells' && category !== 'mods') return null
    let options = 0
    let items = 0
    copy.forEach(obj => obj.item_id ? items++ : options++)
    return [`Options (${options})`, `Items (${items})`]
  }, [category, copy])

  return <View style={[StyleSheet.absoluteFill, styles.absolute]}>
    <View style={styles.popup}>
      <View style={{ paddingVertical: 20 }}>
        {
          (category === 'upsells' || category === 'mods') && <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
            <PortalSegment segments={['options', 'items']} segment={viewableCategory} values={segmentDisplay} setSegment={setViewableCategory} />
          </View>
        }
        <ExtraLargeText center>Select {category}</ExtraLargeText>
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          contentContainerStyle={{ paddingVertical: buttonHeight + 10, }}
          indicatorStyle='white'
          data={ids}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <PortalRowSelectable
              id={item}
              category={viewableCategory}
              checkIsSelected={functions.checkIsSelected(copy, item)}
              setSelected={functions.setSelected(setCopy, item, extraData)}
              isPhoto={parent === 'panels'}
            />)}
        />

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
          <StyledButton center color={Colors.red} text='Cancel' onPress={close} />
          <StyledButton center disabled={!isAltered} text={isAltered ? 'Save' : 'No changes'} onPress={() => {
            setSelected(copy)
            close()
          }} />
        </LinearGradient>
      </View>
    </View>
  </View>
}


const styles = StyleSheet.create({
  absolute: {
    flex: 1,
    backgroundColor: Colors.black + 'F1',
    zIndex: 99,
  },
  popup: {
    flex: 1,
    backgroundColor: Colors.background,
    margin: Layout.marHor * 2,
  },
});


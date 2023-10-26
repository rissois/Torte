import React, { } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'

export default function BoxGenerator(props) {
  let { top, bottom, left, right, large, unitWidth = Layout.window.width / 14, unitSpacer = 3 } = props

  function getSize(units, outer) {
    return unitWidth + (units - 1) * (unitWidth + unitSpacer) + (outer ? 2 * unitSpacer : 0)
  }


  const UnitView = ({ w = 1, h = 1, marginLeft, marginRight }) => <View style={{ height: getSize(h), width: getSize(w), backgroundColor: Colors.background, marginLeft: marginLeft ? unitSpacer : 0, marginRight: marginRight ? unitSpacer : 0 }} />

  return <View style={{ flexDirection: 'row', height: getSize(bottom || left || right || large ? 2 : 1, true), width: getSize(3, true), backgroundColor: Colors.softwhite, paddingTop: unitSpacer, paddingLeft: unitSpacer }}>
    {
      !!large && <UnitView w={3} h={2} />
    }
    {
      !!left && <UnitView w={2} h={2} marginRight />
    }
    <View style={{}}>
      {
        !!top && <View style={{ flexDirection: 'row', }}>
          {top.map((w, index) => <UnitView key={index} w={w} marginLeft={index} />)}
        </View>
      }
      {
        !!bottom && <View style={{ flexDirection: 'row', marginTop: unitSpacer }}>
          {bottom.map((w, index) => <UnitView key={index} w={w} marginLeft={index} />)}
        </View>
      }
    </View>
    {
      !!right && <UnitView w={2} h={2} marginLeft />
    }
  </View>
}


const BoxGenerator2 = (props) => {
  let { top, bottom, left, right, large } = props
  const unitWidth = Layout.window.width / 14
  const unitSpacer = 3

  function getSize(units) {
    return unitWidth + (units - 1) * (unitWidth + unitSpacer)
  }

  const UnitView = ({ w = 1, h = 1, }) => <View style={{ height: getSize(h), width: getSize(w), backgroundColor: Colors.background, alignSelf: 'center' }} />

  return <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', height: getSize(bottom || left || right || large ? 2 : 1) + 2 * unitSpacer, width: getSize(3) + 2 * unitSpacer, backgroundColor: Colors.softwhite, }}>
    {
      !!large && <UnitView w={3} h={2} />
    }
    {
      !!left && <UnitView w={2} h={2} />
    }
    <View style={{ justifyContent: 'space-evenly', flex: large || left || right ? 0 : 1, }}>
      {
        !!bottom && <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {bottom.map(w => <UnitView w={w} />)}
        </View>
      }
      {
        !!top && <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {top.map(w => <UnitView w={w} />)}
        </View>
      }
    </View>
    {
      !!right && <UnitView w={2} h={2} />
    }
  </View>
}

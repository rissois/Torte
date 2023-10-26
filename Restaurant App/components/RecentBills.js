import React, { useEffect, useState, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  FlatList
} from 'react-native';

import { MaterialIcons, } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useSelector, } from 'react-redux';
import centsToDollar from '../functions/centsToDollar';
import Segment from '../components/Segment';
import { dateToCalendar, dateToClock } from '../functions/dateAndTime';
import { HeaderText, LargeText, MainText } from './PortalText';
import useFilteredBills from '../hooks/useFilteredBills';
import { filterTableModes } from '../constants/filterTableModes';

const segmentValues = {
  all: 'All',
  closed: 'Closed',
  unpaid: 'Unpaid',
}

export default function RecentBills(props) {
  let { bills = {}, } = useSelector(state => state)
  let { closedBills, unpaidBills, notOpenBills } = useFilteredBills()

  const { filterTables = '' } = useSelector(state => state.employees[state.user] ?? {})

  let {
    closeDrawer
  } = props
  const [segment, setSegment] = useState(segmentValues.all)


  return <View style={{ backgroundColor: Colors.background, flex: 1 }}>

    <View style={{ height: 80, flexDirection: 'row', alignItems: 'center' }}>
      <View>
        <TouchableOpacity onPress={() => { closeDrawer() }}>
          <MaterialIcons
            name='arrow-back'
            size={38}
            color={Colors.white}
            style={{ marginLeft: 12 }}
          />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <Segment
          segments={Object.values(segmentValues)}
          segment={segment}
          setSegment={setSegment}
        />
      </View>
      <View style={{ opacity: 0 }}>
        <MaterialIcons
          name='arrow-back'
          size={38}
          color={Colors.white}
          style={{ marginRight: 12 }}
        />
      </View>
    </View>

    <MainText center>(SHOWING {filterTables === filterTableModes.self ? 'ONLY YOUR BILLS' : filterTables === filterTableModes.open ? 'AVAILABLE BILLS' : 'ALL BILLS'})</MainText>

    <FlatList
      data={segment === segmentValues.all ? notOpenBills : segment === segmentValues.closed ? closedBills : unpaidBills}
      keyExtractor={item => item}
      contentContainerStyle={{ paddingBottom: 50 }}
      ListEmptyComponent={() => <HeaderText center style={{ marginTop: 24 }}>No recent{segment === segmentValues.all ? '' : segment === segmentValues.closed ? ' closed' : ' unpaid'} bills</HeaderText>}
      renderItem={({ item: bill_id }) => {
        if (!bills[bill_id] || !Object.keys(bills[bill_id].groups).length) {
          return null
        }
        return <BillSummary bill_id={bill_id} key={bill_id} bill={bills[bill_id]} closeDrawer={closeDrawer} />
      }}
      ListFooterComponent={() => {
        if ((segment === segmentValues.all && notOpenBills.length) || (segment === segmentValues.closed && closedBills.length) || (segment === segmentValues.unpaid && unpaidBills.length)) {
          return <View>
            <LargeText center style={{ marginTop: 24 }}>No further bills</LargeText>
            {/* {employee.filterTables && <LargeText center style={{ marginTop: 24 }}>(filter mode is on)</LargeText>} */}
          </View>
        }
        return null
      }}
    />
  </View>

}

const BillSummary = ({
  bill_id,
  bill: {
    table_details: { code },
    ref_code = '',
    summary: { total = 0 },
    paid = {},
    timestamps: {
      created,
      server_marked_unpaid,
      server_marked_closed,
    }
  },
  closeDrawer
}) => {
  return <TouchableOpacity onPress={() => {
    closeDrawer(bill_id)
  }}><View style={{ flex: 1, flexDirection: 'row', marginHorizontal: 30, paddingHorizontal: 20, paddingVertical: 12, borderBottomColor: Colors.lightgrey, borderBottomWidth: 1 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.summary}>Table</Text>
        <Text style={styles.table}>{code}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: 50 }}>
        <Text style={styles.summary}>Bill #{ref_code}</Text>
        <Text style={styles.summary}>{dateToCalendar(created.toDate())}</Text>
        <Text style={styles.summary}>{dateToClock(created.toDate())} - {dateToClock((server_marked_closed || server_marked_unpaid).toDate())}</Text>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={styles.summary}>{centsToDollar(total)}</Text>
        {
          server_marked_unpaid && (total - (paid?.total ?? 0)) > 0 ? <>
            <Text style={[styles.summary, styles.unpaid]}>UNPAID</Text>
            <Text style={[styles.summary, styles.unpaid]}>{centsToDollar(total - (paid?.total ?? 0))}</Text>
          </> :
            <Text style={[styles.summary, { fontWeight: 'bold' }]}>PAID</Text>
        }
      </View>

    </View>
  </TouchableOpacity>
}



const styles = StyleSheet.create({
  footer: {
    marginTop: 30,
    fontSize: 26,
    color: Colors.white,
    textAlign: 'center'
  },
  summary: {
    fontSize: 22,
    color: Colors.white
  },
  unpaid: {
    fontWeight: 'bold',
    color: Colors.red
  },
  table: {
    fontSize: 48,
    color: Colors.white,
    fontWeight: 'bold'
  },
  segmentContainer: {
    width: '60%',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.darkgrey,
    borderRadius: 8,
  },
  segmentView: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // height: '100%'
  },
  segmentText: {
    paddingVertical: 8,
    color: Colors.white,
    fontSize: 18,
  },
});


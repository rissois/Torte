import firebase from '../config/Firebase';
const db = firebase.firestore();

import { identicalFilters, identicalModifications, identicalSpecifications } from '../functions/identicalCartItems';
import commaList from '../functions/commaList';
import filterTitles from '../constants/filterTitles';

/*
A word on servers editing a bill

Bills cannot be edited once the bill is already split evenly, fully paid, or marked as closed / unpaid

Items can be added, edited, or deleted:

An added item is not assigned to any seat. It is merged with any matching groups
A deleted item is simply removed from all references.
An edited item is also not assigned to any seat. This is largely because my code is crap, and should be changed. 
  It is also merged with with any matching groups.
  The original item is removed from all references.
  An edited item is automatically given a new billItem document
*/


export default async function transactEditBill(restaurant_id, bill_id, item = null, existing_id) {
  const billRef = db.collection('restaurants').doc(restaurant_id)
    .collection('bills').doc(bill_id)

  return db.runTransaction(async transaction => {

    const billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw 'Bill does not exist'
    }

    let delta_subtotal = 0

    let {
      groups: billGroups,
      pay: { seats: paySeats },
      summary: billSummary,
      timestamps,
      untaken_items,
      unseated_items,
      server_details,
      unpaid_items, } = billDoc.data()

    if (timestamps.server_marked_closed || timestamps.server_marked_unpaid || timestamps.auto_checkout || timestamps.restaurant_confirmed_unpaid) {
      throw 'Bill closed'
    }

    if (existing_id) {
      console.log('Deleting ' + existing_id + '...')

      const itemRef = billRef.collection('billItems').doc(existing_id)
      const itemDoc = await transaction.get(itemRef)
      let {
        group_id: old_group_id,
        seats: old_item_seats,
        users: old_item_users,
        total: old_total } = itemDoc.data()

      if (Object.keys(old_item_users.takenUnits).length || Object.keys(old_item_seats.takenUnits).some(seat_id => paySeats[seat_id]?.billUser.id)) {
        throw 'Already claimed'
      }

      /* ------
        SEATS
      ------ */

      console.log('Removing item from seats')
      /*
        Retrieve the affected seats
      */
      let seatRefs = Object.keys(old_item_seats.takenUnits).map(seat_id => billRef.collection('billSeats').doc(seat_id))
      let seatDocs = await Promise.all([
        ...seatRefs.map(ref => transaction.get(ref))
      ])
      if (seatDocs.findIndex(seatDoc => !seatDoc.exists) > -1) {
        if (seatDocs.length === 0) throw "Seat does not exist"
        throw "Some seats do not exist!";
      }

      seatDocs.forEach(seatDoc => {
        let seat_id = seatDoc.id
        console.log('Deleting item from seat ' + seat_id + '...')

        let {
          groups: seatGroups,
          summary: seatSummary } = seatDoc.data()

        let takenValue = old_item_seats.takenUnits[seat_id]?.reduce((acc, curr) => acc + curr, 0) ?? 0

        /*
          Remove the item from the seatGroups
        */
        if (seatGroups[old_group_id].item_ids.length === 1) {
          console.log('Deleting seat\'s only item from group')
          delete seatGroups[old_group_id]
          // Remove seat from billGroup's seat_ids
          billGroups[old_group_id].seat_ids.splice(billGroups[old_group_id].seat_ids.indexOf(seat_id))
        }
        else {
          console.log('Deleting item from seat group')
          // Subtract the item's num from the groups num for this seat
          let newNum = (seatsGroups[old_group_id].num * old_item_seats.denom) - (old_item_seats.takenUnits[seat_id].length * seatsGroups[old_group_id].denom)
          let newDenom = old_item_seats.denom * seatsGroups[old_group_id].denom
          let gcd = greatestCommonDivisor(newNum, newDenom)
          seatsGroups[old_group_id].num = newNum / gcd
          seatsGroups[old_group_id].denom = newDenom / gcd

          seatsGroups[old_group_id].total -= takenValue
          seatsGroups[old_group_id].item_ids.splice(seatsGroups[old_group_id].item_ids.indexOf(existing_id))
        }

        /*
          Remove the item's value from the seat subtotal and bill's pay.seats
        */
        seatSummary.subtotal -= takenValue
        transaction.update(seatDoc.ref, {
          groups: seatGroups,
          summary: seatSummary,
        })

        paySeats[seat_id].summary.subtotal -= takenValue
        paySeats[seat_id].overages.over_items -= takenValue - (old_total / old_item_seats.denom)
      })

      /* ------
        ITEM
      ------ */

      transaction.delete(itemRef)

      /* ------
        BILL
      ------ */

      /*
        Remove the item from the billGroups
      */
      let { unpaid, unseated, untaken } = billGroups[old_group_id].item_ids[existing_id]

      if (unpaid) {
        unpaid_items--
        billGroups[old_group_id].unpaid_items--
      }
      if (unseated) {
        unseated_items--
        billGroups[old_group_id].unseated_items--
      }
      if (untaken) {
        untaken_items--
        billGroups[old_group_id].untaken_items--
      }

      if (Object.keys(billGroups[old_group_id].item_ids).length === 1) {
        delete billGroups[old_group_id]
      }
      else {
        delete billGroups[old_group_id].item_ids[existing_id]
        billGroups[old_group_id].quantity--
        billGroups[old_group_id].total -= old_total
      }

      /*
        Remove the item's value from the bill
      */
      billSummary.subtotal -= old_total
      delta_subtotal -= old_total
    }






    /* -----------------------------------
        ADD ITEM TO SEATS AND BILL DOC
    -----------------------------------  */
    if (item) {
      console.log('Add item')

      /*
        Prepare new item variables
      */

      let individualPrice = item.total / item.num
      if (!item.ordered_by) {
        item.ordered_by = 'server'
      }
      let group_id = Object.keys(billGroups).find(group_key => {
        return itemFallsIntoExistingGroup(billGroups[group_key], item) && billGroups[group_key].price === individualPrice
      })

      console.log('Item falls into group: ', group_id)

      let quick_details = ''
      if (group_id) {
        quick_details = billGroups[group_id].quick_details
      }
      else {
        if (item.specifications) {
          quick_details = Object.keys(item.specifications).map(spec_id => {
            // item.specifications[spec_id].name + ': ' + 
            return commaList(item.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))
          }).join('; ')
        }

        if (item.filters) {
          if (quick_details.length) { quick_details += ' / ' }
          quick_details += commaList(Object.keys(item.filters).map(filter => filterTitles[filter]))
        }

        if (item.modifications) {
          if (quick_details.length) { quick_details += ' / ' }
          quick_details += commaList(Object.keys(item.modifications).map(mod_id => (item.modifications[mod_id].quantity > 1 ? item.modifications[mod_id].quantity + 'X ' : '') + item.modifications[mod_id].name))
        }
      }

      let baseGroup = {
        name: item.name,
        taxRate: item.taxRate,
        position: item.position,
        menu_reference: item.menu_reference,
        ...quick_details && { quick_details },
        ...item.specifications && { specifications: item.specifications },
        ...item.filters && { filters: item.filters },
        ...item.modifications && { modifications: item.modifications },
        ...item.comment && { comment: item.comment },
        ordered_by: item.ordered_by,
      }

      if (group_id) {
        console.log('add to matching group')
        /*
          Update an existing group with matching item
        */
        // item_ids will be filled in below
        billGroups[group_id].quantity += item.num
        billGroups[group_id].total += item.total
        billGroups[group_id].untaken_items += item.num
        billGroups[group_id].unseated_items += item.num
        billGroups[group_id].unpaid_items += item.num
      }
      else {
        console.log('add to new group')
        /*
          Create new group for item
        */
        group_id = generateRandomID(Object.keys(billGroups))
        billGroups[group_id] = {
          ...baseGroup,
          item_ids: {}, // Will be filled in below
          price: individualPrice,
          total: item.total,
          quantity: item.num,
          unseated_items: item.num,
          untaken_items: item.num,
          unpaid_items: item.num,
          seat_ids: []
        }
      }

      /* ------
        ITEM
      ------ */
      console.log('add item doc')

      for (let i = 0; i < item.num; i++) {
        let itemRef = billRef.collection('billItems').doc()

        billGroups[group_id].item_ids[itemRef.id] = {
          unpaid: true,
          unseated: true,
          untaken: true,
          ordered_by: item.ordered_by,
        }

        transaction.set(itemRef, {
          ...baseGroup,
          total: individualPrice,
          price: item.price,
          group_id,
          users: {
            denom: 1,
            freeUnits: [individualPrice],
            takenUnits: {},
            paidUnits: {}
          },
          seats: {
            denom: 1,
            freeUnits: [individualPrice],
            takenUnits: {},
            paidUnits: {}
          },
        })
      }



      /* ------
        BILL
      ------ */
      console.log('add item to bill')

      /*
        Add item to bill summary and "un"s
      */
      untaken_items += item.num
      unseated_items += item.num
      unpaid_items += item.num
      billSummary.subtotal += item.total
      delta_subtotal += item.total
    }

    let newTax = taxFromGroups(billGroups)

    transaction.update(billRef, {
      groups: billGroups,
      summary: {
        ...billSummary,
        subtotal: billSummary.subtotal,
        tax: newTax,
        total: billSummary.subtotal + newTax,
        final: billSummary.subtotal + newTax + billSummary.table_tip + billSummary.sum_tip,
      },
      'pay.seats': paySeats,
      untaken_items,
      unpaid_items,
      unseated_items,
    })

    const delta_tax = newTax - billSummary.tax
    const daysCollection = billRef.parent.parent.collection('restaurantDays')

    transaction.set(daysCollection.doc('cumulative'), {
      orders: {
        subtotals: firebase.firestore.FieldValue.increment(delta_subtotal),
        taxes: firebase.firestore.FieldValue.increment(delta_tax),
        server_changes: firebase.firestore.FieldValue.increment(delta_subtotal),
      }
    }, { merge: true })

    const startDayRef = (await daysCollection.where('created', "<=", timestamps.created || new Date()).orderBy('created', 'desc').limit(1).get()).docs[0].ref

    transaction.set(startDayRef, {
      orders: {
        subtotals: firebase.firestore.FieldValue.increment(delta_subtotal),
        taxes: firebase.firestore.FieldValue.increment(delta_tax),
        server_changes: firebase.firestore.FieldValue.increment(delta_subtotal),
      },
      servers: {
        [server_details.id || 'none']: {
          orders: {
            subtotals: firebase.firestore.FieldValue.increment(delta_subtotal),
            taxes: firebase.firestore.FieldValue.increment(delta_tax),
            server_changes: firebase.firestore.FieldValue.increment(delta_subtotal),
          },
        }
      },
    }, { merge: true })
  })
}



function generateRandomID(existingIDs = [], length = 6) {
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'
  let charactersLength = characters.length

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let newID = '';
    for (var i = 0; i < length; i++) {
      newID += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    if (!existingIDs.includes(newID)) {
      return newID
    }
  }
}

const itemFallsIntoExistingGroup = (group, item) => {
  // if (group.name === item.name) {
  //   console.log('ordered by match: ', group.ordered_by, item.ordered_by, group.ordered_by === item.ordered_by)
  //   console.log('position match: ', group.position, item.position, group.position === item.position)
  //   console.log('comment match: ', group.comment === item.comment)
  //   console.log('spec match: ', identicalSpecifications(group.specifications, item.specifications))
  //   console.log('filter match: ', identicalFilters(group.filters, item.filters))
  //   console.log('mod match: ', identicalModifications(group.modifications, item.modifications))
  // }

  // Does the position matter???
  // TAX RATES
  return group.name === item.name &&
    group.taxRate.name === item.taxRate.name &&
    group.taxRate.percent === item.taxRate.percent &&
    group.menu_reference.item_id === item.menu_reference.item_id &&
    group.menu_reference.section_id === item.menu_reference.section_id &&
    group.menu_reference.menu_id === item.menu_reference.menu_id &&
    group.ordered_by === item.ordered_by &&
    group.position === item.position &&
    group.comment === item.comment &&
    identicalSpecifications(group.specifications, item.specifications) &&
    identicalFilters(group.filters, item.filters) &&
    identicalModifications(group.modifications, item.modifications)
}

function binnedTaxesFromGroups(groups, binnedTaxes) {
  Object.keys(groups).forEach(group_id => {
    let group = groups[group_id]

    let percent = group.taxRate && group.taxRate.percent || 0

    if (percent > 0) {
      if (binnedTaxes[percent]) {
        binnedTaxes[percent] += group.total
      }
      else {
        binnedTaxes[percent] = group.total
      }
    }
  })
}

function taxFromGroups(groups) {
  let binnedTaxes = {}

  binnedTaxesFromGroups(groups, binnedTaxes)

  return taxFromBins(binnedTaxes)
}

function taxFromBins(binnedTaxes) {
  return Math.ceil(Object.keys(binnedTaxes).reduce((acc, percent) => {
    return acc + (binnedTaxes[percent] * percent / 100)
  }, 0))
}

function greatestCommonDivisor(x, y) {
  if ((typeof x !== 'number') || (typeof y !== 'number'))
    return false;
  x = Math.abs(x);
  y = Math.abs(y);
  while (y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
}
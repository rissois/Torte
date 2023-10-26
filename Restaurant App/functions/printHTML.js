import capitalize from "./capitalize";
import centsToDollar from "./centsToDollar";
import commaList from "./commaList";
import { dateToClock } from "./dateAndTime"

export function htmlTicket({
  ref_code = '',
  table_details,
  server_details,
  groups
}) {
  let group_text = ''
  const p_start = '<p style="margin: 4px 30px; ">'
  const p_end = `</p>`

  Object.keys(groups).forEach(group_id => {
    const group = groups[group_id]

    group_text += `<div style="margin: 30px 12px 0px; ">
    <p style="margin-bottom: 8px">${group.quantity}  ${group.name}</p>`

    if (group.filters) {
      Object.keys(group.filters).forEach(filter => {
        group_text += p_start + filterTitles[filter] + p_end
      })
    }
    if (group.specifications) {
      Object.keys(group.specifications).forEach(spec_id => {
        group_text += p_start + capitalize(group.specifications[spec_id].name) + ': ' +
          commaList(group.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))
          + p_end
      })
    }
    if (group.modifications) {
      Object.keys(group.modifications).forEach(mod_id => {
        group_text += p_start + (group.modifications[mod_id].quantity > 1 ? group.modifications[mod_id].quantity + 'X ' : '') + group.modifications[mod_id].name + p_end
      })
    }
    if (group.comment) {
      group_text += p_start + group.comment + p_end
      /// ${line}</p>
    }

    group_text += `</div>`
  })

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt</title>
      <style>
          @page { margin: 200px; } 
          body {
              font-size: 34px;
          }
          h1, h2 {
              text-align: center;
              line-height: 0.25;
          }
          p {
            margin: 0px;
          }
      </style>
  </head>
  <body style="margin: 150px 0px">
      <h1>${table_details.name || '(no table)'}</h1>
      <h2>Bill #${ref_code}</h2>
      <h2>${server_details.name || '(no server)'}</h2>
      <h2>printed ${dateToClock(new Date())}</h2>
      <div style="margin-top: 50px">
      ${group_text}
      </div>
  </body>
  </html>
`;
}

export function htmlOrders({
  ref_code = '',
  table_details,
  server_details,
  order_no,
}, itemsByPosition) {
  let item_text = ''
  const p_start = '<p style="margin: 4px 30px; ">'
  const p_end = `</p>`

  itemsByPosition.forEach(item => {

    item_text += `<div style="margin: 30px 12px 0px; ">
    <p style="margin-bottom: 8px">${item.num}  ${item.name}</p>`

    if (item.filters) {
      Object.keys(item.filters).forEach(filter => {
        item_text += p_start + filterTitles[filter] + p_end
      })
    }
    if (item.specifications) {
      Object.keys(item.specifications).forEach(spec_id => {
        item_text += p_start + capitalize(item.specifications[spec_id].name) + ': ' +
          commaList(item.specifications[spec_id].options.map(option => (option.quantity > 1 ? option.quantity + 'X ' : '') + option.name))
          + p_end
      })
    }
    if (item.modifications) {
      Object.keys(item.modifications).forEach(mod_id => {
        item_text += p_start + (item.modifications[mod_id].quantity > 1 ? item.modifications[mod_id].quantity + 'X ' : '') + item.modifications[mod_id].name + p_end
      })
    }
    if (item.comment) {
      item_text += p_start + item.comment + p_end
      /// ${line}</p>
    }

    item_text += `</div>`
  })

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt</title>
      <style>
          @page { margin: 200px; } 
          body {
              font-size: 34px;
          }
          h1, h2 {
              text-align: center;
              line-height: 0.25;
          }
          p {
            margin: 0px;
          }
      </style>
  </head>
  <body style="margin: 150px 0px">
      <h1>${table_details.name || '(no table)'}</h1>
      <h2>Bill #${ref_code}</h2>
      <h2>Order #${order_no}</h2>
      <h2>${server_details.name || '(no server)'}</h2>
      <h2>printed ${dateToClock(new Date())}</h2>
      <div style="margin-top: 50px">
      ${item_text}
      </div>
  </body>
  </html>
`;
}
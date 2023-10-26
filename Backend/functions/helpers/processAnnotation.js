/* eslint-disable no-throw-literal */
/**
 * Would be interesting if you could drag captions around... no too complicated
 * SHOW a predicted extra item (like a prefill of the missing item to make the summary work)
 * TODO Fast delete (grocery often repeated statements like TOTAL SAVINGS)
 * TODO Label discounts / sales and store as negative numbers
 * TODO: Machine Learning can probably do a better job, maybe without fullTextAnnotation than this.
* TODO: getBlockArea can be corrupted by large text (e.g. menu) in the background at different angle
*       should factor in most common / longest paragraphs
*/

// Captions: 3, 9 11, 12, 16, 20 (! discount with parentheses cannot be distinguished from other parenthetically prices like #@$)
const CONFIDENCE_THRESHOLD = 0.36;
// If starts $#s (can start w - or end .##) or is of form #s.## (can start with -)
// PRICE_LETTER_REGEX allows both non-decimals prices ($1) and prices followed by a single-letter code
// NOTE: The letter will automatically be stripped by the replace function
const PRICE_LETTER_REGEX = /(^(-)?\$(\d)+$)|(^(-)?\$(\d)+(\.\d\d)?(\s?[a-zA-Z])?$)|(^(-)?(\d)+\.\d\d(\s?[a-zA-Z])?$)/
const SINGLE_LETTER_REGEX = /^[a-zA-Z]$/
const END_LETTER_REGEX = /[a-zA-Z]+$/
const DIGITS_REGEX = /^\d+/
const FRACTION_REGEX = /^\d+\/\d+/
const NON_ALPHANUMERIC = /^\W+/
const QUANTITY_REGEX = /^\d+(\W)?$/
const MIDPOINT_ERROR_MARGIN = 0.15


/**
* Determine how the image is rotated
* Bounding boxes that are properly oriented are numbered
*     0 -------- 1
*     |   text   |
*     3 -------- 2
*
* @param {object} page First page returned from textDetection
* @returns {string} '0CCW' | '90CCW' | '180CCW' |'270CCW'
*/
const getDominantOrientation = page => {
    // const sumVertices = ({ x, y }) => x + y

    /**
    * @param {array} vertices Array of boundingBox vertices
    * @returns {string} '0CCW' | '90CCW' | '180CCW' |'270CCW'
    */
    const getBlockOrientation = (vertices) => {
        let centerX = 0
        let centerY = 0
        for (let i = 0; i < 4; i++) {
            centerX += vertices[i].x
            centerY += vertices[i].y
        }
        centerX /= 4
        centerY /= 4

        if (vertices[0].x < centerX) {
            if (vertices[0].y < centerY) return '0CCW'
            return '90CCW'
        }
        else if (vertices[0].y < centerY) return '270CCW'
        return '180CCW'

        /*
        * Determine orientation of boundingBox
        * REMINDER: The origin (0,0) is located in the top-left
        * The vertex 0 should be the closest to the origin; vertex 2 should be furthest
        * (using the sum of x & y as a proxy to sqrt(x^2 + y^2))
        */

        // const sum0 = sumVertices(vertices[0])
        // const sum1 = sumVertices(vertices[1])
        // const sum2 = sumVertices(vertices[2])
        // const sum3 = sumVertices(vertices[3])

        // if (Math.abs(sum2 - sum0) > Math.abs(sum1 - sum3)) {
        //     if (sum2 - sum0 > 0) return '0CCW'
        //     return '180CCW'
        // }
        // if (sum3 - sum1 > 0) return '90CCW'
        // return '270CCW'
    }

    /**
    * Determine orientation of boundingBox
    * REMINDER: The origin (0,0) is located in the top-left
    * The vertex 0 should be the closest to the origin; vertex 2 should be furthest
    * (using the sum of x & y as a proxy to sqrt(x^2 + y^2))
    *
    * @param {array} vertices Array of boundingBox vertices
    * @returns {number} 
    */
    const getBlockArea = vertices => {
        const [top, bottom, left, right] = vertices.reduce((bounds, vertex) => {
            let copy = [...bounds]
            if (vertex.x < copy[0]) copy[0] = vertex.x
            if (vertex.x > copy[1]) copy[1] = vertex.x
            if (vertex.y < copy[2]) copy[2] = vertex.y
            if (vertex.y > copy[3]) copy[3] = vertex.y
            return copy
        }, [Infinity, 0, Infinity, 0,])
        return (bottom - top) * (right - left)
    }

    const orientations = page.blocks
        // Determine orientation and area of each block
        .map(block => (
            {
                orientation: getBlockOrientation(block.boundingBox.vertices),
                area: getBlockArea(block.boundingBox.vertices)
            }
        ))
        // Sum the areas for all orientations
        .reduce((acc, block) => {
            return { ...acc, [block.orientation]: acc[block.orientation] + block.area }
        }, { '0CCW': 0, '90CCW': 0, '180CCW': 0, '270CCW': 0, })


    return Object.keys(orientations).reduce((biggest, orientation) => orientations[orientation] > orientations[biggest] ? orientation : biggest)
}

/**
* Derive the core information required for each paragraph
*
* @param {object} page First page returned from textDetection
* @param {number} pageHeight 
* @param {number} pageWidth 
* @param {string} dominantOrientation '0CCW' | '90CCW' | '180CCW' |'270CCW'
* @returns {array}
*/
const getParagraphDimensions = (page, pageHeight, pageWidth, dominantOrientation) => {
    /*
      Extract the core details to each paragraph and sort them by the top line
    */

    let paragraphDimensions = []
    page.blocks.forEach(block => {
        block.paragraphs.forEach(paragraph => {
            let vertices = fixVertices(paragraph.boundingBox.vertices, pageHeight, pageWidth, dominantOrientation)
            let area = 0
            if (isProperOrientation(vertices)) {
                let avgWordHeight = paragraph.words.reduce((sum, word) => {
                    const wordVertices = word.boundingBox.vertices
                    // Rather than fixVertices, just hardcoded
                    if (dominantOrientation === '0CCW') return sum + wordVertices[3].y - wordVertices[0].y
                    if (dominantOrientation === '90CCW') return sum + wordVertices[3].x - wordVertices[0].x
                    if (dominantOrientation === '180CCW') return sum + wordVertices[0].y - wordVertices[3].y
                    if (dominantOrientation === '270CCW') return sum + wordVertices[0].x - wordVertices[3].x
                }, 0) / paragraph.words.length

                let left = Math.min(vertices[0].x, vertices[3].x)
                let right = Math.max(vertices[1].x, vertices[2].x)
                let top = Math.min(vertices[0].y, vertices[1].y)
                let bottom = Math.max(vertices[2].y, vertices[3].y)
                let height = bottom - top
                let width = right - left
                area = width * height

                paragraphDimensions.push({
                    // need area and average of Ys for top and bottom
                    vertices,
                    area,
                    top,
                    bottom,
                    height,
                    width,
                    left,
                    right,
                    avgWordHeight,
                    slant: calculateSlant(vertices),
                })
            }
        })
    })

    return paragraphDimensions.sort((a, b) => { return a.top - b.top })
}

/**
* Combine any paragraphs into "rows" with >50% vertical overlap
*
* @param {array} paragraphDimensions 
* @returns {array} 
*/
const createRows = paragraphDimensions => {
    let rowDimensions = []
    let currentParagraph = null

    paragraphDimensions.map(paragraph => {
        if (!!currentParagraph && paragraph.top < currentParagraph.bottom) {
            // let fullOverlap = block.bottom < blockBounds[index].bottom
            let percentOverlap1 = (paragraph.top - currentParagraph.bottom) / (currentParagraph.top - currentParagraph.bottom)
            let percentOverlap2 = (paragraph.top - currentParagraph.bottom) / (paragraph.top - paragraph.bottom)
            if (percentOverlap1 > 0.5 || percentOverlap2 > 0.5) {
                currentParagraph.top = Math.min(currentParagraph.top, paragraph.top)
                currentParagraph.bottom = Math.max(currentParagraph.bottom, paragraph.bottom)
                currentParagraph.paragraphs.push(paragraph)
            }
            else {
                rowDimensions.push({
                    top: paragraph.top,
                    bottom: paragraph.bottom,
                    paragraphs: [paragraph],
                })
                currentParagraph = rowDimensions[rowDimensions.length - 1]
            }
        }
        else {
            rowDimensions.push({
                top: paragraph.top,
                bottom: paragraph.bottom,
                paragraphs: [paragraph],
            })
            currentParagraph = rowDimensions[rowDimensions.length - 1]
        }
    })

    return rowDimensions
}


/**
* For groups with more than one paragraph, append the X-value at which the two largest intersect
* in case a fold (common in industry) creates an inflection point (e.g. left paragraph moves up / while right move down \)
*
* @param {array} rowDimensions 
* @returns (nothing, rowDimensions is altered by reference)
*/
const addInterceptLine = (rowDimensions, pageWidth) => {
    rowDimensions.forEach(group => {
        group.slants = []

        // Trim multiple paragraphs into two side-by-side "SLANTS"
        // Combine any paragraphs with >70% horizontal overlap
        group.paragraphs.sort((a, b) => b.area - a.area).map(para => {
            let absorbed = false

            group.slants.map(slant => {
                if (!(para.left > slant.right || para.right < slant.left)) {
                    let overlapLeft = Math.max(para.left, slant.left)
                    let overlapRight = Math.min(para.right, slant.right)
                    let overlapWidth = overlapRight - overlapLeft

                    if (overlapWidth > 0.7 * para.width) {
                        absorbed = true
                        slant.left = Math.min(para.left, slant.left)
                        slant.right = Math.max(para.right, slant.right)
                    }
                }
            })

            if (!absorbed && group.slants.length < 2) {
                group.slants.push({
                    left: para.left,
                    right: para.right,
                    slant: para.slant,
                    vertices: para.vertices,
                    avgWordHeight: para.avgWordHeight,
                })
            }
        })
        group.slants.sort((a, b) => a.left - b.left)

        if (group.slants.length < 2) {
            group.interceptLine = 0
        }
        else {
            const left = group.slants[0]
            const right = group.slants[1]

            const avgLeftSlant = calculateSlant(left.vertices) // SHOULD YOU USE THE AVERAGE?
            const avgRightSlant = calculateSlant(right.vertices) // SHOULD YOU USE THE AVERAGE?
            const wordHeight = Math.min(left.avgWordHeight, right.avgWordHeight)

            // Receipt text is generally vertically aligned by the first (top) line of each paragraph
            // So the Point of Intersection is calculated drawing out the left slant from vertex 1 and right slant from vertex 0
            // Bottom vertices are used when top lines do not appear aligned (top y-distance is >60% of wordHeight AND top y-distance is more than 30% wordHeight larger than bottom y-distance)
            // (Note that this is arbitrary, and should probably be empirically determined)

            const deltaTop = Math.abs(left.vertices[1].y - right.vertices[0].y)
            const deltaBottom = Math.abs(left.vertices[2].y - right.vertices[3].y)

            const poi = (deltaTop > 0.6 * wordHeight && deltaTop > deltaBottom + (0.3 * wordHeight))
                ? pointOfIntersection(avgLeftSlant, left.vertices[2], avgRightSlant, right.vertices[3])
                : pointOfIntersection(avgLeftSlant, left.vertices[1], avgRightSlant, right.vertices[0])

            if (poi < 0) {
                group.interceptLine = 0
            }
            else if (poi > pageWidth) {
                group.interceptLine = pageWidth
            }
            else {
                group.interceptLine = poi
            }
        }
    })
}


/**
* Loop back through paragraphs and collect all words
* Calculate each words position on the Y-intercept
* NOTE: calculateYIntercept corrects for the interceptLine above
*
* @param {object} page First page returned from textDetection
* @param {array} rowDimensions 
* @param {string} dominantOrientation '0CCW' | '90CCW' | '180CCW' |'270CCW'
* @returns {array}
*/
const extractWords = (page, rowDimensions, dominantOrientation) => {
    const pageHeight = page.height
    const pageWidth = page.width

    let wordList = []
    page.blocks.forEach((block, bindex) => {
        block.paragraphs.forEach((paragraph, pindex) => {
            let paraVertices = fixVertices(paragraph.boundingBox.vertices, pageHeight, pageWidth, dominantOrientation)
            if (isProperOrientation(paraVertices)) {
                // Find group based on vertical position
                const matchedGroup = rowDimensions.find(group => group.top <= paraVertices[0].y
                    && group.bottom >= paraVertices[3].y)

                let paragraphIntercept = 0
                let paragraphSlant = 0
                if (matchedGroup) {
                    if (matchedGroup.interceptLine) {
                        paragraphIntercept = matchedGroup.interceptLine
                    }

                    if (matchedGroup.slants.length === 1) {
                        paragraphSlant = matchedGroup.slants[0].slant
                    }
                    else if (matchedGroup.slants.length > 1) {
                        // Use MOST SIMILAR slant
                        let xFromLeft = ((paraVertices[0].x + paraVertices[3].x) / 2) - matchedGroup.slants[0].right // compare left bound to right slant bound
                        let xFromRight = matchedGroup.slants[1].left - ((paraVertices[1].x + paraVertices[2].x) / 2) // compare right bound to left slant bound
                        if (xFromLeft > xFromRight) {
                            paragraphSlant = matchedGroup.slants[1].slant
                        }
                        else {
                            paragraphSlant = matchedGroup.slants[0].slant
                        }
                    }
                }

                paragraph.words.forEach((word, windex) => {
                    if (word.confidence > CONFIDENCE_THRESHOLD || !word.confidence) {
                        let wordBreak = null;
                        let wordArr = []

                        // Form words from each symbol and note the type of break for the final character
                        word.symbols.forEach(symbol => {
                            wordArr.push(symbol.text);
                            if (symbol.property && symbol.property.detectedBreak) {
                                wordBreak = symbol.property.detectedBreak.type
                            }
                        })

                        // console.log(wordArr, pindex, bindex, windex)

                        if (!wordArr.length) return

                        let wordVertices = fixVertices(word.boundingBox.vertices, pageHeight, pageWidth, dominantOrientation)

                        // NOTE: This assumes directionality on the photo
                        if (wordVertices[0].x < wordVertices[2].x && wordVertices[0].y < wordVertices[2].y) {
                            wordList.push({
                                confidence: word.confidence ? word.confidence : 0,
                                break: wordBreak,
                                word: wordArr.join(''),
                                top: calculateYintercept(wordVertices[0], wordVertices[1], paragraphSlant, paragraphIntercept),
                                bottom: calculateYintercept(wordVertices[3], wordVertices[2], paragraphSlant, paragraphIntercept),
                                left: wordVertices[0].x
                            })
                        }
                    }
                })
            }
        })
    })
    return wordList
}

/**
* Group words based on their vertical position and sort from left to right (precusor of a "line")
*
* @param {array} wordList 
* @returns {array} lines
*/
const binWords = (wordList) => {
    let lines = []

    wordList.forEach((word, index) => {
        // Determine if existing line's midpoint is between the top and bottom of this word
        let lineMatchIndex = -1, lineErrorIndex = -1
        for (let i = lines.length - 1; i >= 0 && !~lineMatchIndex; i--) {
            const midpoint = lines[i].midpoint
            if (midpoint > word.top && midpoint < word.bottom) lineMatchIndex = i
            else {
                // Backup with extra padding if no perfect match found
                const error = (word.bottom - word.top) * MIDPOINT_ERROR_MARGIN
                if (midpoint > word.top - error && midpoint < word.bottom + error) lineErrorIndex = i
            }
        }
        if (!~lineMatchIndex) lineErrorIndex = lineMatchIndex

        if (!~lineMatchIndex) {
            lines.push(
                {
                    words: [word],
                    yPositions: [word.top, word.bottom],
                    midpoint: (word.top + word.bottom) / 2,
                    isPriced: false,
                    isQuantified: false,
                }
            )
        }
        else {
            lines[lineMatchIndex].words.push(word)
            lines[lineMatchIndex].yPositions.push(word.top, word.bottom)
            // lines[lineMatchIndex].midpoint = arrayAverage(lines[lineMatchIndex].yPositions)
        }
    })

    // Sort lines by their Y position
    lines.sort((a, b,) => a.midpoint - b.midpoint)


    // Sort words by their X position
    lines.forEach((line, index) => {
        lines[index].words = line.words.sort((a, b) => a.left - b.left)
    })


    // Combines words erroneously separated due to punctuations and perform some price checks
    // Preceding text will have {break: null}
    // See: https://googleapis.dev/nodejs/vision/latest/google.cloud.vision.v1.html#.BreakType
    // NOTE: uncertain whether is required only for API Explorer output, or also for @google-cloud/vision
    lines.forEach((line, index) => {
        let consecutiveWords = [] // Collect consecutive words
        let newWords = [] // Collect merged final words

        line.words.forEach((word, wordIndex) => {
            // Prevents adding a word after the price (like a grocery store code)
            // if (line.isPriced) return

            consecutiveWords.push(word)

            // Combine and commit block of consecutive words to newWords
            // Skip if word break is null (precedes punctuation or $ in case of accidental split)
            if (wordIndex === line.words.length - 1 || (word.break !== null && word.word !== '$')) {
                let combined = '';
                let confidence = 1;

                consecutiveWords.map(consec => {
                    combined = combined + consec.word // running string of consecutive words
                    confidence = Math.min(consec.confidence, confidence) // minimum confidence
                })

                // Line is quantified if it starts with number
                if (QUANTITY_REGEX.test(line.words[0].word) || FRACTION_REGEX.test(line.words[0].word)) {
                    line.isQuantified = true
                }

                // Line is priced ONLY if this is the last word in the line, OR if this is the second to last word with a single character after
                if (wordIndex === line.words.length - 1 || (wordIndex === line.words.length - 2 && line.words[line.words.length - 1].word.length < 2))
                    if (PRICE_LETTER_REGEX.test(combined)) {
                        line.isPriced = true

                        // Remove grocery store code appended directly to price
                        if (END_LETTER_REGEX.test(combined)) combined = combined.slice(0, -1)
                    }

                newWords.push({
                    break: word.break, // last break encountered
                    confidence: confidence,
                    word: combined,
                })
                consecutiveWords = [];

            }
        })

        line.words = newWords
    })

    return lines
}

/**
* 
*
* @param {array} lines Array of lines returned from binWords

* @returns {array} Line items (any line ending with a price)
*/
const extractPricedItems = (lines) => {
    let firstPriceIndex = -1
    let lastPriceIndex = -1
    let numPriced = 0
    let numQuantified = 0
    let lastQuantifiedIndex = -1

    // Determine the index bounds for quantified lines and prices lines
    lines.forEach((line, index) => {
        if (line.isPriced) {
            if (!~firstPriceIndex) firstPriceIndex = index
            lastPriceIndex = index
            numPriced++
            if (line.isQuantified) {
                numQuantified++
                lastQuantifiedIndex = index
            }
        }
    })
    if (!firstPriceIndex) return pricedItems


    let pricedItems = [] // Carries only essential lines with calculated properties
    const isPricedItemsQuantified = numQuantified > 2 || (numQuantified && numPriced < 6)
    for (let i = firstPriceIndex, unpricedLines = []; i <= lastPriceIndex; i++) {
        const line = lines[i]

        if (line.isPriced) {
            // The last unpriced line sometimes "drops-down" to this line
            // eslint-disable-next-line no-loop-func
            const dropDownLine = (() => {
                // Do not use last unpriced line if this line is quantified and priced, or if it is labeled
                if (unpricedLines.length && !(isPricedItemsQuantified && line.isQuantified) && !summaryRegex(line.words.map(({ word }) => word).join(' '))) {
                    // This line is only a price
                    if (line.words.length === 1) {
                        return unpricedLines.pop()
                    }

                    // This line is missing a quantity
                    if (isPricedItemsQuantified && (i + firstPriceIndex < lastQuantifiedIndex) && !line.isQuantified && unpricedLines[unpricedLines.length - 1].isQuantified) {
                        return unpricedLines.pop()
                    }

                    // This line has an insufficient amount of alphanumeric characters
                    let alphanumerics = 0
                    let characters = 0
                    for (let i = line.isQuantified ? 1 : 0; i < line.words.length - (line.isPriced ? 1 : 0); i++) {
                        const { word } = line.words[i]
                        for (let j = 0; j < word.length; j++) {
                            let ascii = word.charCodeAt(j)
                            if (ascii === 32) return null // ignore spaces
                            characters++
                            if ((ascii >= 65 && ascii <= 90) || (ascii >= 97 && ascii <= 122)) {
                                alphanumerics++
                            }
                        }
                    }
                    if (alphanumerics < 3 || alphanumerics / characters < 0.5) {
                        return unpricedLines.pop()
                    }
                }
                return null
            })()

            // Add unpricedLines as caption to last line item
            if (unpricedLines.length) {
                const captionsArray = unpricedLines.map(l => l.words.map(({ word }) => word).join(' '))

                pricedItems[pricedItems.length - 1].captions = captionsArray
            }

            // Create the line Item
            {
                let quantity = 1
                let nameArray = []
                let cents = ''
                let confidence = 1 // Math.min for each word

                if (dropDownLine) {
                    for (let i = 0; i < dropDownLine.words.length; i++) {
                        let { word } = dropDownLine.words[i]

                        if (!i && dropDownLine.isQuantified && !FRACTION_REGEX.test(word)) {
                            quantity = word.replace(NON_ALPHANUMERIC, '')
                        }
                        else {
                            nameArray.push(word)
                        }
                    }
                }

                for (let i = 0; i < line.words.length; i++) {
                    let { word } = line.words[i]

                    if (!dropDownLine && !i && line.isQuantified && !FRACTION_REGEX.test(word)) {
                        quantity = word.replace(NON_ALPHANUMERIC, '')
                    }
                    else if (i === line.words.length - 1) {
                        cents = Math.round(100 * parseFloat(word.replace(/[^\d.-]/g, '')))
                    }
                    else {
                        nameArray.push(word)
                    }
                }

                let name = nameArray.join(' ')
                if (!name && firstPriceIndex) name = lines[firstPriceIndex - 1].words.map(({ word }) => word).join(' ')

                // Limit number of items to 10 (sometimes get dates for wines, etc.)
                if (quantity > 10) {
                    quantity = 1
                    name = quantity + ' ' + name
                }


                if (cents) pricedItems.push({
                    quantity: parseInt(quantity),
                    name,
                    cents,
                    confidence,
                    label: summaryRegex(name), // subtotal, tax, total, or null
                    isAfterLastQuantified: isPricedItemsQuantified && i === lastQuantifiedIndex + 1,
                    captions: []
                })
            }

            unpricedLines = []
        }
        else {
            unpricedLines.push(line)

            if (i === lastPriceIndex) {
                const captionsArray = unpricedLines.map(l => l.words.map(({ word }) => word).join(' '))
                pricedItems[pricedItems.length - 1].captions = captionsArray
            }
        }
    }

    return pricedItems
}

/**
 * Splits pricedItems into lineItems and summaryItems
 * NOTE: There can be overlap / duplication! Easier for user to delete items than add items
 * @param {array} pricedItems from extractPricedItems
 * @returns {array} [lineItems, summaryItems]
*/
const processPricedItems = pricedItems => {
    // Find indexes helpful in identifying subtotal and/or total
    let maxCents = 0,
        maxCentsIndexes = [],
        penultimateCents = 0,
        penultimateCentsIndexes = []

    pricedItems.forEach(({ cents, }, index) => {
        if (cents > maxCents) {
            penultimateCents = maxCents
            penultimateCentsIndexes = [...maxCentsIndexes]
            maxCents = cents
            maxCentsIndexes = [index]
        }
        else if (cents === maxCents) {
            maxCentsIndexes.push(index)
        }
        else if (cents > penultimateCents) {
            penultimateCents = cents
            penultimateCentsIndexes = [index]
        }
        else if (cents === penultimateCents) {
            penultimateCentsIndexes.push(index)
        }
    })


    // Summary starts at first subtotal
    let summaryIndex = pricedItems.findIndex(({ label }, index) => index > 0 && label === 'subtotal')

    // If no summary, see if there is another "total" with a tax afterwards
    if (!~summaryIndex) {
        // Total must be immediately before a tax
        // Therefore looped backwards 
        for (let i = pricedItems.length - 1, taxIndex = -1; i >= 0; i--) {
            const label = pricedItems[i].label
            if (label === 'tax') {
                taxIndex = i
            }
            else if (label === 'total') {
                // Can collect two subtotals before the tax (e.g. food and drink)
                if (taxIndex === i + 1 || summaryIndex === i + 1) summaryIndex = i
            }
        }
    }

    // POINT SYSTEM
    // 4*: cents matches sum of all previous cents
    // 3:  is the second largest price
    // 3*: labeled as total
    // 2*: first unquantized value
    // 2:  is the maximum price
    // If no summary, awarded to first line reaching 5 points
    let lastItemIndex = -1
    if (!~summaryIndex) {
        let cumulativeCents = 0,
            points = []


        // Award / initialize points
        pricedItems.forEach(({ cents, label, isAfterLastQuantified }, index) => {
            let p = 0
            if (cents === cumulativeCents) p += 4
            if (label === 'total') p += 3
            if (isAfterLastQuantified) p += 2
            points.push(p)

            cumulativeCents += cents
        })

        maxCentsIndexes.forEach(index => points[index] += 2)
        penultimateCentsIndexes.forEach(index => points[index] += 3)

        // summaryIndex starts at the first line at or above 5 points
        // HOWEVER if another line exceeds this point value
        // Those lines are duplicated as both item AND summary
        points.forEach((p, index) => {
            if (p >= 5) {
                if (!~summaryIndex) summaryIndex = index
                else if (!~lastItemIndex && p > points[summaryIndex]) lastItemIndex = index
            }
        })

        // LAST CHANCE
        if (!~summaryIndex) {
            const lastMax = maxCentsIndexes[maxCentsIndexes.length - 1]
            const lastPenultimate = penultimateCentsIndexes[penultimateCentsIndexes.length - 1]
            // If no penultimate, must rely on max. Likely a single item situation
            if (!penultimateCentsIndexes.length) {
                summaryIndex = maxCentsIndexes[1] || maxCentsIndexes[0] || 0
                lastItemIndex = lastMax || 0
            }
            else {
                // Do not discard any pricedItems
                lastItemIndex = pricedItems.length - 1

                // Max occurs before penultimate, use the max
                if (maxCentsIndexes[0] < lastPenultimate) {
                    summaryIndex = maxCentsIndexes[0]
                    lastItemIndex = pricedItems.length - 1
                }
                // Default
                else {
                    summaryIndex = lastPenultimate
                }
            }
        }
    }

    // Trim summary of any tip suggestions
    let lastSummaryIndex = maxCentsIndexes[maxCentsIndexes.length - 1]
    if (lastSummaryIndex < summaryIndex) {
        lastSummaryIndex = pricedItems.lastIndexOf(({ label }) => label === 'total')
    }

    return [pricedItems.slice(0, ~lastItemIndex ? lastItemIndex + 1 : summaryIndex), pricedItems.slice(summaryIndex, ~lastSummaryIndex ? lastSummaryIndex + 1 : undefined)]
}

/**
 * Convert priced lines designated as likely summary into the actual summary
 * @param {array} summaryItems pricedItems determined as part of the summary
 * @param {number} sumOfLinesItems value of all pricedItems determined to be line items
 * @returns {object} {subtotal, tax, total, tip}
*/
const sumCents = (acc, { cents }) => acc + cents
const createSummary = (summaryItems, sumOfLinesItems) => {
    // GRATUITY is set by the restaurant. TIPS are provided by the user
    let summary = {
        subtotal: 0,
        tax: 0,
        total: 0, // subtotal + tax

        fees: 0,
        discounts: 0,
        gratuity: 0,
        final: 0, // total + fees + discounts + gratuity
    }

    // Add gratuity and remove from rest of summaryItems
    let summaryCandidates = summaryItems.filter(({ label, cents }) => {
        if (label === 'gratuity') {
            summary.gratuity += cents
            return false
        }
        return true
    })

    if (!summaryCandidates.length) return summary

    if (summaryCandidates.length === 1) return { ...summary, subtotal: summaryCandidates[0].cents, total: summaryCandidates[0].cents }

    // A lot of code... and untested
    if (summaryCandidates.length === 2) {
        summaryCandidates.forEach(({ label, cents }) => label && (summary[label] += cents))
        if (summaryCandidates[0].label && summaryCandidates[1].label) {
            return summary
        }
        if (summaryCandidates[1].label) {
            const cents = summaryCandidates[0].cents
            if (summary.subtotal) return { ...summary, total: cents }
            if (summary.tax) {
                if (cents > summary.tax) return { ...summary, subtotal: cents, tax: summary.total - cents }
                else return { ...summary, subtotal: sumOfLinesItems, total: sumOfLinesItems + summary.tax }
            }
            if (summary.total) {
                if (cents > summary.total / 2) return { ...summary, subtotal: cents, tax: summary.total - cents }
                else return { ...summary, tax: cents, subtotal: summary.total - cents }
            }
        }
        if (summaryCandidates[0].label) {
            const cents = summaryCandidates[1].cents
            if (summary.total) return { ...summary, subtotal: summary.total }
            else if (summary.tax) {
                if (cents > summary.tax) return { ...summary, subtotal: cents, total: cents + summary.tax }
                else return { ...summary, subtotal: sumOfLinesItems, total: sumOfLinesItems + summary.tax }
            }
            else if (summary.subtotal) {
                if (cents > summary.subtotal) return { ...summary, total: cents, tax: cents - summary.subtotal }
                else return { ...summary, tax: cents, total: cents + summary.subtotal }
            }
        }

        if (summaryCandidates[1].cents > summaryCandidates[0].cents) {
            return { subtotal: summaryCandidates[0].cents, tax: summaryCandidates[1].cents - summaryCandidates[0].cents, total: summaryCandidates[1].cents, }
        }
        return { subtotal: summaryCandidates[0].cents, tax: summaryCandidates[1].cents, total: summaryCandidates[0].cents + summaryCandidates[1].cents }
    }

    // Total is always the last price, remove from subtotal and tax
    {
        summary.total += summaryCandidates.pop().cents
    }

    // Remove any singular excess values that are not a part of the summary
    {
        const summaryItemsTotal = summaryCandidates.reduce((acc, { cents }) => acc + cents, 0)
        if (summaryItemsTotal > summary.total) {
            const excess = summaryItemsTotal - summary.total
            const excessIndex = summaryCandidates.findIndex(({ cents }) => cents === excess)
            if (~excessIndex) summaryCandidates.splice(excessIndex, 1)
        }
    }

    // SUBTOTAL
    {

        // Subtotal labels 
        let sumOfSubtotals = 0
        summaryCandidates = summaryCandidates.filter(({ label, cents }) => {
            if (label === 'subtotal') {
                if (cents === sumOfLinesItems) summary.subtotal = sumOfLinesItems
                sumOfSubtotals += cents
                return false
            }
            return true
        })

        if (sumOfSubtotals === sumOfLinesItems) summary.subtotal = sumOfLinesItems

        // If sum of lineItems equals first candidate
        if (!summary.subtotal) {
            if (sumOfLinesItems === summaryCandidates[0].cents) summary.subtotal = summaryCandidates[0].cents
        }

        // Test "total" or unlabeled summaryCandidates
        // Favor combinations that reach sumOfLinesItems where possible
        // Default to any total value
        if (!summary.subtotal) {
            const totalOptions = summaryCandidates.filter(({ label }) => label === 'total')
            const totalCents = totalOptions.reduce(sumCents, 0)
            if (totalOptions.some(({ cents }) => cents === sumOfLinesItems)) summary.subtotal = sumOfLinesItems
            else if (totalCents === sumOfLinesItems) summary.subtotal = sumOfLinesItems
            else {
                const nullOptions = summaryCandidates.filter(({ label }) => label === null)
                if (nullOptions.some(({ cents }) => cents === sumOfLinesItems)) summary.subtotal = sumOfLinesItems
                else if (nullOptions.reduce(sumCents, 0) === sumOfLinesItems) summary.subtotal = sumOfLinesItems
                else if (totalCents) summary.subtotal = totalCents
            }

        }

        if (!summary.subtotal) summary.subtotal = sumOfLinesItems
    }

    // TAX
    {
        const delta = summary.total - summary.subtotal

        // See if a single tax matches delta
        if (summaryCandidates.some(({ label, cents }) => label === 'tax' && cents === delta)) summary.tax = delta

        // Tax labels 
        if (!summary.tax) {
            // Previously did not combine multiple tax options... uncertain why
            summaryCandidates = summaryCandidates.filter(({ label, cents }) => {
                if (label === 'tax') {
                    summary.tax += cents
                    return false
                }
                return true
            })
        }

        // Mathmatically
        if (!summary.tax) {
            summary.tax = delta
        }
    }

    // Double check the subtotal
    const expectedSubtotal = summary.total - summary.tax - summary.gratuity
    if (summary.subtotal !== expectedSubtotal) {
        const subtotalOptions = summaryItems.filter(({ label }) => label === 'subtotal' || label === 'total')
        if (subtotalOptions.some(({ cents }) => cents === expectedSubtotal)) summary.subtotal = expectedSubtotal
        else {
            const subtotalCents = subtotalOptions.reduce(sumCents, 0)
            if (subtotalCents === expectedSubtotal) summary.subtotal = expectedSubtotal
            else if (subtotalCents - summaryItems[summaryItems.length - 1].cents === expectedSubtotal) summary.subtotal = expectedSubtotal
            else {
                const nullOptions = summaryItems.filter(({ label }) => label === null)
                if (nullOptions.some(({ cents }) => cents === expectedSubtotal)) summary.subtotal = expectedSubtotal
                else {
                    const nullCents = nullOptions.reduce(sumCents, 0)
                    if (nullCents === expectedSubtotal) summary.subtotal = expectedSubtotal
                    else if (nullCents - summaryItems[summaryItems.length - 1].cents === expectedSubtotal) summary.subtotal = expectedSubtotal
                }
            }
        }

    }

    return summary
}

const clearDixes = (dixes) => {
    if (dixes.areCleared) return

    dixes.pre = (' ').repeat(dixes.pre.length)
    dixes.suf = (' ').repeat(dixes.suf.length)
    dixes.areCleared = true
}

const logReceipt = (restaurant, lineItems, summary) => {
    const MAX_LENGTH = 40
    const QUANTITY_LENGTH = Math.max(...lineItems.map(({ quantity }) => quantity))
    const log = ({ pre, suf }, text,) => {
        console.log(
            pre.toString().padStart(QUANTITY_LENGTH, ' ') + '  ' +
            text +
            suf
        )
    }

    console.log('\n', restaurant, '\n')

    lineItems.forEach(({ quantity, name, cents, captions }) => {
        const nameArray = name.split(' ')

        let charsRemaining = MAX_LENGTH
        let currentLine = ''

        let dixes = { pre: quantity, suf: cents, areCleared: false }

        for (let i = 0; i < nameArray.length; i++) {
            let word = nameArray[i]

            // This word cannot fit on the line
            if (word.length > charsRemaining) {
                if (currentLine) {
                    log(dixes, currentLine.padEnd(MAX_LENGTH, ' '))

                    clearDixes(dixes)
                    currentLine = ''
                    charsRemaining = MAX_LENGTH
                }

                // Consume letters than fill an entire line
                while (word.length > MAX_LENGTH) {
                    log(dixes, word.substring(0, MAX_LENGTH))
                    clearDixes(dixes)
                    word = word.substring(MAX_LENGTH)
                }
            }

            // This word is the last on the line
            // OR this is the last word of the text
            if (word.length + 1 >= charsRemaining || i === nameArray.length - 1) {
                const temp = currentLine + word
                log(dixes, temp.padEnd(MAX_LENGTH, ' '))
                clearDixes(dixes)
                currentLine = ''
                charsRemaining = MAX_LENGTH
            }
            else {
                currentLine += word + ' '
                charsRemaining -= word.length
            }
        }

        captions.forEach(caption => console.log(caption.padStart(caption.length + QUANTITY_LENGTH + 2, ' ')))

    })

    console.log(
        '\n',
        'SUBTOTAL:'.padEnd(QUANTITY_LENGTH + 2 + MAX_LENGTH) + summary.subtotal + '\n',
        'TAX:'.padEnd(QUANTITY_LENGTH + 2 + MAX_LENGTH) + summary.tax + '\n',
        'TOTAL:'.padEnd(QUANTITY_LENGTH + 2 + MAX_LENGTH) + summary.total + '\n',
    )
}

const testProcessItems = () => {

    const item1 = { "quantity": 1, "name": "Simple Pleasures", "cents": 1400, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const item2 = { "quantity": 1, "name": "Tamari Deviled Egg", "cents": 700, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const item3 = { "quantity": 1, "name": "Kimchi Slaw", "cents": 600, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const item4 = { "quantity": 1, "name": "Kabocha Pear Ravioli", "cents": 1700, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const unlabeledSubtotal = { "quantity": 1, "name": "Sub-total", "cents": 2100, "confidence": 1, "label": null, "isAfterLastQuantified": true }
    const subtotal = { "quantity": 1, "name": "Sub-total", "cents": 4400, "confidence": 1, "label": "subtotal", "isAfterLastQuantified": true }
    const tax = { "quantity": 1, "name": "Sales Tax", "cents": 264, "confidence": 1, "label": "tax", "isAfterLastQuantified": false }
    const total = { "quantity": 1, "name": "TOTAL", "cents": 4664, "confidence": 1, "label": "total", "isAfterLastQuantified": false }

    const [o1, o2] = processPricedItems([
        item1,
        item2,
        // item3,
        // item4,
        // unlabeledSubtotal,
        // subtotal,
        tax,
        // total
    ])

    o1.forEach(lineItem => console.log('Line item: ', JSON.stringify(lineItem)))
    o2.forEach(summary => console.log('Summary: ', JSON.stringify(summary)))
}

const testCreateSummary = () => {
    const item1 = { "quantity": 1, "name": "Simple Pleasures", "cents": 1400, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const item2 = { "quantity": 1, "name": "Tamari Deviled Egg", "cents": 700, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const item3 = { "quantity": 1, "name": "Kimchi Slaw", "cents": 600, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const item4 = { "quantity": 1, "name": "Kabocha Pear Ravioli", "cents": 1700, "confidence": 1, "label": null, "isAfterLastQuantified": false }
    const unlabeledSubtotal = { "quantity": 1, "name": "Sub-total", "cents": 2100, "confidence": 1, "label": null, "isAfterLastQuantified": true }
    const subtotal = { "quantity": 1, "name": "Sub-total", "cents": 4400, "confidence": 1, "label": "subtotal", "isAfterLastQuantified": true }
    const tax = { "quantity": 1, "name": "Sales Tax", "cents": 264, "confidence": 1, "label": "tax", "isAfterLastQuantified": false }
    const total = { "quantity": 1, "name": "TOTAL", "cents": 4664, "confidence": 1, "label": "total", "isAfterLastQuantified": false }

    const array = []
    const sum = array.reduce(sumCents, 0)
    const summary = createSummary(array, sum)
    console.log(summary)
}

exports.processAnnotation = (annotation) => {

    // return testProcessItems()
    // return testCreateSummary()

    // Single image (page)
    if (!annotation || !annotation.pages) throw 'No text detected'
    const page = annotation.pages[0]
    if (!page.blocks.length) throw 'No text detected'

    const pageHeight = page.height
    const pageWidth = page.width

    /*
      Cloud vision returns text as blocks, paragraphs, words, and symbols.
      Unfortunately, two blocks of text placed side-by-side (item names and item prices)
      are often read as two separate blocks, and therefore two separate paragraphs
   
      The first half of this text attempts to reconstitute line items from these two blocks of text
      The theory is: All words in a line fall within the same top and bottom (Y)
      so you can simply find the Y-intercept for all words and sort by their X position.
   
      The problem is that receipts are not always flat
      which may lead, say, the names to slope upwards and the prices to slope downwards
      In this case, using their slopes will not work because they point in different directions
        and even using an averaged slope often fails due to the displacement of the words outside their Y range
      
      The solution implemented is to instead shift what we view as the Y-intercept
      from X=0 to X=some point between the two paragraphs.
      Now each paragraph can rely on its own slope
      to find where the words in each line naturally intersect.
    */

    const dominantOrientation = getDominantOrientation(page)
    if (!dominantOrientation) throw 'Text detected at multiple angles'

    const paragraphDimensions = getParagraphDimensions(page, pageHeight, pageWidth, dominantOrientation)
    if (!paragraphDimensions.length) throw 'No text detected'

    const rowDimensions = createRows(paragraphDimensions)

    addInterceptLine(rowDimensions, dominantOrientation === '0CCW' || dominantOrientation === '180CCW' ? pageWidth : pageHeight)

    const wordList = extractWords(page, rowDimensions, dominantOrientation)
    if (!wordList.length) throw 'Unable to determine words'
    // wordList.forEach(word => console.log(word.word))

    const lines = binWords(wordList)
    if (!lines.length) throw 'Unable to find lines'

    // lines.forEach(line => console.log(line.words.flatMap(({ word }) => word), line.isPriced))

    const restaurant = lines[0] && lines[0].words.reduce((prev, curr, index) => {
        return prev + (index !== 0 ? ' ' : '') + curr.word
    }, '')

    const pricedItems = extractPricedItems(lines)

    // pricedItems.forEach(priced => console.log(JSON.stringify(priced)))

    const [lineItems, summaryItems] = processPricedItems(pricedItems)

    // lineItems.forEach(lineItem => console.log('Line item: ', JSON.stringify(lineItem)))
    // summaryItems.forEach(summary => console.log('Summary: ', JSON.stringify(summary)))

    // const billGroups = createBillGroups(lineItems)
    const summary = createSummary(summaryItems, lineItems.reduce((sum, lineItem) => sum + lineItem.cents, 0))
    // console.log(summary)

    // logReceipt(restaurant, lineItems, summary)

    return [restaurant, lineItems, summary,]
}

// Returns the slope of a bounding box by averaging the slopes of the top and bottom borders
function calculateSlant(corners) {
    // 0 = top-left; 1 = top-right; 2 = bottom-right, 3 = bottom-left
    return (
        (corners[1].y - corners[0].y) / (corners[1].x - corners[0].x) +
        (corners[2].y - corners[3].y) / (corners[2].x - corners[3].x)
    ) / 2
}

function isProperOrientation(vertices) {
    return (vertices[0].x < vertices[2].x && vertices[0].y < vertices[2].y)
}



function pointOfIntersection(leftSlant, leftPoint, rightSlant, rightPoint) {
    /* 
      This function is essentially setting to equations
        mx+b = y
        lx+a = y
      equal to each other in order to find the X value where their Ys intercept
    */
    if (leftSlant === rightSlant) { return 0 }
    let leftB = leftPoint.y - leftSlant * leftPoint.x
    let rightB = rightPoint.y - rightSlant * rightPoint.x

    return (rightB - leftB) / (leftSlant - rightSlant)
}

/* 
 Finds an average point for a horizontal line
 Then applies the given slope to calculate where the line hits the designated X-value serving as the intercept line
*/
function calculateYintercept(left, right, slope, interceptLine) {
    let x = (left.x + right.x) / 2
    let y = (left.y + right.y) / 2
    return y - (slope * (x - interceptLine));
}

function fixVertices(vertices, height, width, dominantOrientation) {
    return vertices.map(vertex => {
        if (!vertex.x) {
            vertex.x = 0
        }
        if (!vertex.y) {
            vertex.y = 0
        }

        if (dominantOrientation === '90CCW') return { x: height - vertex.y, y: vertex.x }
        if (dominantOrientation === '180CCW') return { x: width - vertex.x, y: height - vertex.y }
        if (dominantOrientation === '270CCW') return { x: vertex.y, y: width - vertex.x }

        return vertex
    })
}



function summaryRegex(name) {
    // exact expected terms, case insensitive
    if (name.match(/subtotal|sub\stotal|sub-total/i)) {
        return 'subtotal'
    }
    else if (name.match(/tax|tx|vat/i)) {
        return 'tax'
    }
    // Lenient on totals, as some may call words generally used for total as subtotal
    else if (name.match(/total|final|balance|amount/i)) {
        return 'total'
    }
    else if (name.match(/gratuity|tip/i)) {
        return 'gratuity'
    }

    return null
}
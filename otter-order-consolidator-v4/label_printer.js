// label_printer.js - V5.2.3 - Debugging Generate Preview button

// --- DOM Elements ---
const orderItemsListEl = document.getElementById('orderItemsList');
const generateLabelsButton = document.getElementById('generateLabelsButton');
const printLabelsButton = document.getElementById('printLabelsButton');
const labelSheetPreviewEl = document.getElementById('labelSheetPreview');
const labelCountMessageEl = document.getElementById('labelCountMessage');
const selectedOrderNameEl = document.getElementById('selectedOrderName');

// --- Global Variables ---
let currentOrderData = null;
let processedLabelItems = [];

// --- Restaurant Logo Mapping ---
const restaurantLogoMap = {
    "Bowls of Rice": "images/Bowls_Logo.png",
    "Bunch of Dumplings": "images/Bunch_Logo.png",
    "Take a Bao Eats": "images/Bao_Logo.png",
    "Default": ""
};

// --- Add-on Identification (Expanded) ---
const ADD_ON_ITEM_NAMES = [
    // Drinks
    'coke', 'diet coke', 'pepsi', 'sprite', 'dr pepper', 'iced tea', 'lemonade',
    'bottled water', 'coffee', 'orange juice', 'apple juice', 'milk tea', 'thai tea',
    'coca-cola', 'diet pepsi', 'root beer', 'ginger ale', 'water', 'sparkling water',
    'hot tea', 'iced coffee', 'latte', 'cappuccino', 'smoothie', 'fountain drink', 'mango tea',
    // Sides
    'french fries', 'side of fries', 'onion rings', 'side salad', 'cup of soup',
    'steamed rice', 'brown rice', 'garlic bread', 'mashed potatoes', 'steamed vegetables',
    'cole slaw', 'mac and cheese', 'cornbread', 'edamame', 'miso soup', 'egg roll', 'spring roll',
    'crispy vegetable dumplings',
    // Desserts
    'cheesecake slice', 'chocolate cake', 'ice cream scoop', 'brownie', 'cookie',
    'apple pie', 'tiramisu', 'pudding', 'fruit cup', 'mochi',
];

const SEPARATE_ITEM_PREFIXES = [
    'choice of side:',
    'choice of drink:',
    'side addition:',
    'dessert choice:',
    'extra dessert:',
    'drink choice:',
    'add a drink:',
    'side choice:',
    'add dessert:',
    'extra side:',
    'extra drink:',
    'add side:',
    'add drink:',
    'add on:',
].sort((a, b) => b.length - a.length);


// Function to get the correct logo URL
function getLogoUrl(restaurantName) {
    if (!restaurantName) {
        console.warn("Restaurant name is undefined. Using default logo path.");
        return restaurantLogoMap["Default"] ? chrome.runtime.getURL(restaurantLogoMap["Default"]) : "";
    }
    const logoPath = restaurantLogoMap[restaurantName] || restaurantLogoMap[Object.keys(restaurantLogoMap).find(key => key.toLowerCase() === restaurantName.toLowerCase())] || restaurantLogoMap["Default"];
    return logoPath ? chrome.runtime.getURL(logoPath) : "";
}

// Regex to identify generic "Choices (Choose N):" lines
const choicesPatternRegex = /^\w+(\s+\w+)*\s+choices\s*\(\s*choose\s+\d+\s*\):/i;

// Helper function to extract a specific choice for an item (like dumpling or dessert)
function extractSpecificChoiceForItem(notes, itemChoiceMarkerPrefix, nextPotentialSectionStarters) {
    let chosenItemName = null;

    for (let i = 0; i < notes.length; i++) {
        const currentNote = notes[i].trim();
        const currentNoteLower = currentNote.toLowerCase();

        if (currentNoteLower.startsWith(itemChoiceMarkerPrefix.toLowerCase())) {
            let textDirectlyAfterMarker = currentNote.substring(itemChoiceMarkerPrefix.length).trim();

            // Scenario 1: Choice is on the same line as the marker
            if (textDirectlyAfterMarker) {
                let endOfChoiceOnLine = textDirectlyAfterMarker.length;
                for (const starter of nextPotentialSectionStarters) {
                    const starterIndex = textDirectlyAfterMarker.toLowerCase().indexOf(starter.toLowerCase());
                    if (starterIndex !== -1 && starterIndex < endOfChoiceOnLine) {
                        endOfChoiceOnLine = starterIndex;
                    }
                }
                const potentialChoiceOnLine = textDirectlyAfterMarker.substring(0, endOfChoiceOnLine).trim();
                if (potentialChoiceOnLine && !choicesPatternRegex.test(potentialChoiceOnLine)) {
                    chosenItemName = potentialChoiceOnLine;
                    return chosenItemName;
                }
            }

            // Scenario 2: Choice is on the next line
            if ((i + 1) < notes.length) {
                const nextNote = notes[i + 1].trim();
                const nextNoteLower = nextNote.toLowerCase();
                let isNextLineASectionStarter = false;
                if (nextPotentialSectionStarters.some(starter => nextNoteLower.startsWith(starter.toLowerCase()))) {
                    isNextLineASectionStarter = true;
                } else if (choicesPatternRegex.test(nextNote)) {
                    isNextLineASectionStarter = true;
                }

                if (!isNextLineASectionStarter && nextNote) {
                    chosenItemName = nextNote;
                    return chosenItemName;
                }
            }
            return null;
        }
    }
    return null; // Marker not found
}


// Function to process order items for labeling (V5.2 - Relaxed Bao Stop Condition)
function processOrderItemsForLabeling(originalItems) {
    const finalLabelItems = [];
    if (!originalItems || !Array.isArray(originalItems)) {
        console.error("processOrderItemsForLabeling: originalItems is invalid", originalItems);
        return finalLabelItems;
    }
    console.log("Processing original items for labeling (V5.2 - Bao Logic):", JSON.parse(JSON.stringify(originalItems)));

    originalItems.forEach(originalItem => {
        const trulyGeneralNotes = [];
        const specificItemNotes = [];

        if (Array.isArray(originalItem.notes)) {
            originalItem.notes.forEach(noteText => {
                if (noteText.toLowerCase().startsWith("note:")) {
                    trulyGeneralNotes.push(noteText);
                } else {
                    specificItemNotes.push(noteText);
                }
            });
        }

        const itemNameLower = originalItem.name.toLowerCase();
        let isSpecialMeal = false;

        // --- Handle "Bowl of Rice Meal" ---
        if (itemNameLower.includes("bowl of rice meal")) {
            isSpecialMeal = true;
            const mealName = "Bowl of Rice Meal";
            const mealComponents = [
                { name: "Small Rice Bowl" },
                { name: "Dumplings" },
                { name: "Dessert" }
            ];
            mealComponents.forEach(comp => {
                finalLabelItems.push({
                    name: `${comp.name} (from ${mealName})`,
                    quantity: originalItem.quantity,
                    size: '',
                    notes: [...trulyGeneralNotes],
                    isMealComponent: true,
                    parentMeal: mealName
                });
            });
            console.log(`Processed "${mealName}": ${originalItem.name} into components. General notes applied:`, trulyGeneralNotes);
        }
        // --- Handle "Bao Out" Meal ---
        else if (itemNameLower.includes("bao out")) {
            isSpecialMeal = true;
            const mealName = "Bao Out";
            const parsedBaoComponents = [];

            const baoChoiceMarkers = ["bao choices (choose 2):", "bao choices (choose two):", "choose 2 bao:"];
            const inLineSectionStarters = ["dessert choices", "drink choices", "side choices", "dumpling choices", "note:", ...SEPARATE_ITEM_PREFIXES];
            // *** Refined subsequentLineStopMarkers to NOT include the general regex here ***
            const subsequentLineStopMarkers = ["note:", ...SEPARATE_ITEM_PREFIXES, "dessert choices:", "drink choices:", "side choices:", "dumpling choices:", ...baoChoiceMarkers];

            let baoMarkerNoteIndex = -1;
            for (let i = 0; i < specificItemNotes.length; i++) {
                const noteLower = specificItemNotes[i].toLowerCase();
                if (baoChoiceMarkers.some(marker => noteLower.startsWith(marker))) {
                    baoMarkerNoteIndex = i;
                    break;
                }
            }

            if (baoMarkerNoteIndex !== -1) {
                const markerNoteText = specificItemNotes[baoMarkerNoteIndex];
                const markerNoteLower = markerNoteText.toLowerCase();
                let textAfterMarkerInSameNote = "";
                let matchedMarker = baoChoiceMarkers.find(marker => markerNoteLower.startsWith(marker)) || "";
                textAfterMarkerInSameNote = markerNoteText.substring(matchedMarker.length).trim();

                if (textAfterMarkerInSameNote) {
                    let currentChoicesText = textAfterMarkerInSameNote;
                    let endOfBaoChoicesInString = currentChoicesText.length;
                    for (const starter of inLineSectionStarters) {
                        const starterIndex = currentChoicesText.toLowerCase().indexOf(starter.toLowerCase());
                        if (starterIndex !== -1 && starterIndex < endOfBaoChoicesInString) {
                            endOfBaoChoicesInString = starterIndex;
                        }
                    }
                    const actualBaoTextFromString = currentChoicesText.substring(0, endOfBaoChoicesInString).trim();
                    if (actualBaoTextFromString) {
                        actualBaoTextFromString.split(';')
                            .map(b => b.trim())
                            .filter(b => b && b.length > 0)
                            .forEach(pb => {
                                if (parsedBaoComponents.length < 2) parsedBaoComponents.push({ name: pb });
                            });
                    }
                }

                // Collect from *subsequent notes*
                for (let i = baoMarkerNoteIndex + 1; i < specificItemNotes.length; i++) {
                    if (parsedBaoComponents.length >= 2) break;
                    const noteTrimmed = specificItemNotes[i].trim();
                    const noteLower = noteTrimmed.toLowerCase();
                    if (!noteTrimmed) continue;

                    // *** V5.2 Change: Removed || choicesPatternRegex.test(noteTrimmed) from this specific stop condition ***
                    let stopCollectingThisLine = subsequentLineStopMarkers.some(stopMarker => noteLower.startsWith(stopMarker.toLowerCase()));

                    // We still *need* to check if it looks like *another* "Choices (Choose N):" line, even if not in the list.
                    // Let's add the regex check back, but be very explicit it's a stop condition.
                    if (!stopCollectingThisLine && choicesPatternRegex.test(noteTrimmed)) {
                         // Only consider it a stop if it's NOT a "Bao Choices" line (in case of weird nesting)
                         if (!baoChoiceMarkers.some(marker => noteLower.startsWith(marker.toLowerCase()))){
                             stopCollectingThisLine = true;
                         }
                    }

                    if (stopCollectingThisLine) break;

                    parsedBaoComponents.push({ name: noteTrimmed });
                }
            }

            while (parsedBaoComponents.length < 2) {
                console.warn(`Adding placeholder Bao for "${originalItem.name}". Found: ${parsedBaoComponents.length}`);
                parsedBaoComponents.push({ name: `Chosen Bao ${parsedBaoComponents.length + 1}` });
            }
             if (parsedBaoComponents.length > 2) {
                 console.warn(`Found ${parsedBaoComponents.length} Baos, taking first 2 for "${originalItem.name}".`);
                parsedBaoComponents.splice(2);
            }

            parsedBaoComponents.forEach(comp => {
                finalLabelItems.push({
                    name: `${comp.name} (from ${mealName})`, quantity: originalItem.quantity, size: '',
                    notes: [...trulyGeneralNotes], isMealComponent: true, parentMeal: mealName
                });
            });

            // Parse Dumpling Choice
            let actualDumplingName = "Dumplings";
            const dumplingChoicePrefix = "dumpling choices (choose 1):";
            const nextSectionsAfterDumpling = ["dessert choices:", "note:", ...SEPARATE_ITEM_PREFIXES];
            const parsedDumpling = extractSpecificChoiceForItem(specificItemNotes, dumplingChoicePrefix, nextSectionsAfterDumpling);
            if (parsedDumpling) {
                actualDumplingName = parsedDumpling;
            }
             finalLabelItems.push({
                name: `${actualDumplingName} (from ${mealName})`, quantity: originalItem.quantity, size: '',
                notes: [...trulyGeneralNotes], isMealComponent: true, parentMeal: mealName
            });

            // Parse Dessert Choice
            let actualDessertName = "Dessert";
            const dessertChoicePrefix = "dessert choices (choose 1):";
            const nextSectionsAfterDessert = ["note:", ...SEPARATE_ITEM_PREFIXES];
            const parsedDessert = extractSpecificChoiceForItem(specificItemNotes, dessertChoicePrefix, nextSectionsAfterDessert);
            if (parsedDessert) {
                actualDessertName = parsedDessert;
            }
            finalLabelItems.push({
                name: `${actualDessertName} (from ${mealName})`, quantity: originalItem.quantity, size: '',
                notes: [...trulyGeneralNotes], isMealComponent: true, parentMeal: mealName
            });

            console.log(`Processed "${mealName}": ${originalItem.name}. Baos: ${parsedBaoComponents.map(b=>b.name).join(', ')}. Dumpling: ${actualDumplingName}. Dessert: ${actualDessertName}. General notes:`, trulyGeneralNotes);
        }

        // --- Default Processing for non-special-meal items ---
        if (!isSpecialMeal) {
            const mainItem = {
                name: originalItem.name,
                quantity: originalItem.quantity,
                size: originalItem.size || '',
                notes: []
            };

            const addOnItemsExtracted = [];
            const mainItemSpecificModifiers = [];

            specificItemNotes.forEach(noteText => {
                const noteLower = noteText.toLowerCase();
                let isSeparateAddon = false;
                let extractedAddonName = noteText.trim();

                for (const prefix of SEPARATE_ITEM_PREFIXES) {
                    if (noteLower.startsWith(prefix)) {
                        isSeparateAddon = true;
                        extractedAddonName = noteText.substring(prefix.length).trim();
                        break;
                    }
                }

                if (!isSeparateAddon) {
                    const parts = noteText.split(':');
                    const potentialItemNameFromParts = (parts.length > 1) ? parts[parts.length - 1].trim() : noteText.trim();
                    const potentialItemNameLower = potentialItemNameFromParts.toLowerCase();

                    if (ADD_ON_ITEM_NAMES.includes(potentialItemNameLower)) {
                        isSeparateAddon = true;
                        extractedAddonName = potentialItemNameFromParts;
                    } else if (ADD_ON_ITEM_NAMES.includes(noteLower)) {
                        isSeparateAddon = true;
                        extractedAddonName = noteText.trim();
                    }
                }

                if (isSeparateAddon && extractedAddonName) {
                    addOnItemsExtracted.push({
                        name: extractedAddonName,
                        quantity: mainItem.quantity,
                        size: '',
                        notes: [...trulyGeneralNotes],
                        isAddon: true
                    });
                } else {
                    mainItemSpecificModifiers.push(noteText);
                }
            });

            mainItem.notes.push(...mainItemSpecificModifiers);
            mainItem.notes.push(...trulyGeneralNotes);
            finalLabelItems.push(mainItem);
            // console.log("Processed main item (default logic):", JSON.parse(JSON.stringify(mainItem)));

            addOnItemsExtracted.forEach(addon => {
                finalLabelItems.push(addon);
                // console.log("Processed add-on item (default logic):", JSON.parse(JSON.stringify(addon)));
            });
        }
    });

    console.log("Final items for label generation (V5.2 - Bao Logic):", JSON.parse(JSON.stringify(finalLabelItems)));
    return finalLabelItems;
}


// Renders the list of items in the sidebar
function renderOrderSummaryItems() {
    if (!orderItemsListEl) { // Check if element exists
        console.warn("renderOrderSummaryItems: orderItemsListEl not found.");
        return;
    }
    // Ensure currentOrderData and items exist for the list, but primarily display based on processedLabelItems
    const itemsToDisplay = processedLabelItems && processedLabelItems.length > 0 ? processedLabelItems : [];

    orderItemsListEl.innerHTML = itemsToDisplay.length === 0 ? '<p class="placeholder-text">No items to display.</p>' : '';

    itemsToDisplay.forEach(item => {
        const listItem = document.createElement('div');

        const itemNotesString = Array.isArray(item.notes) && item.notes.length > 0 ? item.notes.map(n => n.trim()).join('; ') : '';

        let itemTypeTag = '';
        if (item.isAddon) {
            itemTypeTag = '<span class="text-xs text-purple-600">(Add-on)</span>';
        } else if (item.isMealComponent) {
            itemTypeTag = `<span class="text-xs text-green-600">(Meal Part)</span>`;
        }

        listItem.innerHTML = `
            <span>${item.quantity || 0}x ${item.name || 'N/A'} ${itemTypeTag}</span>
            ${item.size ? `<span class="text-xs text-gray-600 block">(${item.size})</span>` : ''}
            ${itemNotesString ? `<em class="text-xs text-blue-600 block">- ${itemNotesString}</em>` : ''}
        `;
        orderItemsListEl.appendChild(listItem);
    });
}

// Generates the visual preview of labels
function generateLabelsPreview() {
    if (!labelSheetPreviewEl) { // Check if element exists
        console.warn("generateLabelsPreview: labelSheetPreviewEl not found.");
        if(labelCountMessageEl) labelCountMessageEl.textContent = 'Preview area not found.';
        return;
    }
     if (!processedLabelItems) { // Check if processedLabelItems is defined
        console.warn("generateLabelsPreview: processedLabelItems is undefined.");
        labelSheetPreviewEl.innerHTML = `<div class="label-placeholder-message">Error: Processed items data is missing.</div>`;
        if(labelCountMessageEl) labelCountMessageEl.textContent = 'Error processing items.';
        return;
    }

    labelSheetPreviewEl.innerHTML = ''; // Clear previous preview
    let totalLabelsGeneratedOnSheet = 0;
    const maxLabelsPerSheet = 10; 
    const logoUrl = getLogoUrl(currentOrderData?.restaurantName);

    console.log("[Generate Preview] Starting. Processed items count:", processedLabelItems.length);

    if (processedLabelItems.length === 0) {
        labelSheetPreviewEl.innerHTML = `<div class="label-placeholder-message">No labels to generate. Process items or check order data.</div>`;
        if(labelCountMessageEl) labelCountMessageEl.textContent = 'No labels to generate.';
        console.log("[Generate Preview] No processed items to display.");
        return;
    }

    processedLabelItems.forEach((item, index) => {
        console.log(`[Generate Preview] Processing item ${index + 1} for preview:`, JSON.parse(JSON.stringify(item)));
        const itemQuantity = parseInt(item.quantity, 10) || 0;
        if (itemQuantity === 0) {
            console.log(`[Generate Preview] Item ${index + 1} (${item.name}) has quantity 0, skipping.`);
        }
        for (let i = 0; i < itemQuantity; i++) {
            if (totalLabelsGeneratedOnSheet < maxLabelsPerSheet) {
                labelSheetPreviewEl.appendChild(createLabelElement(item, logoUrl));
                totalLabelsGeneratedOnSheet++;
            } else {
                // Stop if max labels for one preview sheet is reached
                // console.log("[Generate Preview] Max labels for preview sheet reached.");
                // break; // This break would only exit the inner loop.
            }
        }
    });
    console.log(`[Generate Preview] Total labels added to preview sheet: ${totalLabelsGeneratedOnSheet}`);


    // Fill remaining spots on the preview sheet with blank labels
    if (totalLabelsGeneratedOnSheet > 0 && totalLabelsGeneratedOnSheet < maxLabelsPerSheet) {
        const remainingSpots = maxLabelsPerSheet - totalLabelsGeneratedOnSheet;
        console.log(`[Generate Preview] Filling ${remainingSpots} blank spots on preview sheet.`);
        for (let i = 0; i < remainingSpots; i++) {
            const blankLabelDiv = document.createElement('div');
            blankLabelDiv.className = 'label-item';
            labelSheetPreviewEl.appendChild(blankLabelDiv);
        }
    } else if (totalLabelsGeneratedOnSheet === 0 && processedLabelItems.length > 0) {
        // This case should ideally be caught by the initial check, but as a fallback:
        labelSheetPreviewEl.innerHTML = `<div class="label-placeholder-message">Items processed, but no labels generated (check quantities).</div>`;
        console.warn("[Generate Preview] Items were processed, but totalLabelsGeneratedOnSheet is 0.");
    }

    let actualTotalLabelsToPrint = processedLabelItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
    if (labelCountMessageEl) {
        if (actualTotalLabelsToPrint > 0) {
            labelCountMessageEl.textContent = `Previewing ${Math.min(actualTotalLabelsToPrint, maxLabelsPerSheet)} of ${actualTotalLabelsToPrint} total labels.${actualTotalLabelsToPrint > maxLabelsPerSheet ? ' Printing will generate multiple sheets.' : ''}`;
        } else {
            labelCountMessageEl.textContent = 'No labels to generate.';
        }
    }
    console.log("[Generate Preview] Finished.");
}

// Prepares all labels for printing (potentially across multiple sheets)
function prepareForPrint() {
    if (!processedLabelItems || processedLabelItems.length === 0) {
        console.warn("No items to print labels for.");
        if(labelCountMessageEl) labelCountMessageEl.textContent = 'No items to print labels for.';
        const printContainer = document.querySelector('.print-only-container-wrapper');
        if (printContainer) { 
            printContainer.innerHTML = '<p>No labels to print.</p>';
        }
        return;
    }

    const printContainerWrapper = document.querySelector('.print-only-container-wrapper');
    if (!printContainerWrapper) {
        console.error("Critical Error: Print container '.print-only-container-wrapper' not found in the HTML. Cannot proceed with printing.");
        if(labelCountMessageEl) labelCountMessageEl.textContent = 'Error: Print container missing.';
        if(labelSheetPreviewEl) labelSheetPreviewEl.innerHTML = `<div class="label-placeholder-message" style="color: red; font-weight: bold;">Printing Error: Required page element is missing. Please contact support.</div>`;
        return;
    }
    printContainerWrapper.innerHTML = ''; 

    const maxLabelsPerSheet = 10; 
    const logoUrl = getLogoUrl(currentOrderData?.restaurantName);
    let currentSheetForPrint = null;
    let labelCountOnCurrentSheet = 0;
    let totalLabelsPrinted = 0;

    console.log("--- Preparing for Print (V5.2.3 for Avery 5163) ---");
    processedLabelItems.forEach(item => {
        const itemQuantity = parseInt(item.quantity, 10) || 0;
        for (let i = 0; i < itemQuantity; i++) {
            if (labelCountOnCurrentSheet === 0 || labelCountOnCurrentSheet >= maxLabelsPerSheet) {
                currentSheetForPrint = document.createElement('div');
                currentSheetForPrint.className = 'label-sheet'; 
                printContainerWrapper.appendChild(currentSheetForPrint);
                labelCountOnCurrentSheet = 0; 
            }
            currentSheetForPrint.appendChild(createLabelElement(item, logoUrl));
            labelCountOnCurrentSheet++;
            totalLabelsPrinted++;
        }
    });

    if (currentSheetForPrint && labelCountOnCurrentSheet > 0 && labelCountOnCurrentSheet < maxLabelsPerSheet) {
        for (let i = 0; i < (maxLabelsPerSheet - labelCountOnCurrentSheet); i++) {
            const blankLabelDiv = document.createElement('div');
            blankLabelDiv.className = 'label-item'; 
            currentSheetForPrint.appendChild(blankLabelDiv);
        }
    }

    if (totalLabelsPrinted === 0) {
        printContainerWrapper.innerHTML = '<p style="text-align:center; padding:20px; font-family: Inter, sans-serif;">No labels were generated for printing.</p>';
        console.warn("No labels were actually generated for printing.");
        return;
    }

    console.log(`Total labels prepared for printing (V5.2.3 for Avery 5163): ${totalLabelsPrinted}`);
    window.print();
    console.log("--- Finished Preparing for Print (V5.2.3 for Avery 5163) ---");
}

// Creates a single label's HTML element
function createLabelElement(item, logoUrl) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label-item'; 

    // Clean up item name - remove "Urban" prefix if it's part of "Urban Bowl"
    let itemName = item.name || 'N/A';
    if (itemName.includes('Urban Bowl')) {
        itemName = itemName.replace(/Urban\s+/i, '');
    }
    const itemSize = item.size || '';
    let customerName = 'No Name';
    const itemNotesArray = Array.isArray(item.notes) ? item.notes.map(n => String(n).trim()).filter(n => n) : [];

    // Extract customer name from notes if not directly available
    if (item.customerName) {
        customerName = item.customerName;
    } else {
        // Look for customer name in notes
        const customerNote = itemNotesArray.find(note => note.toLowerCase().startsWith('customer:'));
        if (customerNote) {
            customerName = customerNote.substring(9).trim(); // Remove "Customer: " prefix
        }
    }

    // Filter out customer and batch notes since we're showing customer name separately
    // Also filter out notes that are just the size repeated
    const filteredNotes = itemNotesArray.filter(note => {
        const noteLower = note.toLowerCase();
        return !noteLower.startsWith('size choice') &&
               !noteLower.startsWith('customer:') &&
               !noteLower.startsWith('batch:') &&
               !(itemSize && noteLower === itemSize.toLowerCase()); // Filter out duplicate size
    });

    let logoHTML = logoUrl ? `<div class="logo-container"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></div>` : '';

    let sizeDisplayHTML = '';
    if (itemSize.trim() !== '' && itemSize.trim().toLowerCase() !== 'no-size') {
        sizeDisplayHTML = `<div class="item-size-line">${itemSize.trim()}</div>`;
    }

    let notesHTML = filteredNotes.map(note => {
        return `<div class="note-line">${note.trim()}</div>`;
    }).join('');

    let notesDisplayHTML = notesHTML.trim() !== '' ? `<div class="item-notes">${notesHTML}</div>` : '';

    // Check if customer name should be shown (only if it's in the notes)
    let showCustomerName = false;
    let customerNameFromNote = '';
    
    filteredNotes.forEach(note => {
        // Check if note contains a name pattern
        const namePatterns = [
            /^for:\s*(.+)$/i,
            /^name:\s*(.+)$/i,
            /^deliver to:\s*(.+)$/i,
            /^customer:\s*(.+)$/i
        ];
        
        for (const pattern of namePatterns) {
            const match = note.match(pattern);
            if (match && match[1]) {
                showCustomerName = true;
                customerNameFromNote = match[1].trim();
                break;
            }
        }
    });
    
    labelDiv.innerHTML = `
        ${logoHTML}
        <div class="text-container">
            <div class="item-name-prominent">${itemName}</div>
            ${sizeDisplayHTML}
            ${notesDisplayHTML}
            ${showCustomerName ? `<div class="customer-name-note">For: ${customerNameFromNote}</div>` : ''}
        </div>
    `;
    return labelDiv;
}

// --- Event Listeners ---
if (generateLabelsButton) {
    generateLabelsButton.addEventListener('click', () => {
        console.log("[Generate Preview Button] Clicked."); // Log button click

        if (currentOrderData && currentOrderData.items && currentOrderData.items.length > 0) {
            console.log("[Generate Preview Button] currentOrderData is valid. Items count:", currentOrderData.items.length);
            // console.log("[Generate Preview Button] currentOrderData (raw):", JSON.parse(JSON.stringify(currentOrderData))); // Can be very verbose

            processedLabelItems = processOrderItemsForLabeling(currentOrderData.items);
            // console.log("[Generate Preview Button] processedLabelItems after processing:", JSON.parse(JSON.stringify(processedLabelItems))); // Can be very verbose
            console.log("[Generate Preview Button] Number of items processed for labels:", processedLabelItems.length);

            renderOrderSummaryItems(); 
            console.log("[Generate Preview Button] renderOrderSummaryItems() called.");
        } else {
            console.warn("[Generate Preview Button] No valid currentOrderData or no items found to process.");
            console.log("[Generate Preview Button] currentOrderData state:", currentOrderData); 
            processedLabelItems = []; // Clear if no data
            renderOrderSummaryItems(); 
            console.log("[Generate Preview Button] Cleared processedLabelItems and re-rendered summary.");
        }
        generateLabelsPreview();
        console.log("[Generate Preview Button] generateLabelsPreview() called and finished.");
    });
} else {
    console.error("Generate Labels Button (generateLabelsButton) not found in the DOM.");
}

if (printLabelsButton) {
    printLabelsButton.addEventListener('click', () => {
        console.log("[Print Labels Button] Clicked.");
        if (currentOrderData && currentOrderData.items && processedLabelItems.length === 0) {
            console.log("[Print Labels Button] Processing items before printing as processedLabelItems is empty.");
            processedLabelItems = processOrderItemsForLabeling(currentOrderData.items);
            renderOrderSummaryItems();
            // generateLabelsPreview(); // Preview is optional here, prepareForPrint will build fresh
        } else if (currentOrderData && currentOrderData.items && processedLabelItems.length > 0) {
            console.log("[Print Labels Button] Using already processed items for printing.");
        } else {
            console.warn("[Print Labels Button] No currentOrderData or no items to process for printing.");
            // Potentially show a message to the user or prevent printing
        }
        prepareForPrint(); 
    });
} else {
    console.error("Print Labels Button (printLabelsButton) not found in the DOM.");
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Label Printer Page Loaded (V5.2.3). Attempting to retrieve order data...");
    if(!selectedOrderNameEl) console.warn("DOM Element 'selectedOrderName' not found during init.");
    if(!orderItemsListEl) console.warn("DOM Element 'orderItemsList' not found during init.");
    if(!labelSheetPreviewEl) console.warn("DOM Element 'labelSheetPreview' not found during init.");


    chrome.storage.local.get('currentOrderForLabels', (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving data from storage:", chrome.runtime.lastError.message);
            if(selectedOrderNameEl) selectedOrderNameEl.textContent = "Error loading";
            if(orderItemsListEl) orderItemsListEl.innerHTML = '<p class="placeholder-text">Could not load order data.</p>';
            return;
        }

        if (result.currentOrderForLabels) {
            currentOrderData = result.currentOrderForLabels;
            console.log("Initial order data retrieved:", JSON.parse(JSON.stringify(currentOrderData)));

            if(selectedOrderNameEl) selectedOrderNameEl.textContent = `${currentOrderData.restaurantName || 'Restaurant'}`;

            processedLabelItems = processOrderItemsForLabeling(currentOrderData.items);
            console.log("Initial processing complete. Processed items count:", processedLabelItems.length);
            renderOrderSummaryItems();
            generateLabelsPreview();
            console.log("Initial preview generated.");
        } else {
            console.log("No order data found in storage.");
            if(selectedOrderNameEl) selectedOrderNameEl.textContent = "No Order Loaded";
            if(orderItemsListEl) orderItemsListEl.innerHTML = '<p class="placeholder-text">No order data found. Please open from the extension on an order page.</p>';
            if(labelSheetPreviewEl) {
                labelSheetPreviewEl.innerHTML = `<div class="label-placeholder-message">No order loaded. Please use the extension on an order page.</div>`;
            }
        }
    });
});

window.addEventListener('afterprint', () => {
    console.log("Printing finished or cancelled (V5.2.3).");
    const printContainerWrapper = document.querySelector('.print-only-container-wrapper');
    if (printContainerWrapper) {
        // printContainerWrapper.innerHTML = ''; // Decide if you want to clear it after printing
    }
});

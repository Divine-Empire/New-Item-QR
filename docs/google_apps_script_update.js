/**
 * Google Apps Script - Add this to your existing Apps Script
 * 
 * This handles the 'updateByMatch' action to update rows by matching a value in a column
 * 
 * Add this function to your doPost() handler:
 */

// Add this case in your doPost switch statement:
/*
case 'updateByMatch':
  return handleUpdateByMatch(e);
*/

function handleUpdateByMatch(e) {
    try {
        const sheetName = e.parameter.sheetName || "Generated Item QR";
        const searchColumn = e.parameter.searchColumn || "B"; // Column letter (B for Serial No)
        const searchValue = e.parameter.searchValue; // The value to search for (e.g., "SN-0001")
        const updates = JSON.parse(e.parameter.updates || "[]"); // Array of {column, value}

        if (!searchValue) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: "searchValue is required"
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Get the spreadsheet and sheet
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: "Sheet not found: " + sheetName
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Convert column letter to index (A=1, B=2, etc.)
        const searchColIndex = searchColumn.toUpperCase().charCodeAt(0) - 64;

        // Get all data in the search column (starting from row 2)
        const lastRow = sheet.getLastRow();
        const searchRange = sheet.getRange(2, searchColIndex, lastRow - 1, 1); // Start from row 2
        const searchData = searchRange.getValues();

        // Find the row with matching value
        let foundRow = -1;
        for (let i = 0; i < searchData.length; i++) {
            if (searchData[i][0] === searchValue || searchData[i][0].toString() === searchValue) {
                foundRow = i + 2; // +2 because we started from row 2 (1-indexed)
                break;
            }
        }

        if (foundRow === -1) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: "No matching row found for: " + searchValue
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Apply updates to the found row
        updates.forEach(function (update) {
            const colIndex = update.column.toUpperCase().charCodeAt(0) - 64;
            sheet.getRange(foundRow, colIndex).setValue(update.value);
        });

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            status: 'success',
            message: "Updated row " + foundRow + " for " + searchValue,
            row: foundRow,
            updates: updates.length
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Example of how to integrate with existing doPost:
 */
function doPost(e) {
    const action = e.parameter.action;

    switch (action) {
        case 'insert':
            return handleInsert(e);
        case 'updateByMatch':
            return handleUpdateByMatch(e);
        // ... other cases
        default:
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: "Unknown action: " + action
            })).setMimeType(ContentService.MimeType.JSON);
    }
}

import { config } from './config.js';

const cache = {
    data: null,
    timestamp: 0,
};

function sheetValuesToObjects(values, headerMap) {
    if (!values || values.length < 2) return [];
    const headers = values[0];
    return values.slice(1).map((row, index) => {
        const obj = { _row: index + 2 }; // Store original row number
        headers.forEach((header, i) => {
            const propName = headerMap[header.trim()];
            if (propName) obj[propName] = row[i] || "";
        });
        return obj;
    });
}

function objectToSheetRow(obj, headerMap) {
    const headers = Object.keys(headerMap);
    return headers.map(header => obj[headerMap[header]] || "");
}

async function updateRowInSheet(sheetName, rowIndex, dataObject, headerMap) {
    const rowData = objectToSheetRow(dataObject, headerMap);
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: config.google.SPREADSHEET_ID,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [rowData] }
    });
    cache.data = null; // Invalidate cache
}

async function appendRowToSheet(sheetName, dataObject, headerMap) {
    const rowData = objectToSheetRow(dataObject, headerMap);
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: config.google.SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [rowData] },
    });
    cache.data = null; // Invalidate cache
}

async function deleteSheetRow(sheetName, rowIndex) {
    const sheetId = await getSheetId(sheetName);
    if (sheetId === null) throw new Error(`Sheet ${sheetName} not found.`);

    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.google.SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: { sheetId, dimension: 'ROWS', startIndex: rowIndex - 1, endIndex: rowIndex }
                }
            }]
        }
    });
    cache.data = null; // Invalidate cache
}

let sheetIdCache = {};
async function getSheetId(sheetName) {
    if (sheetIdCache[sheetName]) return sheetIdCache[sheetName];
    const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: config.google.SPREADSHEET_ID,
        fields: 'sheets/properties'
    });
    const sheet = response.result.sheets.find(s => s.properties.title === sheetName);
    if (sheet) {
        sheetIdCache[sheetName] = sheet.properties.sheetId;
        return sheet.properties.sheetId;
    }
    return null;
}

export async function loadAllData(forceRefresh = false) {
    if (!forceRefresh && cache.data && (Date.now() - cache.timestamp < config.cacheDuration)) {
        return cache.data;
    }

    const response = await gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: config.google.SPREADSHEET_ID,
        ranges: [config.sheetNames.PROJECTS, config.sheetNames.USERS, config.sheetNames.DISPUTES],
    });

    const valueRanges = response.result.valueRanges;
    const data = {
        projects: sheetValuesToObjects(valueRanges[0].values, config.HEADER_MAP),
        users: sheetValuesToObjects(valueRanges[1].values, config.USER_HEADER_MAP),
        disputes: sheetValuesToObjects(valueRanges[2].values, config.DISPUTE_HEADER_MAP),
    };

    cache.data = data;
    cache.timestamp = Date.now();
    return data;
}

export async function addProjects(projectData) {
    const newProjectRows = [];
    for (let i = 1; i <= projectData.numRows; i++) {
        const newProject = {
            id: `proj_${Date.now()}_${i}`,
            fixCategory: projectData.fixCategory,
            baseProjectName: projectData.baseProjectName,
            areaTask: `Area${String(i).padStart(2, '0')}`,
            gsd: projectData.gsd,
            status: "Available",
        };
        newProjectRows.push(objectToSheetRow(newProject, config.HEADER_MAP));
    }
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: config.google.SPREADSHEET_ID,
        range: `${config.sheetNames.PROJECTS}!A1`, valueInputOption: 'USER_ENTERED',
        resource: { values: newProjectRows },
    });
    cache.data = null;
}

export async function updateProject(project, updates) {
    const updatedProject = { ...project, ...updates, lastModifiedTimestamp: new Date().toISOString() };
    
    if (Object.keys(updates).some(k => k.includes('Time'))) {
        updatedProject.totalMinutes = calculateTotalMinutes(updatedProject);
    }
    
    await updateRowInSheet(config.sheetNames.PROJECTS, project._row, updatedProject, config.HEADER_MAP);
    return updatedProject;
}

export const saveUser = (user) => user._row ? updateRowInSheet(config.sheetNames.USERS, user._row, user, config.USER_HEADER_MAP) : appendRowToSheet(config.sheetNames.USERS, user, config.USER_HEADER_MAP);
export const deleteUser = (user) => deleteSheetRow(config.sheetNames.USERS, user._row);
export const addDispute = (dispute) => appendRowToSheet(config.sheetNames.DISPUTES, dispute, config.DISPUTE_HEADER_MAP);
export const updateDispute = (dispute) => updateRowInSheet(config.sheetNames.DISPUTES, dispute._row, dispute, config.DISPUTE_HEADER_MAP);

// --- HELPER FUNCTIONS ---

function calculateTotalMinutes(project) {
    let total = 0;
    for (let i = 1; i <= 3; i++) {
        const start = parseTimeToMinutes(project[`startTimeDay${i}`]);
        const finish = parseTimeToMinutes(project[`finishTimeDay${i}`]);
        if (start && finish) {
            let diff = finish - start;
            if (diff < 0) diff += 24 * 60; // Handles overnight work
            total += diff;
        }
    }
    return total > 0 ? total : '';
}

function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    // Handles "HH:MM" format
    const timeParts = timeStr.split(':');
    if (timeParts.length === 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
            return hours * 60 + minutes;
        }
    }
    return 0;
}

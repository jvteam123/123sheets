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

export async function loadAllData(forceRefresh = false) {
    if (!forceRefresh && cache.data && (Date.now() - cache.timestamp < config.cacheDuration)) {
        return cache.data;
    }

    const response = await gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: config.google.SPREADSHEET_ID,
        ranges: [config.sheetNames.PROJECTS, config.sheetNames.USERS],
    });

    const valueRanges = response.result.valueRanges;
    const projectsData = valueRanges.find(range => range.range.startsWith(config.sheetNames.PROJECTS));
    const usersData = valueRanges.find(range => range.range.startsWith(config.sheetNames.USERS));

    const data = {
        projects: projectsData ? sheetValuesToObjects(projectsData.values, config.HEADER_MAP) : [],
        users: usersData ? sheetValuesToObjects(usersData.values, config.USER_HEADER_MAP) : [],
    };

    cache.data = data;
    cache.timestamp = Date.now();
    return data;
}

export async function addProjects(projectData) {
    const newRows = [];
    for (let i = 1; i <= projectData.numRows; i++) {
        newRows.push([
            `proj_${Date.now()}_${i}`,
            projectData.fixCategory,
            projectData.baseProjectName,
            `Area${String(i).padStart(2, '0')}`,
            projectData.gsd,
            '', // Assigned To
            'Available', // Status
        ]);
    }

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: config.google.SPREADSHEET_ID,
        range: `${config.sheetNames.PROJECTS}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: newRows },
    });
    
    // Invalidate cache
    cache.data = null;

    // We can return a representation of the new projects, but a full reload is safer for now
    return newRows.map(row => ({
        id: row[0], fixCategory: row[1], baseProjectName: row[2], areaTask: row[3], gsd: row[4], status: row[6]
    }));
}

export async function updateProject(project, updates) {
    const headersResult = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: config.google.SPREADSHEET_ID,
        range: `${config.sheetNames.PROJECTS}!1:1`,
    });
    const headers = headersResult.result.values[0];

    const updatedProject = { ...project, ...updates, lastModifiedTimestamp: new Date().toISOString() };
    
    // Recalculate total minutes if time was changed
    if ('startTimeDay1' in updates || 'finishTimeDay1' in updates) {
        updatedProject.totalMinutes = calculateTotalMinutes(updatedProject);
    }
    
    const values = [headers.map(header => updatedProject[config.HEADER_MAP[header.trim()]] || "")];
    
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: config.google.SPREADSHEET_ID,
        range: `${config.sheetNames.PROJECTS}!A${project._row}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: values }
    });
    
    // Invalidate cache
    cache.data = null;
    return updatedProject;
}

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
    const time = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!time) return 0;
    
    let [, hours, minutes, ampm] = time;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

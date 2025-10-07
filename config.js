export const config = {
    google: {
        API_KEY: "YOUR_API_KEY_HERE",
        CLIENT_ID: "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
        SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE",
        SCOPES: "https://www.googleapis.com/auth/spreadsheets",
    },
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    sheetNames: {
        PROJECTS: "Projects",
        USERS: "Users",
    },
    HEADER_MAP: { 
        'id': 'id', 'Fix Cat': 'fixCategory', 'Project Name': 'baseProjectName', 'Area/Task': 'areaTask', 
        'GSD': 'gsd', 'Assigned To': 'assignedTo', 'Status': 'status', 
        'Day 1 Start': 'startTimeDay1', 'Day 1 Finish': 'finishTimeDay1', 
        'Day 2 Start': 'startTimeDay2', 'Day 2 Finish': 'finishTimeDay2',
        'Day 3 Start': 'startTimeDay3', 'Day 3 Finish': 'finishTimeDay3',
        'Total (min)': 'totalMinutes', 'Last Modified': 'lastModifiedTimestamp' 
    },
    USER_HEADER_MAP: { 'id': 'id', 'name': 'name', 'email': 'email', 'techId': 'techId' },
};

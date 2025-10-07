export const config = {
    google: {
        API_KEY: "AIzaSyBxlhWwf3mlS_6Q3BiUsfpH21AsbhVmDw8",
        CLIENT_ID: "221107133299-7r4vnbhpsdrnqo8tss0dqbtrr9ou683e.apps.googleusercontent.com",
        SPREADSHEET_ID: "1z0FplGBxS4AymonqsvLbTOZfY9xgLONF4SjSkMZ_ZPc",
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

import { config } from './config.js';

export const elements = {};

let customModalResolver = null;

export function setupDOMReferences(appInstance) {
    elements.signInBtn = document.getElementById('signInBtn');
    elements.signOutBtn = document.getElementById('signOutBtn');
    elements.authWrapper = document.getElementById('auth-wrapper');
    elements.dashboardWrapper = document.querySelector('.dashboard-wrapper');
    elements.loggedInUser = document.getElementById('loggedInUser');
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    
    elements.techDashboardContainer = document.getElementById('techDashboardContainer');
    elements.tlSummaryView = document.getElementById('tlSummaryView');
    elements.openDashboardBtn = document.getElementById('openDashboardBtn');
    elements.openTlSummaryBtn = document.getElementById('openTlSummaryBtn');
    
    elements.projectTableBody = document.getElementById('projectTableBody');
    elements.projectTableHead = document.querySelector('#projectTable thead tr');
    elements.summaryTableBody = document.getElementById('summaryTableBody');
    
    elements.projectFilter = document.getElementById('projectFilter');
    elements.fixCategoryFilter = document.getElementById('fixCategoryFilter');
    elements.searchBar = document.getElementById('searchBar');
    elements.dayCheckboxes = {
        2: document.getElementById('showDay2'),
        3: document.getElementById('showDay3'),
    };
    elements.refreshDataBtn = document.getElementById('refreshDataBtn');

    // Modals
    elements.projectFormModal = document.getElementById('projectFormModal');
    elements.newProjectForm = document.getElementById('newProjectForm');
    elements.openNewProjectModalBtn = document.getElementById('openNewProjectModalBtn');
    elements.timeEditModal = document.getElementById('timeEditModal');
    elements.timeEditForm = document.getElementById('timeEditForm');
    elements.timeEditTitle = document.getElementById('timeEditTitle');
    elements.timeEditProjectId = document.getElementById('timeEditProjectId');
    elements.timeEditDay = document.getElementById('timeEditDay');
    elements.editStartTime = document.getElementById('editStartTime');
    elements.editFinishTime = document.getElementById('editFinishTime');
    elements.editStartTimeAmPm = document.getElementById('editStartTimeAmPm');
    elements.editFinishTimeAmPm = document.getElementById('editFinishTimeAmPm');

    // Custom Modal Elements
    elements.customModal = document.getElementById('customModal');
    elements.customModalTitle = document.getElementById('customModalTitle');
    elements.customModalBody = document.getElementById('customModalBody');
    elements.customModalPromptContainer = document.getElementById('customModalPromptContainer');
    elements.customModalFooter = document.getElementById('customModalFooter');
    elements.customModalConfirm = document.getElementById('customModalConfirm');
    elements.customModalCancel = document.getElementById('customModalCancel');

    // Setup custom modal event listeners
    elements.customModalConfirm.onclick = () => {
        const input = elements.customModalPromptContainer.querySelector('input');
        resolveCustomModal(input ? input.value : true);
    };
    elements.customModalCancel.onclick = () => resolveCustomModal(false);
}

export function showAuthScreen() {
    elements.authWrapper.style.display = 'block';
    elements.dashboardWrapper.style.display = 'none';
    document.body.classList.add('login-view-active');
}

export function showMainApp() {
    elements.authWrapper.style.display = 'none';
    elements.dashboardWrapper.style.display = 'flex';
    document.body.classList.remove('login-view-active');
}

export function switchView(viewName, state) {
    elements.techDashboardContainer.style.display = 'none';
    elements.tlSummaryView.style.display = 'none';
    elements.openDashboardBtn.classList.remove('active');
    elements.openTlSummaryBtn.classList.remove('active');

    if (viewName === 'dashboard') {
        elements.techDashboardContainer.style.display = 'flex';
        elements.openDashboardBtn.classList.add('active');
    } else if (viewName === 'summary') {
        renderTlSummary(state.projects);
        elements.tlSummaryView.style.display = 'block';
        elements.openTlSummaryBtn.classList.add('active');
    }
}

export function populateFilterDropdowns(state) {
    const projects = [...new Set(state.projects.map(p => p.baseProjectName).filter(Boolean))].sort();
    elements.projectFilter.innerHTML = '<option value="All">All Projects</option>' + projects.map(p => `<option value="${p}">${p}</option>`).join('');

    const fixCategories = [...new Set(state.projects.map(p => p.fixCategory).filter(Boolean))].sort();
    elements.fixCategoryFilter.innerHTML = '<option value="All">All</option>' + fixCategories.map(c => `<option value="${c}">${c}</option>`).join('');
}

export function renderContent(state) {
    let filteredProjects = [...state.projects];
    
    // Apply filters
    if (state.filters.project !== 'All') {
        filteredProjects = filteredProjects.filter(p => p.baseProjectName === state.filters.project);
    }
    if (state.filters.fixCategory !== 'All') {
        filteredProjects = filteredProjects.filter(p => p.fixCategory === state.filters.fixCategory);
    }
    if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(p =>
            (p.baseProjectName && p.baseProjectName.toLowerCase().includes(searchTerm)) ||
            (p.areaTask && p.areaTask.toLowerCase().includes(searchTerm)) ||
            (p.assignedTo && p.assignedTo.toLowerCase().includes(searchTerm))
        );
    }
    
    renderProjects(filteredProjects, state);
    renderTlSummary(state.projects); // Summary should always show all projects
}

function renderProjects(projectsToRender, state) {
    elements.projectTableBody.innerHTML = "";
    
    const headers = ['Fix Cat', 'Project Name', 'Area/Task', 'GSD', 'Assigned To', 'Status'];
    for (let i = 1; i <= 3; i++) {
        if (i === 1 || state.filters.showDays[i]) {
            headers.push(`Day ${i} Start`, `Day ${i} Finish`);
        }
    }
    headers.push('Total (min)', 'Actions');
    elements.projectTableHead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

    if (projectsToRender.length === 0) {
        const row = elements.projectTableBody.insertRow();
        row.innerHTML = `<td colspan="${headers.length}" style="text-align:center;">No projects found.</td>`;
        return;
    }

    projectsToRender.forEach(project => {
        const row = elements.projectTableBody.insertRow();
        const fixNum = parseInt((project.fixCategory || 'Fix0').replace('Fix', ''), 10);
        row.className = `fix-stage-${fixNum}`;

        row.insertCell().textContent = project.fixCategory || '';
        row.insertCell().textContent = project.baseProjectName || '';
        row.insertCell().textContent = project.areaTask || '';
        row.insertCell().textContent = project.gsd || '';
        
        // Assigned To Dropdown
        const assignedToCell = row.insertCell();
        const select = document.createElement('select');
        select.innerHTML = '<option value="">Available</option>' + state.users.map(u => `<option value="${u.techId}" ${project.assignedTo === u.techId ? 'selected' : ''}>${u.name}</option>`).join('');
        select.onchange = (e) => window.App.handleProjectUpdate(project.id, { 'assignedTo': e.target.value });
        assignedToCell.appendChild(select);

        row.insertCell().innerHTML = `<span class="status status-${(project.status || 'available').toLowerCase()}">${project.status}</span>`;

        for (let i = 1; i <= 3; i++) {
            if (i === 1 || state.filters.showDays[i]) {
                const startCell = row.insertCell();
                startCell.className = 'time-cell';
                startCell.innerHTML = `${project[`startTimeDay${i}`] || ''} <i class="fas fa-pencil-alt edit-icon" onclick="window.App.openTimeEditModal('${project.id}', ${i})"></i>`;

                const finishCell = row.insertCell();
                finishCell.className = 'time-cell';
                finishCell.innerHTML = `${project[`finishTimeDay${i}`] || ''} <i class="fas fa-pencil-alt edit-icon" onclick="window.App.openTimeEditModal('${project.id}', ${i})"></i>`;
            }
        }
        
        row.insertCell().textContent = project.totalMinutes || '';

        // Actions
        const actionsCell = row.insertCell();
        const btnGroup = document.createElement('div');
        btnGroup.className = 'actions-btn-group';
        
        for (let i = 1; i <= 3; i++) {
             if (i === 1 || state.filters.showDays[i]) {
                const startBtn = document.createElement('button');
                startBtn.textContent = `Start D${i}`;
                startBtn.className = 'btn btn-primary btn-small';
                startBtn.disabled = project.status !== 'Available' || !project.assignedTo;
                startBtn.onclick = () => window.App.handleProjectUpdate(project.id, { status: `InProgressDay${i}`, [`startTimeDay${i}`]: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
                btnGroup.appendChild(startBtn);

                const endBtn = document.createElement('button');
                endBtn.textContent = `End D${i}`;
                endBtn.className = 'btn btn-warning btn-small';
                endBtn.disabled = project.status !== `InProgressDay${i}`;
                endBtn.onclick = () => window.App.handleProjectUpdate(project.id, { status: 'Completed', [`finishTimeDay${i}`]: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
                btnGroup.appendChild(endBtn);
             }
        }
        actionsCell.appendChild(btnGroup);
    });
}

function renderTlSummary(projects) {
    elements.summaryTableBody.innerHTML = "";
    const groupedByProject = projects.reduce((acc, project) => {
        const key = project.baseProjectName || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
    }, {});

    Object.keys(groupedByProject).sort().forEach(projectName => {
        const headerRow = elements.summaryTableBody.insertRow();
        headerRow.className = 'summary-project-header';
        headerRow.innerHTML = `<td colspan="6">${projectName}</td>`;

        const tasks = groupedByProject[projectName];
        const groupedByFix = tasks.reduce((acc, task) => {
            const key = task.fixCategory || 'Uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(task);
            return acc;
        }, {});
        
        Object.keys(groupedByFix).sort().forEach(fixKey => {
            const stageTasks = groupedByFix[fixKey];
            const totalTasks = stageTasks.length;
            const completedTasks = stageTasks.filter(p => p.status === 'Completed').length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const totalMinutes = stageTasks.reduce((sum, task) => sum + (parseInt(task.totalMinutes, 10) || 0), 0);
            
            const row = elements.summaryTableBody.insertRow();
            const fixNum = parseInt(fixKey.replace('Fix', ''), 10);
            row.className = `summary-stage-row fix-stage-${fixNum}`;

            row.insertCell().textContent = fixKey;
            row.insertCell().textContent = totalTasks;
            row.insertCell().textContent = completedTasks;
            const progressCell = row.insertCell();
            progressCell.innerHTML = `<div class="progress-bar"><div class="progress-bar-fill" style="width: ${progress}%;">${progress.toFixed(0)}%</div></div>`;
            row.insertCell().textContent = totalMinutes;
            row.insertCell().textContent = (totalMinutes / 60).toFixed(2);
        });
    });
}

export function openTimeEditModal(project, day) {
    if (!project) return;
    elements.timeEditProjectId.value = project.id;
    elements.timeEditDay.value = day;
    elements.timeEditTitle.textContent = `Edit Day ${day} Time for ${project.areaTask}`;
    
    const startTimeStr = project[`startTimeDay${day}`] || '';
    const finishTimeStr = project[`finishTimeDay${day}`] || '';
    
    const [startTime, startAmPm] = startTimeStr.split(' ');
    const [finishTime, finishAmPm] = finishTimeStr.split(' ');

    elements.editStartTime.value = startTime || '';
    elements.editStartTimeAmPm.value = startAmPm || 'AM';
    elements.editFinishTime.value = finishTime || '';
    elements.editFinishTimeAmPm.value = finishAmPm || 'PM';

    openModal('timeEditModal');
}

export function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('is-open');
}

export function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('is-open');
}

export function showLoading(message) {
    elements.loadingOverlay.querySelector('p').textContent = message;
    elements.loadingOverlay.classList.add('is-open');
}

export function hideLoading() {
    elements.loadingOverlay.classList.remove('is-open');
}

// Custom Modals
export function showCustomAlert(message, title = "Alert") {
    elements.customModalTitle.textContent = title;
    elements.customModalBody.textContent = message;
    elements.customModalCancel.style.display = 'none';
    elements.customModalConfirm.textContent = 'OK';
    elements.customModalPromptContainer.innerHTML = '';
    openModal('customModal');

    return new Promise(resolve => {
        customModalResolver = resolve;
    });
}

export function showCustomConfirm(message, title = "Confirmation") {
    elements.customModalTitle.textContent = title;
    elements.customModalBody.textContent = message;
    elements.customModalCancel.style.display = 'inline-block';
    elements.customModalConfirm.textContent = 'Confirm';
    elements.customModalPromptContainer.innerHTML = '';
    openModal('customModal');
    
    return new Promise(resolve => {
        customModalResolver = resolve;
    });
}

function resolveCustomModal(value) {
    if (customModalResolver) {
        customModalResolver(value);
    }
    closeModal('customModal');
}

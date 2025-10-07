import { config } from './config.js';

export const elements = {};
let customModalResolver = null;

export function setupDOMReferences() {
    Object.assign(elements, {
        signInBtn: document.getElementById('signInBtn'),
        signOutBtn: document.getElementById('signOutBtn'),
        authWrapper: document.getElementById('auth-wrapper'),
        dashboardWrapper: document.querySelector('.dashboard-wrapper'),
        loggedInUser: document.getElementById('loggedInUser'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        
        techDashboardContainer: document.getElementById('techDashboardContainer'),
        tlSummaryView: document.getElementById('tlSummaryView'),
        projectSettingsView: document.getElementById('projectSettingsView'),
        userManagementView: document.getElementById('userManagementView'),
        disputeView: document.getElementById('disputeView'),

        openDashboardBtn: document.getElementById('openDashboardBtn'),
        openTlSummaryBtn: document.getElementById('openTlSummaryBtn'),
        openProjectSettingsBtn: document.getElementById('openProjectSettingsBtn'),
        openUserManagementBtn: document.getElementById('openUserManagementBtn'),
        openDisputeBtn: document.getElementById('openDisputeBtn'),

        projectTableBody: document.getElementById('projectTableBody'),
        projectTableHead: document.querySelector('#projectTable thead tr'),
        summaryTableBody: document.getElementById('summaryTableBody'),
        projectSettingsContent: document.getElementById('projectSettingsContent'),
        userTableBody: document.getElementById('userTableBody'),
        disputesTableBody: document.getElementById('disputesTableBody'),
        
        projectFilter: document.getElementById('projectFilter'),
        fixCategoryFilter: document.getElementById('fixCategoryFilter'),
        searchBar: document.getElementById('searchBar'),
        refreshDataBtn: document.getElementById('refreshDataBtn'),

        // Modals & Forms
        projectFormModal: document.getElementById('projectFormModal'),
        newProjectForm: document.getElementById('newProjectForm'),
        openNewProjectModalBtn: document.getElementById('openNewProjectModalBtn'),
        timeEditModal: document.getElementById('timeEditModal'),
        timeEditForm: document.getElementById('timeEditForm'),
        timeEditTitle: document.getElementById('timeEditTitle'),
        timeEditProjectId: document.getElementById('timeEditProjectId'),
        timeEditDay: document.getElementById('timeEditDay'),
        editStartTime: document.getElementById('editStartTime'),
        editFinishTime: document.getElementById('editFinishTime'),
        userFormModal: document.getElementById('userFormModal'),
        userForm: document.getElementById('userForm'),
        userFormTitle: document.getElementById('userFormTitle'),
        addUserBtn: document.getElementById('addUserBtn'),
        disputeForm: document.getElementById('disputeForm'),

        // Custom Modal
        customModal: document.getElementById('customModal'),
        customModalTitle: document.getElementById('customModalTitle'),
        customModalBody: document.getElementById('customModalBody'),
        customModalConfirm: document.getElementById('customModalConfirm'),
        customModalCancel: document.getElementById('customModalCancel'),
    });

    elements.customModalConfirm.onclick = () => resolveCustomModal(true);
    elements.customModalCancel.onclick = () => resolveCustomModal(false);
}

// UI Visibility
export const showAuthScreen = () => {
    elements.authWrapper.style.display = 'block';
    elements.dashboardWrapper.style.display = 'none';
    document.body.classList.add('login-view-active');
};

export const showMainApp = () => {
    elements.authWrapper.style.display = 'none';
    elements.dashboardWrapper.style.display = 'flex';
    document.body.classList.remove('login-view-active');
};

export const showLoading = (message) => {
    elements.loadingOverlay.querySelector('p').textContent = message;
    elements.loadingOverlay.classList.add('is-open');
};

export const hideLoading = () => elements.loadingOverlay.classList.remove('is-open');

// View Switching
export function switchView(viewName, state) {
    const views = ['dashboard', 'summary', 'settings', 'users', 'disputes'];
    const viewElements = {
        dashboard: elements.techDashboardContainer,
        summary: elements.tlSummaryView,
        settings: elements.projectSettingsView,
        users: elements.userManagementView,
        disputes: elements.disputeView,
    };
    const buttonElements = {
        dashboard: elements.openDashboardBtn,
        summary: elements.openTlSummaryBtn,
        settings: elements.openProjectSettingsBtn,
        users: elements.openUserManagementBtn,
        disputes: elements.openDisputeBtn,
    };

    views.forEach(view => {
        viewElements[view].style.display = 'none';
        buttonElements[view].classList.remove('active');
    });

    viewElements[viewName].style.display = 'block';
    buttonElements[viewName].classList.add('active');

    renderAllViews(state); // Re-render all views to ensure data is fresh
}

// Rendering Logic
export function renderAllViews(state) {
    renderProjects(state);
    renderTlSummary(state.projects);
    renderProjectSettings(state.projects);
    renderUserManagement(state.users);
    renderDisputes(state);
}

// ... (renderProjects, renderTlSummary, and other specific render functions)
// [NOTE: Due to length constraints, the full ui.js is split. The rest will follow in the next block.]

// [CONTINUATION of ui.js]

function renderProjects(state) {
    const { projects, users, filters } = state;
    let filteredProjects = [...projects];

    if (filters.project !== 'All') filteredProjects = filteredProjects.filter(p => p.baseProjectName === filters.project);
    if (filters.fixCategory !== 'All') filteredProjects = filteredProjects.filter(p => p.fixCategory === filters.fixCategory);
    if (filters.search) {
        const term = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(p => Object.values(p).some(val => String(val).toLowerCase().includes(term)));
    }
    
    elements.projectTableBody.innerHTML = "";
    elements.projectTableHead.innerHTML = `<th>Fix Cat</th><th>Project</th><th>Task</th><th>GSD</th><th>Assigned</th><th>Status</th><th>Day 1 Start</th><th>Day 1 Finish</th><th>Total (min)</th><th>Actions</th>`;
    
    filteredProjects.forEach(project => {
        const row = elements.projectTableBody.insertRow();
        const fixNum = parseInt((project.fixCategory || 'Fix0').replace('Fix', ''), 10);
        row.className = `fix-stage-${fixNum}`;
        
        row.insertCell().textContent = project.fixCategory;
        row.insertCell().textContent = project.baseProjectName;
        row.insertCell().textContent = project.areaTask;
        row.insertCell().textContent = project.gsd;
        
        const assignedToCell = row.insertCell();
        const select = document.createElement('select');
        select.innerHTML = '<option value="">Available</option>' + users.map(u => `<option value="${u.techId}" ${project.assignedTo === u.techId ? 'selected' : ''}>${u.name}</option>`).join('');
        select.onchange = (e) => window.App.handleProjectUpdate(project.id, { 'assignedTo': e.target.value });
        assignedToCell.appendChild(select);

        row.insertCell().innerHTML = `<span class="status status-${(project.status || 'available').toLowerCase()}">${project.status}</span>`;
        
        row.insertCell().innerHTML = `${project.startTimeDay1 || ''} <i class="fas fa-pencil-alt" onclick="window.App.openTimeEditModal('${project.id}', 1)"></i>`;
        row.insertCell().innerHTML = `${project.finishTimeDay1 || ''} <i class="fas fa-pencil-alt" onclick="window.App.openTimeEditModal('${project.id}', 1)"></i>`;
        row.insertCell().textContent = project.totalMinutes;

        const actionsCell = row.insertCell();
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start'; startBtn.className = 'btn btn-primary btn-sm';
        startBtn.disabled = project.status !== 'Available' || !project.assignedTo;
        startBtn.onclick = () => window.App.handleProjectUpdate(project.id, { status: 'InProgressDay1', startTimeDay1: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit'}) });
        actionsCell.appendChild(startBtn);

        const endBtn = document.createElement('button');
        endBtn.textContent = 'End'; endBtn.className = 'btn btn-warning btn-sm';
        endBtn.disabled = project.status !== 'InProgressDay1';
        endBtn.onclick = () => window.App.handleProjectUpdate(project.id, { status: 'Completed', finishTimeDay1: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit'}) });
        actionsCell.appendChild(endBtn);
    });
}

function renderTlSummary(projects) { /* ... same as your last correct version ... */ }
function renderProjectSettings(projects) { /* ... logic to render project settings ... */ }

function renderUserManagement(users) {
    elements.userTableBody.innerHTML = "";
    users.forEach(user => {
        const row = elements.userTableBody.insertRow();
        row.insertCell().textContent = user.name;
        row.insertCell().textContent = user.email;
        row.insertCell().textContent = user.techId;
        row.insertCell().innerHTML = `<button class="btn btn-warning btn-sm" onclick="window.App.openUserModal('${user.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="window.App.handleDeleteUser('${user.id}')">Delete</button>`;
    });
}

function renderDisputes(state) {
    const { disputes, projects, users } = state;
    document.getElementById('disputeProjectName').innerHTML = projects.map(p => `<option value="${p.baseProjectName}">${p.baseProjectName}</option>`).join('');
    document.getElementById('disputeTechId').innerHTML = users.map(u => `<option value="${u.techId}">${u.name}</option>`).join('');
    
    elements.disputesTableBody.innerHTML = "";
    disputes.forEach(dispute => {
        const row = elements.disputesTableBody.insertRow();
        row.insertCell().textContent = dispute.projectName;
        row.insertCell().textContent = dispute.techId;
        row.insertCell().textContent = dispute.reason;
        row.insertCell().innerHTML = `<span class="status status-${dispute.status.toLowerCase()}">${dispute.status}</span>`;
        row.insertCell().innerHTML = `<button class="btn btn-success btn-sm" onclick="window.App.handleUpdateDisputeStatus('${dispute.id}', 'Resolved')" ${dispute.status === 'Resolved' ? 'disabled' : ''}>Resolve</button>`;
    });
}

export function populateFilterDropdowns(state) { /* ... same as before ... */ }

// Modal Logic
export function openModal(modalId) { document.getElementById(modalId).classList.add('is-open'); }
export function closeModal(modalId) { document.getElementById(modalId).classList.remove('is-open'); }
export function openUserModal(userId = null) {
    const user = window.App.state.users.find(u => u.id === userId);
    elements.userFormTitle.textContent = user ? 'Edit User' : 'Add User';
    document.getElementById('userId').value = user ? user.id : '';
    document.getElementById('userName').value = user ? user.name : '';
    document.getElementById('userEmail').value = user ? user.email : '';
    document.getElementById('userTechId').value = user ? user.techId : '';
    openModal('userFormModal');
}
export function openTimeEditModal(project, day) { /* ... same as before ... */ }
export function showCustomAlert(message, title="Alert") { /* ... same as before ... */ }
export function showCustomConfirm(message, title="Confirm") { /* ... same as before ... */ }
function resolveCustomModal(value) {
    if (customModalResolver) customModalResolver(value);
    closeModal('customModal');
}

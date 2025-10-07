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

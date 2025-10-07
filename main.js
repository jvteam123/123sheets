import * as auth from './auth.js';
import * as api from './api.js';
import * as ui from './ui.js';
import { showCustomConfirm } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const App = {
        state: {
            projects: [],
            users: [],
            isAppInitialized: false,
            filters: {
                project: 'All',
                fixCategory: 'All',
                showDays: { 1: true, 2: false, 3: false },
                search: '',
            },
        },

        init() {
            ui.setupDOMReferences(this);
            this.attachEventListeners();
            auth.initClient(this.handleAuthFlow.bind(this));
        },

        handleAuthFlow(isSignedIn) {
            if (isSignedIn) {
                this.handleAuthorizedUser();
            } else {
                this.handleSignedOutUser();
            }
        },

        attachEventListeners() {
            ui.elements.signInBtn.onclick = () => auth.handleAuthClick();
            ui.elements.signOutBtn.onclick = () => auth.handleSignoutClick();
            ui.elements.refreshDataBtn.onclick = () => this.loadData(true);
            
            ui.elements.openNewProjectModalBtn.onclick = () => ui.openModal('projectFormModal');
            ui.elements.newProjectForm.onsubmit = (e) => this.handleAddProjectSubmit(e);

            ui.elements.timeEditForm.onsubmit = (e) => this.handleTimeEditSubmit(e);
            
            ui.elements.openDashboardBtn.onclick = () => ui.switchView('dashboard', this.state);
            ui.elements.openTlSummaryBtn.onclick = () => ui.switchView('summary', this.state);

            ui.elements.projectFilter.onchange = () => this.filterAndRender();
            ui.elements.fixCategoryFilter.onchange = () => this.filterAndRender();
            ui.elements.searchBar.oninput = () => this.filterAndRender();
            ui.elements.dayCheckboxes[2].onchange = () => this.filterAndRender();
            ui.elements.dayCheckboxes[3].onchange = () => this.filterAndRender();

            // Add event listener for all close buttons on modals
            document.querySelectorAll('.close-btn').forEach(btn => {
                btn.onclick = () => ui.closeModal(btn.dataset.modalId);
            });
        },

        async handleAuthorizedUser() {
            ui.showMainApp();
            if (!this.state.isAppInitialized) {
                await this.loadData();
                this.state.isAppInitialized = true;
            } else {
                this.filterAndRender();
            }
        },

        handleSignedOutUser() {
            ui.showAuthScreen();
            this.state.isAppInitialized = false;
        },

        async loadData(forceRefresh = false) {
            ui.showLoading("Loading data...");
            try {
                const data = await api.loadAllData(forceRefresh);
                this.state.projects = data.projects;
                this.state.users = data.users;
                
                ui.populateFilterDropdowns(this.state);
                this.filterAndRender();
            } catch (err) {
                ui.showCustomAlert(`Error loading data: ${err.message}`);
                console.error(err);
            } finally {
                ui.hideLoading();
            }
        },

        filterAndRender() {
            this.state.filters.project = ui.elements.projectFilter.value;
            this.state.filters.fixCategory = ui.elements.fixCategoryFilter.value;
            this.state.filters.search = ui.elements.searchBar.value;
            this.state.filters.showDays[2] = ui.elements.dayCheckboxes[2].checked;
            this.state.filters.showDays[3] = ui.elements.dayCheckboxes[3].checked;

            ui.renderContent(this.state);
        },

        async handleAddProjectSubmit(event) {
            event.preventDefault();
            ui.showLoading("Adding project(s)...");

            const formData = new FormData(ui.elements.newProjectForm);
            const newProjectsData = {
                numRows: formData.get('numRows'),
                baseProjectName: formData.get('baseProjectName'),
                fixCategory: formData.get('fixCategory'),
                gsd: formData.get('gsd'),
            };

            try {
                const newProjects = await api.addProjects(newProjectsData);
                this.state.projects.push(...newProjects);
                
                ui.closeModal('projectFormModal');
                ui.elements.newProjectForm.reset();
                this.filterAndRender();
                ui.showCustomAlert(`Project "${newProjectsData.baseProjectName}" was created!`);
            } catch (error) {
                ui.showCustomAlert("Error adding projects: " + error.message);
            } finally {
                ui.hideLoading();
            }
        },

        async handleTimeEditSubmit(event) {
            event.preventDefault();
            const projectId = ui.elements.timeEditProjectId.value;
            const day = ui.elements.timeEditDay.value;
            const startTime = `${ui.elements.editStartTime.value} ${ui.elements.editStartTimeAmPm.value}`;
            const finishTime = `${ui.elements.editFinishTime.value} ${ui.elements.editFinishTimeAmPm.value}`;

            const updates = {
                [`startTimeDay${day}`]: startTime.trim(),
                [`finishTimeDay${day}`]: finishTime.trim(),
            };
            
            await this.handleProjectUpdate(projectId, updates);
            ui.closeModal('timeEditModal');
        },

        async handleProjectUpdate(projectId, updates) {
            ui.showLoading("Saving...");
            try {
                const project = this.state.projects.find(p => p.id === projectId);
                if (!project) throw new Error("Project not found");

                const updatedProject = await api.updateProject(project, updates);
                
                // Update local state
                Object.assign(project, updatedProject);
                this.filterAndRender();

            } catch(error) {
                ui.showCustomAlert("Failed to save changes.");
            } finally {
                ui.hideLoading();
            }
        },
    };

    App.init();

    // Make some functions globally accessible for inline HTML event handlers
    window.App = {
        handleProjectUpdate: App.handleProjectUpdate.bind(App),
        openTimeEditModal: (projectId, day) => {
            const project = App.state.projects.find(p => p.id === projectId);
            ui.openTimeEditModal(project, day);
        }
    };
});

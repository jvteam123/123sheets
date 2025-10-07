import * as auth from './auth.js';
import * as api from './api.js';
import * as ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const App = {
        state: {
            projects: [], users: [], disputes: [], isAppInitialized: false,
            filters: { project: 'All', fixCategory: 'All', search: '' },
        },

        init() {
            ui.setupDOMReferences(this);
            this.attachEventListeners();
            auth.initClient(this.handleAuthFlow.bind(this), ui.elements.signInBtn);
        },

        handleAuthFlow(isSignedIn) {
            isSignedIn ? this.handleAuthorizedUser() : this.handleSignedOutUser();
        },

        attachEventListeners() {
            ui.elements.signInBtn.onclick = auth.handleAuthClick;
            ui.elements.signOutBtn.onclick = auth.handleSignoutClick;
            ui.elements.refreshDataBtn.onclick = () => this.loadData(true);
            
            // Sidebar Navigation
            ui.elements.openDashboardBtn.onclick = () => ui.switchView('dashboard', this.state);
            ui.elements.openTlSummaryBtn.onclick = () => ui.switchView('summary', this.state);
            ui.elements.openProjectSettingsBtn.onclick = () => ui.switchView('settings', this.state);
            ui.elements.openUserManagementBtn.onclick = () => ui.switchView('users', this.state);
            ui.elements.openDisputeBtn.onclick = () => ui.switchView('disputes', this.state);

            // Modals & Forms
            ui.elements.openNewProjectModalBtn.onclick = () => ui.openModal('projectFormModal');
            ui.elements.newProjectForm.onsubmit = (e) => this.handleAddProjectSubmit(e);
            ui.elements.timeEditForm.onsubmit = (e) => this.handleTimeEditSubmit(e);
            ui.elements.addUserBtn.onclick = () => ui.openUserModal();
            ui.elements.userForm.onsubmit = (e) => this.handleUserFormSubmit(e);
            ui.elements.disputeForm.onsubmit = (e) => this.handleDisputeFormSubmit(e);

            // Filters
            ui.elements.projectFilter.onchange = this.filterAndRender.bind(this);
            ui.elements.fixCategoryFilter.onchange = this.filterAndRender.bind(this);
            ui.elements.searchBar.oninput = this.filterAndRender.bind(this);

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
                this.state = { ...this.state, ...data };
                ui.populateFilterDropdowns(this.state);
                this.filterAndRender();
            } catch (err) {
                ui.showCustomAlert(`Error loading data: ${err.message}`);
            } finally {
                ui.hideLoading();
            }
        },

        filterAndRender() {
            this.state.filters.project = ui.elements.projectFilter.value;
            this.state.filters.fixCategory = ui.elements.fixCategoryFilter.value;
            this.state.filters.search = ui.elements.searchBar.value;
            ui.renderAllViews(this.state);
        },
        
        // FORM HANDLERS
        async handleAddProjectSubmit(event) {
            event.preventDefault();
            ui.showLoading("Adding project...");
            try {
                const formData = new FormData(ui.elements.newProjectForm);
                await api.addProjects(Object.fromEntries(formData));
                ui.closeModal('projectFormModal');
                ui.elements.newProjectForm.reset();
                await this.loadData(true);
            } catch (error) { ui.showCustomAlert("Error: " + error.message); } 
            finally { ui.hideLoading(); }
        },

        async handleTimeEditSubmit(event) {
            event.preventDefault();
            const projectId = ui.elements.timeEditProjectId.value;
            const day = ui.elements.timeEditDay.value;
            const updates = {
                [`startTimeDay${day}`]: ui.elements.editStartTime.value,
                [`finishTimeDay${day}`]: ui.elements.editFinishTime.value,
            };
            await this.handleProjectUpdate(projectId, updates);
            ui.closeModal('timeEditModal');
        },
        
        async handleUserFormSubmit(event) {
            event.preventDefault();
            ui.showLoading("Saving user...");
            try {
                const userId = document.getElementById('userId').value;
                const user = userId ? this.state.users.find(u => u.id === userId) : { id: `user_${Date.now()}` };
                user.name = document.getElementById('userName').value;
                user.email = document.getElementById('userEmail').value;
                user.techId = document.getElementById('userTechId').value;
                await api.saveUser(user);
                ui.closeModal('userFormModal');
                await this.loadData(true);
            } catch (error) { ui.showCustomAlert("Error: " + error.message); }
            finally { ui.hideLoading(); }
        },

        async handleDisputeFormSubmit(event) {
            event.preventDefault();
            ui.showLoading("Saving dispute...");
            try {
                const dispute = {
                    id: `dispute_${Date.now()}`,
                    projectName: document.getElementById('disputeProjectName').value,
                    techId: document.getElementById('disputeTechId').value,
                    reason: document.getElementById('disputeReason').value,
                    status: 'Open',
                };
                await api.addDispute(dispute);
                ui.elements.disputeForm.reset();
                await this.loadData(true);
            } catch (error) { ui.showCustomAlert("Error: " + error.message); }
            finally { ui.hideLoading(); }
        },

        // DATA UPDATE HANDLERS
        async handleProjectUpdate(projectId, updates) {
            ui.showLoading("Saving...");
            try {
                const project = this.state.projects.find(p => p.id === projectId);
                await api.updateProject(project, updates);
                await this.loadData(true); // Force reload to get fresh data
            } catch(error) { ui.showCustomAlert("Failed to save changes."); } 
            finally { ui.hideLoading(); }
        },
        async handleDeleteUser(userId) {
            const user = this.state.users.find(u => u.id === userId);
            if (user && await ui.showCustomConfirm(`Are you sure you want to delete user: ${user.name}?`)) {
                ui.showLoading("Deleting user...");
                try {
                    await api.deleteUser(user);
                    await this.loadData(true);
                } catch (error) { ui.showCustomAlert("Error: " + error.message); }
                finally { ui.hideLoading(); }
            }
        },
        async handleUpdateDisputeStatus(disputeId, newStatus) {
            const dispute = this.state.disputes.find(d => d.id === disputeId);
            if (dispute) {
                ui.showLoading("Updating dispute...");
                try {
                    dispute.status = newStatus;
                    await api.updateDispute(dispute);
                    await this.loadData(true);
                } catch (error) { ui.showCustomAlert("Error: " + error.message); }
                finally { ui.hideLoading(); }
            }
        },
    };

    App.init();
    window.App = App; // Expose App to global scope for inline event handlers
});

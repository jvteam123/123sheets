document.addEventListener('DOMContentLoaded', () => {
    const ProjectTrackerApp = {
        config: {
            firebase: {
                firebaseConfig: {
                    apiKey: "AIzaSyBg4QojI8nzPZpsctV41nNrIi6dPPrXgyY",
                    authDomain: "worktime-tracker-1de98.firebaseapp.com",
                    projectId: "worktime-tracker-1de98",
                    storageBucket: "worktime-tracker-1de98.firebasestorage.app",
                    messagingSenderId: "145326760645",
                    appId: "1:145326760645:web:e7d0a47823941c4fea46ac"
                }
            },
            pins: {
                TL_DASHBOARD_PIN: "1234"
            },
            firestorePaths: {
                USERS: "users",
                NOTIFICATIONS: "notifications",
                CHAT: "chat",
                TYPING_STATUS: "typing_status",
                APP_CONFIG: "app_config",
                LEAVE_REQUESTS: "leave_requests",
                DISPUTES: "disputes"
            },
            chat: {
                MAX_MESSAGES: 30
            },
            FIX_CATEGORIES: {
                ORDER: ["Fix1", "Fix2", "Fix3", "Fix4", "Fix5", "Fix6"],
                COLORS: {
                    "Fix1": "#FEFCE8",
                    "Fix2": "#EFF6FF",
                    "Fix3": "#F0FDF4",
                    "Fix4": "#FEF2F2",
                    "Fix5": "#FFFBEB",
                    "Fix6": "#FAF5FF",
                    "default": "#FFFFFF"
                }
            },
            NUM_TABLE_COLUMNS: 27,
            CSV_HEADERS_FOR_IMPORT: [
                "Fix Cat", "Project Name", "Area/Task", "GSD", "Assigned To", "Status",
                "Day 1 Start", "Day 1 Finish", "Day 1 Break",
                "Day 2 Start", "Day 2 Finish", "Day 2 Break",
                "Day 3 Start", "Day 3 Finish", "Day 3 Break",
                "Day 4 Start", "Day 4 Finish", "Day 4 Break",
                "Day 5 Start", "Day 5 Finish", "Day 5 Break",
                "Day 6 Start", "Day 6 Finish", "Day 6 Break",
                "Total (min)", "Tech Notes", "Creation Date", "Last Modified"
            ],
            CSV_HEADER_TO_FIELD_MAP: {
                "Fix Cat": "fixCategory",
                "Project Name": "baseProjectName",
                "Area/Task": "areaTask",
                "GSD": "gsd",
                "Assigned To": "assignedTo",
                "Status": "status",
                "Day 1 Start": "startTimeDay1",
                "Day 1 Finish": "finishTimeDay1",
                "Day 1 Break": "breakDurationMinutesDay1",
                "Day 2 Start": "startTimeDay2",
                "Day 2 Finish": "finishTimeDay2",
                "Day 2 Break": "breakDurationMinutesDay2",
                "Day 3 Start": "startTimeDay3",
                "Day 3 Finish": "finishTimeDay3",
                "Day 3 Break": "breakDurationMinutesDay3",
                "Day 4 Start": "startTimeDay4",
                "Day 4 Finish": "finishTimeDay4",
                "Day 4 Break": "breakDurationMinutesDay4",
                "Day 5 Start": "startTimeDay5",
                "Day 5 Finish": "finishTimeDay5",
                "Day 5 Break": "breakDurationMinutesDay5",
                "Day 6 Start": "startTimeDay6",
                "Day 6 Finish": "finishTimeDay6",
                "Day 6 Break": "breakDurationMinutesDay6",
                "Total (min)": null,
                "Tech Notes": "techNotes",
                "Creation Date": null,
                "Last Modified": null
            }
        },
        app: null,
        db: null,
        auth: null,
        projectsListenerUnsubscribe: null,
        disputesListenerUnsubscribe: null,
        appConfigListenerUnsubscribe: null,
        state: {
            projects: [],
            users: [],
            disputes: [],
            allUniqueProjectNames: [],
            newDisputesCount: 0,
            lastDisputeViewTimestamp: 0,
            groupVisibilityState: {},
            isAppInitialized: false,
            editingUser: null,
            currentUserTechId: null,
            appConfig: {},
            filters: {
                batchId: localStorage.getItem('currentSelectedBatchId') || "",
                fixCategory: "",
                month: localStorage.getItem('currentSelectedMonth') || "",
                sortBy: localStorage.getItem('currentSortBy') || 'newest'
            },
            pagination: {
                currentPage: 1,
                projectsPerPage: 10,
                paginatedProjectNameList: [],
                totalPages: 0
            },
        },
        elements: {},
        methods: {},
    };

    ProjectTrackerApp.methods = {
        setupDOMReferences() {
            this.elements = {
                // Main Layout
                body: document.body,
                authWrapper: document.getElementById('auth-wrapper'),
                mainContainer: document.querySelector('.dashboard-wrapper'),

                // Auth Elements
                signInBtn: document.getElementById('signInBtn'),
                signOutBtn: document.getElementById('signOutBtn'),

                // Sidebar Navigation
                openTechDashboardBtn: document.getElementById('openTechDashboardBtn'),
                openTlDashboardBtn: document.getElementById('openTlDashboardBtn'),
                openSettingsBtn: document.getElementById('openSettingsBtn'),
                openTlSummaryBtn: document.getElementById('openTlSummaryBtn'),
                openDisputeBtn: document.getElementById('openDisputeBtn'),

                // Dashboards
                techDashboard: document.getElementById('techDashboard'),
                tlDashboard: document.getElementById('tlDashboard'),
                userManagementDashboard: document.getElementById('userManagementDashboard'),
                tlSummaryDashboard: document.getElementById('tlSummaryDashboard'),
                disputeDashboard: document.getElementById('disputeDashboard'),

                // Tech Dashboard Elements
                projectTableBody: document.getElementById('projectTableBody'),
                batchIdSelect: document.getElementById('batchIdSelect'),
                fixCategoryFilter: document.getElementById('fixCategoryFilter'),
                monthFilter: document.getElementById('monthFilter'),
                paginationControls: document.getElementById('paginationControls'),
                prevPageBtn: document.getElementById('prevPageBtn'),
                nextPageBtn: document.getElementById('nextPageBtn'),
                pageInfo: document.getElementById('pageInfo'),

                // Project Settings Elements
                tlDashboardContent: document.getElementById('tlDashboardContent'),
                openNewProjectModalBtn: document.getElementById('openNewProjectModalBtn'),

                // User Management Elements
                userManagementForm: document.getElementById('userManagementForm'),
                userManagementTableBody: document.getElementById('userManagementTableBody'),
                userFormButtons: document.getElementById('userFormButtons'),
                newUserName: document.getElementById('newUserName'),
                newUserEmail: document.getElementById('newUserEmail'),
                newUserTechId: document.getElementById('newUserTechId'),

                // TL Summary Elements
                tlSummaryContent: document.getElementById('tlSummaryContent'),
                refreshSummaryBtn: document.getElementById('refreshSummaryBtn'),

                // Dispute Elements
                disputeForm: document.getElementById('disputeForm'),

                // Modals
                projectFormModal: document.getElementById('projectFormModal'),
                closeProjectFormBtn: document.getElementById('closeProjectFormBtn'),
                newProjectForm: document.getElementById('newProjectForm'),
                importCsvModal: document.getElementById('importCsvModal'),
                closeImportCsvBtn: document.getElementById('closeImportCsvBtn'),
                csvFileInput: document.getElementById('csvFileInput'),
                processCsvBtn: document.getElementById('processCsvBtn'),

                // Other
                loadingOverlay: document.getElementById('loadingOverlay'),
                exportAllCsvBtn: document.getElementById('exportAllCsvBtn'),
                exportSelectedCsvBtn: document.getElementById('exportSelectedCsvBtn'),
                openImportCsvBtn: document.getElementById('openImportCsvBtn'),
            };
        },
        hideAllDashboards() {
            const dashboards = [
                this.elements.techDashboard,
                this.elements.tlDashboard,
                this.elements.userManagementDashboard,
                this.elements.tlSummaryDashboard,
                this.elements.disputeDashboard
            ];
            dashboards.forEach(d => {
                if (d) d.classList.remove('active');
            });
            const allNavBtns = document.querySelectorAll('.sidebar-nav button');
            allNavBtns.forEach(btn => btn.classList.remove('active'));
        },
        attachEventListeners() {
            const self = this;
            const attachClick = (element, handler) => {
                if (element) element.addEventListener('click', handler);
            };

            const openDashboard = (dashboardElem, buttonElem, callback) => {
                self.methods.hideAllDashboards.call(self);
                dashboardElem.classList.add('active');
                buttonElem.classList.add('active');
                if (callback) callback();
            };

            attachClick(self.elements.openTechDashboardBtn, () => openDashboard(self.elements.techDashboard, self.elements.openTechDashboardBtn));

            attachClick(self.elements.openTlDashboardBtn, () => {
                const pin = prompt("Enter PIN to access Project Settings:");
                if (pin === self.config.pins.TL_DASHBOARD_PIN) {
                    openDashboard(self.elements.tlDashboard, self.elements.openTlDashboardBtn, () => self.methods.renderTLDashboard.call(self));
                } else if (pin) {
                    alert("Incorrect PIN.");
                }
            });

            attachClick(self.elements.openSettingsBtn, () => {
                const pin = prompt("Enter PIN to access User Settings:");
                if (pin === self.config.pins.TL_DASHBOARD_PIN) {
                    openDashboard(self.elements.userManagementDashboard, self.elements.openSettingsBtn, () => {
                        self.methods.renderUserManagement.call(self);
                        self.methods.exitEditMode.call(self);
                    });
                } else if (pin) {
                    alert("Incorrect PIN.");
                }
            });

            attachClick(self.elements.openTlSummaryBtn, () => openDashboard(self.elements.tlSummaryDashboard, self.elements.openTlSummaryBtn, () => self.methods.generateTlSummaryData.call(self)));
            attachClick(self.elements.refreshSummaryBtn, () => self.methods.generateTlSummaryData.call(self));

            attachClick(self.elements.openDisputeBtn, () => openDashboard(self.elements.disputeDashboard, self.elements.openDisputeBtn, () => self.methods.renderDisputePage.call(self)));

            attachClick(self.elements.openNewProjectModalBtn, () => self.elements.projectFormModal.style.display = 'block');
            attachClick(self.elements.closeProjectFormBtn, () => self.elements.projectFormModal.style.display = 'none');

            if (self.elements.newProjectForm) self.elements.newProjectForm.addEventListener('submit', (e) => self.methods.handleAddProjectSubmit.call(self, e));
            if (self.elements.userManagementForm) self.elements.userManagementForm.addEventListener('submit', (e) => self.methods.handleUserFormSubmit.call(self, e));

            window.addEventListener('click', (event) => {
                if (event.target == self.elements.projectFormModal) self.elements.projectFormModal.style.display = 'none';
                if (event.target == self.elements.importCsvModal) self.elements.importCsvModal.style.display = 'none';
            });
        },
        async initializeFirebaseAndLoadData() {
            this.methods.showLoading.call(this, "Loading projects...");
            if (!this.db) {
                this.methods.hideLoading.call(this);
                return;
            }
            if (this.projectsListenerUnsubscribe) {
                this.projectsListenerUnsubscribe();
            }
            this.state.projects = [];
            this.methods.loadGroupVisibilityState.call(this);
            await this.methods.populateMonthFilter.call(this);
            this.methods.showLoading.call(this, "Building project list...");

            try {
                const allTasksSnapshot = await this.db.collection("projects").get();
                const uniqueNames = new Set();
                allTasksSnapshot.forEach(doc => {
                    const name = doc.data().baseProjectName;
                    if (name) {
                        uniqueNames.add(name);
                    }
                });

                this.state.allUniqueProjectNames = Array.from(uniqueNames).sort();
                this.state.pagination.paginatedProjectNameList = this.state.allUniqueProjectNames;

                await this.methods.populateProjectNameFilter.call(this);
                const shouldPaginate = !this.state.filters.batchId && !this.state.filters.fixCategory;
                let projectsQuery = this.db.collection("projects");
                if (shouldPaginate) {
                    this.elements.paginationControls.style.display = 'block';
                    this.state.pagination.totalPages = Math.ceil(this.state.pagination.paginatedProjectNameList.length / this.state.pagination.projectsPerPage);
                    const startIndex = (this.state.pagination.currentPage - 1) * this.state.pagination.projectsPerPage;
                    const endIndex = startIndex + this.state.pagination.projectsPerPage;
                    const projectsToDisplay = this.state.pagination.paginatedProjectNameList.slice(startIndex, endIndex);
                    if (projectsToDisplay.length > 0) {
                        projectsQuery = projectsQuery.where("baseProjectName", "in", projectsToDisplay);
                    } else {
                        projectsQuery = projectsQuery.where("baseProjectName", "==", "no-projects-exist-yet-dummy-value");
                    }
                } else {
                    this.elements.paginationControls.style.display = 'none';
                    if (this.state.filters.month) {
                        const [year, month] = this.state.filters.month.split('-');
                        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
                        projectsQuery = projectsQuery.where("creationTimestamp", ">=", startDate).where("creationTimestamp", "<=", endDate);
                    }
                    if (this.state.filters.batchId) {
                        projectsQuery = projectsQuery.where("baseProjectName", "==", this.state.filters.batchId);
                    }
                    if (this.state.filters.fixCategory) {
                        projectsQuery = projectsQuery.where("fixCategory", "==", this.state.filters.fixCategory);
                    }
                }

                const sortDirection = this.state.filters.sortBy === 'oldest' ? 'asc' : 'desc';
                projectsQuery = projectsQuery.orderBy("creationTimestamp", sortDirection);

                this.projectsListenerUnsubscribe = projectsQuery.onSnapshot(
                    (snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            const projectData = { id: change.doc.id, ...change.doc.data() };
                            const index = this.state.projects.findIndex(p => p.id === change.doc.id);
                            if (change.type === "added") {
                                if (index === -1) this.state.projects.push(projectData);
                            }
                            if (change.type === "modified") {
                                if (index > -1) this.state.projects[index] = projectData;
                            }
                            if (change.type === "removed") {
                                if (index > -1) this.state.projects.splice(index, 1);
                            }
                        });
                        this.methods.refreshAllViews.call(this);
                    },
                    (error) => {
                        console.error("Error loading projects in real-time: ", error);
                        alert("Error loading projects. Check the console (F12) for a link to create a required database index.");
                        this.methods.hideLoading.call(this);
                    }
                );

            } catch (error) {
                console.error("Failed to build project list or query: ", error);
                alert("An error occurred while preparing the project list. Check the console (F12) for details and a possible link to create a database index.");
                this.methods.hideLoading.call(this);
            }
        },
        refreshAllViews() {
            try {
                this.methods.renderProjects.call(this);
            } catch (error) {
                console.error("Error rendering projects:", error);
                if (this.elements.projectTableBody) this.elements.projectTableBody.innerHTML = `<tr><td colspan="${this.config.NUM_TABLE_COLUMNS}" style="color:red;text-align:center;">Error loading projects.</td></tr>`;
            }
            this.methods.hideLoading.call(this);
        },
        renderProjects() {
            if (!this.elements.projectTableBody) return;
            this.elements.projectTableBody.innerHTML = "";
            const sortedProjects = [...this.state.projects].sort((a, b) => {
                const nameA = a.baseProjectName || "";
                const nameB = b.baseProjectName || "";
                const fixA = this.config.FIX_CATEGORIES.ORDER.indexOf(a.fixCategory || "");
                const fixB = this.config.FIX_CATEGORIES.ORDER.indexOf(b.fixCategory || "");
                const areaA = a.areaTask || "";
                const areaB = b.areaTask || "";
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                if (fixA < fixB) return -1;
                if (fixA > fixB) return 1;
                if (areaA < areaB) return -1;
                if (areaA > areaB) return 1;
                return 0;
            });
            let currentBaseProjectNameHeader = null;
            if (sortedProjects.length === 0) {
                const row = this.elements.projectTableBody.insertRow();
                row.innerHTML = `<td colspan="${this.config.NUM_TABLE_COLUMNS}" style="text-align:center; padding: 20px;">No projects to display.</td>`;
                return;
            }
            sortedProjects.forEach(project => {
                if (project.baseProjectName !== currentBaseProjectNameHeader) {
                    currentBaseProjectNameHeader = project.baseProjectName;
                    const headerRow = this.elements.projectTableBody.insertRow();
                    headerRow.className = "batch-header-row";
                    headerRow.innerHTML = `<td colspan="${this.config.NUM_TABLE_COLUMNS}"># ${project.baseProjectName}</td>`;
                }
                const row = this.elements.projectTableBody.insertRow();
                row.dataset.projectId = project.id;
                row.style.backgroundColor = this.config.FIX_CATEGORIES.COLORS[project.fixCategory] || this.config.FIX_CATEGORIES.COLORS.default;

                let optionsHtml = '<option value="">Select Tech ID</option>';
                this.state.users.sort((a, b) => (a.techId || "").localeCompare(b.techId || "")).forEach(user => {
                    optionsHtml += `<option value="${user.techId}" title="${user.name}">${user.techId}</option>`;
                });

                row.innerHTML = `
                    <td>${project.fixCategory}</td>
                    <td>${project.baseProjectName}</td>
                    <td>${project.areaTask}</td>
                    <td>${project.gsd}</td>
                    <td><select class="assigned-to-select">${optionsHtml}</select></td>
                    <td><span class="status">${project.status}</span></td>
                    <td><input type="time" class="time-input" data-field="startTimeDay1"></td>
                    <td><input type="time" class="time-input" data-field="finishTimeDay1"></td>
                    <td><select class="break-select" data-field="breakDurationMinutesDay1"><option value="0">0m</option><option value="15">15m</option></select></td>
                    <td><input type="time" class="time-input" data-field="startTimeDay2"></td>
                    <td><input type="time" class="time-input" data-field="finishTimeDay2"></td>
                    <td><select class="break-select" data-field="breakDurationMinutesDay2"><option value="0">0m</option><option value="15">15m</option></select></td>
                    <td><input type="time" class="time-input" data-field="startTimeDay3"></td>
                    <td><input type="time" class="time-input" data-field="finishTimeDay3"></td>
                    <td><select class="break-select" data-field="breakDurationMinutesDay3"><option value="0">0m</option><option value="15">15m</option></select></td>
                    <td><input type="time" class="time-input" data-field="startTimeDay4"></td>
                    <td><input type="time" class="time-input" data-field="finishTimeDay4"></td>
                    <td><select class="break-select" data-field="breakDurationMinutesDay4"><option value="0">0m</option><option value="15">15m</option></select></td>
                    <td><input type="time" class="time-input" data-field="startTimeDay5"></td>
                    <td><input type="time" class="time-input" data-field="finishTimeDay5"></td>
                    <td><select class="break-select" data-field="breakDurationMinutesDay5"><option value="0">0m</option><option value="15">15m</option></select></td>
                    <td><input type="time" class="time-input" data-field="startTimeDay6"></td>
                    <td><input type="time" class="time-input" data-field="finishTimeDay6"></td>
                    <td><select class="break-select" data-field="breakDurationMinutesDay6"><option value="0">0m</option><option value="15">15m</option></select></td>
                    <td><div class="progress-bar"></div></td>
                    <td><div class="total-duration"></div></td>
                    <td><div class="action-buttons"></div></td>
                `;

                row.querySelector('.assigned-to-select').value = project.assignedTo || "";
            });
        },
    };

    ProjectTrackerApp.init = () => {
        try {
            if (typeof firebase === 'undefined' || typeof firebase.initializeApp === 'undefined') {
                throw new Error("Firebase SDK not loaded.");
            }
            ProjectTrackerApp.app = firebase.initializeApp(ProjectTrackerApp.config.firebase.firebaseConfig);
            ProjectTrackerApp.db = firebase.firestore();
            ProjectTrackerApp.auth = firebase.auth();
            ProjectTrackerApp.methods.setupDOMReferences.call(ProjectTrackerApp);
            ProjectTrackerApp.methods.attachEventListeners.call(ProjectTrackerApp);
        } catch (error) {
            console.error("CRITICAL ERROR: Could not connect to Firebase.", error);
            const loadingMessageElement = document.getElementById('loading-auth-message');
            if (loadingMessageElement) {
                loadingMessageElement.innerHTML = `<p style="color:red;">CRITICAL ERROR: Could not connect to Firebase. App will not function correctly. Error: ${error.message}</p>`;
            } else {
                alert("CRITICAL ERROR: Could not connect to Firebase. Error: " + error.message);
            }
        }
    };

    ProjectTrackerApp.init();
});

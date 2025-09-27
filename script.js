/* refactor: script.js
   Single-file refactor of your tracker script.
   - Keep API_KEY, CLIENT_ID, SPREADSHEET_ID (unchanged)
   - Uses gapi + google.accounts oauth2 token client (same as original)
   - Clean structure, modular helpers, clearer flows
*/

document.addEventListener('DOMContentLoaded', () => {
  /* -----------------------
     Config
  ------------------------*/
  const CONFIG = {
    GOOGLE: {
      API_KEY: "AIzaSyBxlhWwf3mlS_6Q3BiUsfpH21AsbhVmDw8",
      CLIENT_ID: "221107133299-7r4vnbhpsdrnqo8tss0dqbtrr9ou683e.apps.googleusercontent.com",
      SPREADSHEET_ID: "15bhPCYDLChEwO6_uQfvUyq5_qMQp4b816uM26yq3rNY",
      SCOPES: "https://www.googleapis.com/auth/spreadsheets"
    },
    SHEET_NAMES: {
      PROJECTS: "Projects",
      USERS: "Users",
      DISPUTES: "Disputes",
      EXTRAS: "Extras",
      ARCHIVE: "Archive",
      NOTIFICATIONS: "Notifications"
    },
    HEADER_MAP: {
      'id': 'id',
      'Fix Cat': 'fixCategory',
      'Project Name': 'baseProjectName',
      'Area/Task': 'areaTask',
      'GSD': 'gsd',
      'Assigned To': 'assignedTo',
      'Status': 'status',
      'Day 1 Start': 'startTimeDay1',
      'Day 1 Finish': 'finishTimeDay1',
      'Day 1 Break': 'breakDurationMinutesDay1',
      'Day 2 Start': 'startTimeDay2',
      'Day 2 Finish': 'finishTimeDay2',
      'Day 2 Break': 'breakDurationMinutesDay2',
      'Day 3 Start': 'startTimeDay3',
      'Day 3 Finish': 'finishTimeDay3',
      'Day 3 Break': 'breakDurationMinutesDay3',
      'Day 4 Start': 'startTimeDay4',
      'Day 4 Finish': 'finishTimeDay4',
      'Day 4 Break': 'breakDurationMinutesDay4',
      'Day 5 Start': 'startTimeDay5',
      'Day 5 Finish': 'finishTimeDay5',
      'Day 5 Break': 'breakDurationMinutesDay5',
      'Total (min)': 'totalMinutes',
      'Last Modified': 'lastModifiedTimestamp',
      'Batch ID': 'batchId'
    },
    DISPUTE_HEADER_MAP: {
      'id': 'id',
      'Block ID': 'blockId',
      'Project Name': 'projectName',
      'Partial': 'partial',
      'Phase': 'phase',
      'UID': 'uid',
      'RQA TechID': 'rqaTechId',
      'Reason for Dispute': 'reasonForDispute',
      'Tech ID': 'techId',
      'Tech Name': 'techName',
      'Team': 'team',
      'Type': 'type',
      'Category': 'category',
      'Status': 'status'
    },
    EXTRAS_HEADER_MAP: { 'id': 'id', 'name': 'name', 'url': 'url', 'icon': 'icon' },
    NOTIFICATIONS_HEADER_MAP: { 'id': 'id', 'message': 'message', 'projectName': 'projectName', 'timestamp': 'timestamp', 'read': 'read' }
  };

  /* -----------------------
     Small helpers & Time utils
  ------------------------*/
  const TimeUtils = {
    // parse strings like "09:30 AM", "9:30 AM", "21:10", "09:30"
    parseToMinutes(timeStr) {
      if (!timeStr) return null;
      const s = String(timeStr).trim();
      // Try hh:mm AM/PM
      const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = parseInt(ampmMatch[2], 10);
        const ampm = ampmMatch[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      }
      // Try 24h hh:mm
      const hm = s.match(/^(\d{1,2}):(\d{2})$/);
      if (hm) {
        const h = parseInt(hm[1], 10);
        const m = parseInt(hm[2], 10);
        return h * 60 + m;
      }
      // Try plain number minutes
      const n = parseInt(s, 10);
      if (!isNaN(n)) return n;
      return null;
    },

    formatNowAMPM() {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m} ${ampm}`;
    }
  };

  const Dom = {
    createSel(options = [], selectedVal = null) {
      const sel = document.createElement('select');
      options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (selectedVal !== null && String(o) === String(selectedVal)) opt.selected = true;
        sel.appendChild(opt);
      });
      return sel;
    },
    createOptionFragment(options = [], selectedVal = null) {
      const frag = document.createDocumentFragment();
      options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (selectedVal !== null && String(o) === String(selectedVal)) opt.selected = true;
        frag.appendChild(opt);
      });
      return frag;
    }
  };

  /* -----------------------
     Sheets API wrapper
     (thin layer around gapi client calls)
  ------------------------*/
  class SheetsApi {
    constructor(spreadsheetId) {
      this.spreadsheetId = spreadsheetId;
    }

    async getSpreadsheet() {
      const resp = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      return resp.result;
    }

    async batchGet(ranges = []) {
      const resp = await gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges
      });
      return resp.result.valueRanges || [];
    }

    async getValues(range) {
      const resp = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range
      });
      return resp.result.values || [];
    }

    async updateValues(rangeStartCell, values2d) {
      return gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: rangeStartCell,
        valueInputOption: 'USER_ENTERED',
        resource: { values: values2d }
      });
    }

    async appendValues(range, values2d) {
      return gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: values2d }
      });
    }

    async clearValues(range) {
      return gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range
      });
    }
  }

  /* -----------------------
     Main app
  ------------------------*/
  class ProjectTrackerApp {
    constructor(cfg) {
      this.cfg = cfg;
      this.tokenClient = null;
      this.sheets = new SheetsApi(this.cfg.GOOGLE.SPREADSHEET_ID);

      this.state = {
        projects: [],
        users: [],
        disputes: [],
        extras: [],
        notifications: [],
        archive: [],
        isAppInitialized: false,
        filters: {
          project: 'All',
          fixCategory: 'All',
          showDays: { 1: true, 2: false, 3: false, 4: false, 5: false },
          disputeStatus: 'All'
        }
      };

      // DOM refs will be filled by setupDOMReferences
      this.el = {};
    }

    init() {
      this.setupDOMReferences();
      this.attachDOMEvents();

      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: this.cfg.GOOGLE.API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
          });
          this.initTokenClient();
        } catch (err) {
          console.error('GAPI init failed:', err);
          this.showAuthView();
        }
      });
    }

    setupDOMReferences() {
      // Basic elements assumed to exist in your HTML
      this.el.authWrapper = document.getElementById('auth-wrapper') || { style: {} };
      this.el.dashboardWrapper = document.getElementById('dashboard-wrapper') || { style: {} };
      this.el.loggedInUser = document.getElementById('logged-in-user') || { textContent: '' };
      this.el.btnSignIn = document.getElementById('btn-sign-in');
      this.el.btnSignOut = document.getElementById('btn-sign-out');
      this.el.projectFilter = document.getElementById('project-filter');
      this.el.fixCategoryFilter = document.getElementById('fixcat-filter');
      this.el.dayControls = {
        1: document.getElementById('day1-toggle'),
        2: document.getElementById('day2-toggle'),
        3: document.getElementById('day3-toggle'),
        4: document.getElementById('day4-toggle'),
        5: document.getElementById('day5-toggle')
      };
      this.el.tbody = document.getElementById('project-table-body') || (function(){ const d=document.createElement('tbody'); return d; })();
      this.el.thead = document.getElementById('project-table-head') || (function(){ const d=document.createElement('thead'); return d; })();
      this.el.loading = document.getElementById('loading-overlay') || null;
      this.el.extrasContainer = document.getElementById('extras-container') || null;
      this.el.notificationBell = document.getElementById('notification-bell') || null;
    }

    attachDOMEvents() {
      if (this.el.btnSignIn) this.el.btnSignIn.addEventListener('click', () => this.handleAuthClick());
      if (this.el.btnSignOut) this.el.btnSignOut.addEventListener('click', () => this.handleSignoutClick());
      if (this.el.projectFilter) this.el.projectFilter.addEventListener('change', e => { this.state.filters.project = e.target.value; this.filterAndRenderProjects(); });
      if (this.el.fixCategoryFilter) this.el.fixCategoryFilter.addEventListener('change', e => { this.state.filters.fixCategory = e.target.value; this.filterAndRenderProjects(); });
      Object.keys(this.el.dayControls).forEach(k => {
        const el = this.el.dayControls[k];
        if (!el) return;
        el.addEventListener('change', e => {
          this.state.filters.showDays[parseInt(k, 10)] = e.target.checked;
          this.filterAndRenderProjects();
        });
      });
    }

    initTokenClient() {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.cfg.GOOGLE.CLIENT_ID,
        scope: this.cfg.GOOGLE.SCOPES,
        callback: resp => this.handleTokenResponse(resp)
      });
      // Try silent request
      this.tokenClient.requestAccessToken({ prompt: 'none' });
    }

    showLoading(text = 'Loading...') {
      if (this.el.loading) {
        this.el.loading.style.display = 'flex';
        this.el.loading.textContent = text;
      } else {
        console.debug('loading:', text);
      }
    }

    hideLoading() {
      if (this.el.loading) this.el.loading.style.display = 'none';
    }

    showAuthView() {
      document.body.classList.add('login-view-active');
      if (this.el.authWrapper) this.el.authWrapper.style.display = 'block';
      if (this.el.dashboardWrapper) this.el.dashboardWrapper.style.display = 'none';
    }

    showDashboardView() {
      document.body.classList.remove('login-view-active');
      if (this.el.authWrapper) this.el.authWrapper.style.display = 'none';
      if (this.el.dashboardWrapper) this.el.dashboardWrapper.style.display = 'flex';
    }

    async handleAuthClick() {
      this.showLoading('Signing in...');
      try {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        console.error('Sign-in request failed:', err);
        alert('Sign-in failed. See console.');
        this.hideLoading();
      }
    }

    async handleTokenResponse(resp) {
      if (resp && resp.access_token) {
        gapi.client.setToken(resp);
        await this.onAuthorized();
      } else {
        // silent failed
        console.log('Silent sign-in failed. Waiting for manual sign-in.');
        this.showAuthView();
      }
    }

    async handleSignoutClick() {
      const token = gapi.client.getToken();
      if (token && token.access_token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
          gapi.client.setToken(null);
          this.showAuthView();
        });
      } else {
        gapi.client.setToken(null);
        this.showAuthView();
      }
    }

    async onAuthorized() {
      this.showDashboardView();
      this.el.loggedInUser.textContent = 'Signed In';
      if (!this.state.isAppInitialized) {
        await this.loadAllData();
        this.state.isAppInitialized = true;
      } else {
        this.filterAndRenderProjects();
      }
      this.renderExtrasMenu();
      this.renderNotificationBell();
    }

    sheetValuesToObjects(values, headerMap) {
      if (!values || values.length < 2) return [];
      const headers = values[0];
      return values.slice(1).map((row, idx) => {
        const o = { _row: idx + 2 }; // sheet rows start at 1; header row is 1 so data starts at 2
        headers.forEach((h, i) => {
          const key = (h || '').trim();
          const mapped = headerMap[key] || headerMap[key.toLowerCase()];
          if (mapped) {
            o[mapped] = row[i] !== undefined ? row[i] : '';
          }
        });
        return o;
      });
    }

    async loadAllData() {
      this.showLoading('Loading data from Google Sheets...');
      try {
        // Get sheet metadata first to ensure sheet exists (optional)
        const meta = await this.sheets.getSpreadsheet();
        const sheetExists = meta.sheets.some(s => s.properties.title === this.cfg.SHEET_NAMES.PROJECTS);
        if (!sheetExists) throw new Error(`Sheet ${this.cfg.SHEET_NAMES.PROJECTS} not found.`);

        // batch get
        const ranges = [
          this.cfg.SHEET_NAMES.PROJECTS,
          this.cfg.SHEET_NAMES.USERS,
          this.cfg.SHEET_NAMES.DISPUTES,
          this.cfg.SHEET_NAMES.EXTRAS,
          this.cfg.SHEET_NAMES.NOTIFICATIONS,
          this.cfg.SHEET_NAMES.ARCHIVE
        ];
        const valueRanges = await this.sheets.batchGet(ranges);

        const find = name => valueRanges.find(v => v.range && v.range.startsWith(name));
        const projectsVals = find(this.cfg.SHEET_NAMES.PROJECTS)?.values || [];
        const usersVals = find(this.cfg.SHEET_NAMES.USERS)?.values || [];
        const disputesVals = find(this.cfg.SHEET_NAMES.DISPUTES)?.values || [];
        const extrasVals = find(this.cfg.SHEET_NAMES.EXTRAS)?.values || [];
        const notificationsVals = find(this.cfg.SHEET_NAMES.NOTIFICATIONS)?.values || [];
        const archiveVals = find(this.cfg.SHEET_NAMES.ARCHIVE)?.values || [];

        this.state.projects = this.sheetValuesToObjects(projectsVals, this.cfg.HEADER_MAP)
          .filter(p => p.baseProjectName && p.baseProjectName.trim() !== '');
        this.state.users = this.sheetValuesToObjects(usersVals, { 'id': 'id', 'name': 'name', 'email': 'email', 'techId': 'techId' });
        this.state.disputes = this.sheetValuesToObjects(disputesVals, this.cfg.DISPUTE_HEADER_MAP);
        this.state.extras = this.sheetValuesToObjects(extrasVals, this.cfg.EXTRAS_HEADER_MAP);
        this.state.notifications = this.sheetValuesToObjects(notificationsVals, this.cfg.NOTIFICATIONS_HEADER_MAP).filter(n => n.message && n.timestamp);
        this.state.archive = this.sheetValuesToObjects(archiveVals, this.cfg.HEADER_MAP);

        this.populateFilterDropdowns();
        this.filterAndRenderProjects();
      } catch (err) {
        console.error('Load error:', err);
        if (err.status === 401 || err.status === 403) {
          alert('Authentication error. Please re-login.');
          this.handleSignoutClick();
        } else {
          alert('Failed loading spreadsheet data. Check console.');
        }
      } finally {
        this.hideLoading();
      }
    }

    populateFilterDropdowns() {
      // Project filter: unique project names
      if (!this.el.projectFilter) return;
      const projects = ['All', ...Array.from(new Set(this.state.projects.map(p => p.baseProjectName).filter(Boolean))).sort()];
      this.el.projectFilter.innerHTML = '';
      this.el.projectFilter.appendChild(Dom.createOptionFragment(projects, this.state.filters.project));

      // Fix category filter
      if (this.el.fixCategoryFilter) {
        const fixCats = ['All', ...Array.from(new Set(this.state.projects.map(p => p.fixCategory).filter(Boolean))).sort()];
        this.el.fixCategoryFilter.innerHTML = '';
        this.el.fixCategoryFilter.appendChild(Dom.createOptionFragment(fixCats, this.state.filters.fixCategory));
      }
    }

    filterAndRenderProjects() {
      // lightweight spinner while applying filters
      this.showLoading('Rendering projects...');
      setTimeout(() => {
        let arr = [...this.state.projects];
        if (this.state.filters.project && this.state.filters.project !== 'All') {
          arr = arr.filter(p => p.baseProjectName === this.state.filters.project);
        }
        if (this.state.filters.fixCategory && this.state.filters.fixCategory !== 'All') {
          arr = arr.filter(p => p.fixCategory === this.state.filters.fixCategory);
        }
        this.renderProjectsTable(arr);
        this.hideLoading();
      }, 50);
    }

    calculateTotalMinutes(proj) {
      // Sum across 5 days: each day subtract break minutes
      let total = 0;
      for (let d = 1; d <= 5; d++) {
        const s = proj[`startTimeDay${d}`];
        const f = proj[`finishTimeDay${d}`];
        const br = parseInt(proj[`breakDurationMinutesDay${d}`] || '0', 10) || 0;
        if (s && f) {
          let sm = TimeUtils.parseToMinutes(s);
          let fm = TimeUtils.parseToMinutes(f);
          if (sm === null || fm === null) continue;
          if (fm < sm) fm += 24 * 60; // cross midnight
          const diff = fm - sm - br;
          if (diff > 0) total += diff;
        }
      }
      return total > 0 ? String(total) : '';
    }

    async updateRowInSheet(sheetName, rowIndex, dataObj) {
      this.showLoading('Saving changes...');
      try {
        // Read header row to map column order
        const headers = (await this.sheets.getValues(`${sheetName}!1:1`))[0] || [];
        // choose appropriate header map
        let headerMap = this.cfg.HEADER_MAP;
        if (sheetName === this.cfg.SHEET_NAMES.USERS) headerMap = { 'id': 'id', 'name': 'name', 'email': 'email', 'techid': 'techId' };
        if (sheetName === this.cfg.SHEET_NAMES.DISPUTES) headerMap = this.cfg.DISPUTE_HEADER_MAP;
        if (sheetName === this.cfg.SHEET_NAMES.EXTRAS) headerMap = this.cfg.EXTRAS_HEADER_MAP;
        if (sheetName === this.cfg.SHEET_NAMES.NOTIFICATIONS) headerMap = this.cfg.NOTIFICATIONS_HEADER_MAP;

        const rowValues = headers.map(h => {
          const prop = headerMap[(h || '').trim()] || headerMap[(h || '').trim().toLowerCase()];
          return (prop && dataObj[prop] !== undefined) ? dataObj[prop] : '';
        });

        await this.sheets.updateValues(`${sheetName}!A${rowIndex}`, [rowValues]);
        // update local state if necessary already done by caller
      } catch (err) {
        console.error('Update row failed:', err);
        alert('Failed to save changes. See console.');
      } finally {
        this.hideLoading();
      }
    }

    async handleProjectUpdate(projectId, updates) {
      const p = this.state.projects.find(x => x.id === projectId);
      if (!p) return;
      const merged = { ...p, ...updates };
      merged.totalMinutes = this.calculateTotalMinutes(merged);
      merged.lastModifiedTimestamp = new Date().toISOString();

      // Update local state
      Object.assign(p, merged);

      // Re-render
      this.filterAndRenderProjects();

      // Persist to sheet
      // p._row is the sheet row index (we set it when converting)
      if (p._row) {
        await this.updateRowInSheet(this.cfg.SHEET_NAMES.PROJECTS, p._row, p);
      }
    }

    // Called when user clicks start/end/done
    async updateProjectState(projectId, action) {
      const p = this.state.projects.find(x => x.id === projectId);
      if (!p) return;

      // minimal state machine example:
      // action: startDayN -> sets startTimeDayN to now + status -> InProgressDayN
      // action: endDayN -> sets finishTimeDayN to now + status change + recalc total
      const nowStr = TimeUtils.formatNowAMPM();
      const updated = {};

      const m = action.match(/^startDay(\d)$/) || action.match(/^endDay(\d)$/);
      if (m) {
        const day = parseInt(m[1], 10);
        if (action.startsWith('start')) {
          updated[`startTimeDay${day}`] = nowStr;
          updated.status = `InProgressDay${day}`;
        } else {
          updated[`finishTimeDay${day}`] = nowStr;
          // if finishing the last day, maybe mark Completed? We'll keep status flexible
          updated.status = `CompletedDay${day}`;
        }
      } else if (action === 'done') {
        updated.status = 'Completed';
      }

      await this.handleProjectUpdate(projectId, updated);
    }

    renderExtrasMenu() {
      if (!this.el.extrasContainer) return;
      this.el.extrasContainer.innerHTML = '';
      this.state.extras.forEach(ext => {
        const a = document.createElement('a');
        a.href = ext.url || '#';
        a.title = ext.name || '';
        a.target = '_blank';
        a.className = 'extras-link';
        a.textContent = ext.name || ext.url || 'link';
        this.el.extrasContainer.appendChild(a);
      });
    }

    renderNotificationBell() {
      if (!this.el.notificationBell) return;
      const unread = this.state.notifications.filter(n => !n.read).length;
      this.el.notificationBell.textContent = unread > 0 ? `🔔 ${unread}` : '🔔';
    }

    renderProjectsTable(list) {
      // Build header dynamically based on days toggle
      const daysToShow = [1];
      for (let d = 2; d <=5; d++) {
        if (this.state.filters.showDays[d]) daysToShow.push(d);
      }

      const headers = ['Fix Cat', 'Project Name', 'Area/Task', 'GSD', 'Assigned To', 'Status'];
      daysToShow.forEach(d => headers.push(`Day ${d} Start`, `Day ${d} Finish`, `Day ${d} Break`));
      headers.push('Total (min)', 'Actions');

      // render head
      if (this.el.thead) {
        this.el.thead.innerHTML = '';
        const tr = document.createElement('tr');
        headers.forEach(h => {
          const th = document.createElement('th');
          th.textContent = h;
          tr.appendChild(th);
        });
        this.el.thead.appendChild(tr);
      }

      // render body
      if (!this.el.tbody) return;
      this.el.tbody.innerHTML = '';

      if (!list || list.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = headers.length;
        td.textContent = 'No projects found.';
        tr.appendChild(td);
        this.el.tbody.appendChild(tr);
        return;
      }

      // Group by project name then fix category
      const grouped = list.reduce((acc, row) => {
        const proj = row.baseProjectName || 'Unknown Project';
        (acc[proj] ||= []).push(row);
        return acc;
      }, {});

      Object.keys(grouped).sort().forEach((projName, idx) => {
        const group = grouped[projName];
        // Optional separator row between projects
        if (idx > 0) {
          const sep = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = headers.length;
          td.className = 'group-separator';
          sep.appendChild(td);
          this.el.tbody.appendChild(sep);
        }

        // group by fixCategory
        const byFix = group.reduce((acc, row) => {
          const fc = row.fixCategory || 'Unk';
          (acc[fc] ||= []).push(row);
          return acc;
        }, {});

        Object.keys(byFix).sort().forEach((fix, fi) => {
          const sub = byFix[fix];
          // optional fix separator
          if (fi > 0) {
            const sep = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.className = 'fix-separator';
            sep.appendChild(td);
            this.el.tbody.appendChild(sep);
          }

          // rows
          sub.sort((a, b) => (a.areaTask || '').localeCompare(b.areaTask || '')).forEach(row => {
            const tr = document.createElement('tr');
            // Fix Cat
            tr.appendChild(this._cell(row.fixCategory || ''));
            tr.appendChild(this._cell(row.baseProjectName || ''));
            tr.appendChild(this._cell(row.areaTask || ''));
            tr.appendChild(this._cell(row.gsd || ''));

            // Assigned To (select)
            const assignedCell = document.createElement('td');
            const userOptions = ['', ...this.state.users.map(u => u.techId || u.name || u.id)];
            const sel = Dom.createSel(userOptions, row.assignedTo || '');
            sel.addEventListener('change', async (e) => {
              await this.handleProjectUpdate(row.id, { assignedTo: e.target.value });
            });
            assignedCell.appendChild(sel);
            tr.appendChild(assignedCell);

            // status
            tr.appendChild(this._cell(row.status || ''));

            // days
            daysToShow.forEach(d => {
              tr.appendChild(this._cell(row[`startTimeDay${d}`] || ''));
              tr.appendChild(this._cell(row[`finishTimeDay${d}`] || ''));
              // Breaks as selector
              const breakCell = document.createElement('td');
              const breakOptions = ['0','15','30','45','60','75','90'];
              const breakSel = Dom.createSel(breakOptions, row[`breakDurationMinutesDay${d}`] || '0');
              breakSel.addEventListener('change', async (e) => {
                await this.handleProjectUpdate(row.id, { [`breakDurationMinutesDay${d}`]: e.target.value });
              });
              breakCell.appendChild(breakSel);
              tr.appendChild(breakCell);
            });

            // total minutes
            tr.appendChild(this._cell(row.totalMinutes || this.calculateTotalMinutes(row)));

            // actions cell (buttons)
            const actionsCell = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';

            // Start/End per visible day
            daysToShow.forEach(d => {
              const startBtn = document.createElement('button');
              startBtn.textContent = `Start D${d}`;
              startBtn.className = 'btn btn-primary btn-small';
              startBtn.addEventListener('click', async () => {
                await this.updateProjectState(row.id, `startDay${d}`);
              });
              const endBtn = document.createElement('button');
              endBtn.textContent = `End D${d}`;
              endBtn.className = 'btn btn-warning btn-small';
              endBtn.addEventListener('click', async () => {
                await this.updateProjectState(row.id, `endDay${d}`);
              });
              actionsDiv.appendChild(startBtn);
              actionsDiv.appendChild(endBtn);
            });

            const doneBtn = document.createElement('button');
            doneBtn.textContent = 'Done';
            doneBtn.className = 'btn btn-success btn-small';
            doneBtn.addEventListener('click', async () => {
              if (confirm('Mark as Completed?')) {
                await this.handleProjectUpdate(row.id, { status: 'Completed' });
              }
            });
            actionsDiv.appendChild(doneBtn);
            actionsCell.appendChild(actionsDiv);
            tr.appendChild(actionsCell);

            this.el.tbody.appendChild(tr);
          });
        });
      });
    }

    _cell(text = '') {
      const td = document.createElement('td');
      td.textContent = text;
      return td;
    }
  }

  /* -----------------------
     Instantiate & init app
  ------------------------*/
  const APP = new ProjectTrackerApp(CONFIG);
  APP.init();

  /* Expose APP to window for debugging (optional) */
  window.TrackerApp = APP;
});

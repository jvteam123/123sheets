Project Overview
The core idea is to simplify the application by focusing on key functionalities and enhancing the user experience, especially for the main project tracking dashboard. The architecture would involve:

Two primary user roles: a regular User (technician) and a Team Lead (TL).

A streamlined UI for the main dashboard with real-time updates.

Separated access based on the user's role. A standard user would only see their projects and a limited set of features, while a TL would have administrative access to project and user management tools.

Improved visual feedback with spinners, animated timers, and updated project cards.

Key Features and Implementation Plan
1. Google Authentication and Role-Based Access
The existing code already uses Google authentication, which is a good starting point. The new logic needs to be built on top of this.

User Verification: When a user signs in with their Google account, the application must immediately check their email or UID against a list of authorized users stored in Firestore.

Role Assignment: The users collection in Firestore should be updated to include a role field (e.g., 'user' or 'team_lead').

Conditional Rendering: After successful authentication, the handleAuthorizedUser method would check the role field.

If the user is a 'user', display the main Project Dashboard and hide all admin buttons (Project Settings, User Settings, TL Summary, Dispute, Import/Export).

If the user is a 'team_lead', display all buttons and give them full access to the application's features.

2. The Project Dashboard (for all users)
The main table UI would be replaced with a more visually appealing card or list view. This is where the core tracking happens.

UI Component: Instead of a large, horizontally scrolling table, each project would be a card (div element). This card would contain key information and interactive elements.

Project Card Content:

Project Name & Area: Display the baseProjectName and areaTask prominently at the top of the card.

Status Spinner: A colored spinner would visually represent the project's status (Available, In Progress, Completed, etc.). This replaces the text-based status badge.

Time Tracking Controls:

Start/Stop Button: A single, prominent button that changes its text and icon based on the current status (e.g., "Start Day 1", "Start Day 2", "Pause", "Done").

Animated Timer: A live, animated timer (using JavaScript's setInterval) would show the duration for the current day's session as it's being worked on. This provides immediate, live feedback.

Manual Edit Button: A smaller button (like a pencil icon) would open a modal for manually editing start/finish times and breaks.

3. User & Team Lead Views
The modals and separate screens for management would be preserved, but updated with the new UI styling.

User View (Default):

Project Dashboard: Only shows projects assigned to the currently signed-in user (assignedTo field matches currentUserTechId).

My Disputes: A simplified version of the dispute modal, where the Tech ID and Tech Name fields are pre-filled and locked to the current user.

Leave Scheduler: The user can only submit and view their own leave requests.

Team Lead View:

Project Dashboard: The main dashboard would show all projects, ignoring the assignedTo filter, giving the TL a full overview.

Project Management Modal: The existing tlDashboardModal would be a key part of the TL's workflow, allowing them to manage project lifecycles, and lock/unlock projects.

User Management Modal: The existing settingsModal provides the necessary CRUD (Create, Read, Update, Delete) functionality for managing the user list.

TL Summary Modal: The existing tlSummaryModal gives the TL a high-level overview of project time. This could be enhanced to include more detailed reports.

Step-by-Step Code Modifications
HTML (index.html):

Create a new, modern-looking HTML structure for the main project dashboard. Use div and flexbox/grid for the card-based layout instead of <table>.

Keep the existing modal structures for Project Settings (tlDashboardModal), User Settings (settingsModal), and TL Summary (tlSummaryModal) as they are, but update the CSS for a cleaner, more minimalist look.

Add placeholder elements for the live timer on the project cards.

CSS (style.css):

Rewrite the styles for the .container and the main project view to support the new card-based UI.

Add new styles for project-card, status-spinner, and animated-timer.

Implement new styles for the modals to make them more modern and consistent with the new UI.

Ensure all existing buttons and other elements are styled to fit the new, cleaner aesthetic.

JavaScript (script.js):

init():

Add a new state variable, state.isTeamLead: false.

checkUserAuthorization():

After fetching the user's data from Firestore, check the role property.

Set this.state.isTeamLead = (authorizedUser.role === 'team_lead');.

Call a new function, this.methods.renderUIForRole().

renderUIForRole():

This new method would show/hide the admin buttons and modals (openTlDashboardBtn, openSettingsBtn, openTlSummaryBtn, etc.) based on this.state.isTeamLead.

renderProjects():

This is the biggest change. It would no longer generate a <table>.

It would filter the this.state.projects array based on the assignedTo property if !this.state.isTeamLead.

It would then loop through the filtered/unfiltered array and generate new div elements for each project card, dynamically inserting the project name, status spinner, and buttons.

updateProjectState():

The logic for updating the startTime, finishTime, and status in Firestore would remain the same.

You would add a new function to update the live, on-screen timer.

handleStartSession() (New Method):

This method would be called when a user clicks a "Start" button on a project card.

It would update the Firestore document and start the live timer animation.

handlePauseSession() (New Method):

This would update the finishTime in Firestore and stop the on-screen timer.

The next time the user starts, it would need to continue the timer from where it left off. This requires saving the elapsed time to the Firestore document.

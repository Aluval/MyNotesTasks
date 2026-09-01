/* ============================================================
   MyNotes & Tasks
   CLEAN DASHBOARD JAVASCRIPT
   ============================================================ */

"use strict";


/* ============================================================
   STATE
   ============================================================ */

const dashboardState = {

    user: null,

    tasks: [],

    notes: [],

    logs: [],

    stats: {

        totalTasks: 0,

        completedTasks: 0,

        pendingTasks: 0,

        overdueTasks: 0,

        totalNotes: 0,

        todayTasks: 0

    }

};


/* ============================================================
   DOM HELPERS
   ============================================================ */

function getElement(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element =
        getElement(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


function updateCounter(id, value) {

    const element =
        getElement(id);

    if (!element) {

        return;

    }

    element.textContent =
        Number(value) || 0;

}


function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ============================================================
   DATE HELPERS
   ============================================================ */

function startOfDay(
    date = new Date()
) {

    const result =
        new Date(date);


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}


function endOfDay(
    date = new Date()
) {

    const result =
        new Date(date);


    result.setHours(
        23,
        59,
        59,
        999
    );


    return result;

}


function getDateValue(value) {

    if (!value) {

        return 0;

    }


    const time =
        new Date(value).getTime();


    return Number.isNaN(time)
        ? 0
        : time;

}


function formatDate(value) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }
    );

}


function relativeTime(value) {

    if (!value) {

        return "just now";

    }


    const timestamp =
        new Date(value)
            .getTime();


    if (
        Number.isNaN(timestamp)
    ) {

        return formatDate(value);

    }


    const seconds =
        Math.floor(
            (
                Date.now() -
                timestamp
            ) / 1000
        );


    if (seconds < 60) {

        return "just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {

        return `${days}d ago`;

    }


    return formatDate(value);

}


/* ============================================================
   CAPITALIZE
   ============================================================ */

function capitalize(value) {

    const text =
        String(
            value || ""
        );


    if (!text) {

        return "";

    }


    return (
        text.charAt(0)
            .toUpperCase() +
        text.slice(1)
    );

}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    type = "info"
) {

    const container =
        getElement(
            "toastContainer"
        );


    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.innerHTML = `

        <span class="toast-message">
            ${escapeHTML(message)}
        </span>

        <button
            type="button"
            class="toast-close"
        >
            ×
        </button>

    `;


    container.appendChild(
        toast
    );


    toast
        .querySelector(
            ".toast-close"
        )
        ?.addEventListener(
            "click",
            () => toast.remove()
        );


    setTimeout(
        () => {

            if (
                toast.isConnected
            ) {

                toast.remove();

            }

        },
        3500
    );

}


/* ============================================================
   API RESPONSE MESSAGE
   ============================================================ */

function getResponseMessage(
    result,
    fallback = "Something went wrong."
) {

    return (

        result?.message ||

        result?.error ||

        result?.data?.message ||

        fallback

    );

}


/* ============================================================
   NORMALIZE TASK
   ============================================================ */

function normalizeTask(task) {

    if (
        !task ||
        typeof task !== "object"
    ) {

        return null;

    }


    const id =
        task.id ??
        task._id ??
        task.task_id ??
        "";


    return {

        ...task,

        id:
            String(id),

        title:
            String(
                task.title ??
                ""
            ),

        description:
            String(
                task.description ??
                ""
            ),

        due_date:
            task.due_date ??
            task.dueDate ??
            "",

        due_time:
            task.due_time ??
            task.dueTime ??
            "",

        priority:
            String(
                task.priority ??
                "medium"
            ).toLowerCase(),

        category:
            String(
                task.category ??
                "personal"
            ).toLowerCase(),

        completed:
            Boolean(
                task.completed
            ),

        status:
            String(
                task.status ??
                (
                    task.completed
                        ? "completed"
                        : "pending"
                )
            ).toLowerCase(),

        completed_at:
            task.completed_at ??
            null,

        created_at:
            task.created_at ??
            task.createdAt ??
            null,

        updated_at:
            task.updated_at ??
            task.updatedAt ??
            null

    };

}


/* ============================================================
   NORMALIZE NOTE
   ============================================================ */

function normalizeNote(note) {

    if (
        !note ||
        typeof note !== "object"
    ) {

        return null;

    }


    const id =
        note.id ??
        note._id ??
        note.note_id ??
        "";


    return {

        ...note,

        id:
            String(id),

        title:
            String(
                note.title ??
                ""
            ),

        content:
            String(
                note.content ??
                note.description ??
                ""
            ),

        category:
            String(
                note.category ??
                "general"
            ).toLowerCase(),

        pinned:
            Boolean(
                note.pinned ??
                false
            ),

        created_at:
            note.created_at ??
            note.createdAt ??
            null,

        updated_at:
            note.updated_at ??
            note.updatedAt ??
            null

    };

}


/* ============================================================
   NORMALIZE LOG
   ============================================================ */

function normalizeLog(log) {

    if (
        !log ||
        typeof log !== "object"
    ) {

        return null;

    }


    return {

        ...log,

        id:
            String(
                log.id ??
                log._id ??
                ""
            ),

        type:
            String(
                log.type ??
                ""
            ),

        action:
            String(
                log.action ??
                ""
            ),

        title:
            String(
                log.title ??
                ""
            ),

        description:
            String(
                log.description ??
                ""
            ),

        created_at:
            log.created_at ??
            log.createdAt ??
            null

    };

}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Dashboard JS loaded"
        );


        /*
         * Initialize UI interactions first.
         */

        initializeGlobalSearch();

        initializeNotifications();


        /*
         * Then load dashboard data.
         */

        await initializeDashboard();

    }
);


async function initializeDashboard() {

    console.log(
        "Initializing dashboard..."
    );


    initializeNotificationEvents();


    try {

        await loadDashboardUser();


        await Promise.all([

            loadDashboardStats(),

            loadDashboardTasks(),

            loadDashboardNotes(),

            loadDashboardActivity()

        ]);


        calculateLocalStats();

        renderDashboard();


        startDashboardRefresh();

    }

    catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

        showToast(
            "Unable to load dashboard.",
            "error"
        );

    }

}

/* ============================================================
   LOAD USER
   ============================================================ */

async function loadDashboardUser() {

    try {

        const result =
            await API.get(
                "/api/auth/me"
            );


        console.log(
            "Dashboard user response:",
            result
        );


        if (!result?.ok) {

            console.warn(
                "Unable to load current user."
            );

            return;

        }


        const user =
            result.data?.user ??
            result.user ??
            result.data ??
            null;


        dashboardState.user =
            user;


        updateUserUI(
            user
        );


        updateDashboardGreeting(
            user
        );

    }

    catch (error) {

        console.error(
            "Dashboard user error:",
            error
        );

    }

}


/* ============================================================
   USER UI
   ============================================================ */

function updateUserUI(user) {

    if (!user) {

        return;

    }


    const name =
        user.full_name ||
        user.fullName ||
        user.name ||
        user.username ||
        "User";


    const email =
        user.email ||
        "";


    const initials =
        getInitials(name);


    setText(
        "sidebarUserName",
        name
    );


    setText(
        "sidebarUserEmail",
        email
    );


    setText(
        "topbarUserName",
        name
    );


    setText(
        "dashboardUserName",
        name
    );

    setText(
        "welcomeUserName",
        String(name)
            .trim()
            .split(/\s+/)[0] || "User"
    );


    const sidebarAvatar =
        getElement(
            "sidebarAvatar"
        );


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    const topbarAvatar =
        getElement(
            "topbarAvatar"
        );


    if (topbarAvatar) {

        topbarAvatar.textContent =
            initials;

    }

}


/* ============================================================
   INITIALS
   ============================================================ */

function getInitials(name) {

    const value =
        String(
            name || "User"
        ).trim();


    if (!value) {

        return "U";

    }


    const parts =
        value.split(
            /\s+/
        );


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (

        parts[0][0] +

        parts[
            parts.length - 1
        ][0]

    ).toUpperCase();

}


/* ============================================================
   DASHBOARD GREETING
============================================================ */

function updateDashboardGreeting(user) {

    if (!user) {
        return;
    }


    /* --------------------------------------------------------
       GET USER NAME
    -------------------------------------------------------- */

    const name =
        user.full_name ||
        user.fullName ||
        user.name ||
        user.username ||
        "User";


    const cleanName =
        String(name).trim();


    const firstName =
        cleanName
            ? cleanName.split(/\s+/)[0]
            : "User";


    /* --------------------------------------------------------
       UPDATE WELCOME NAME
    -------------------------------------------------------- */

    setText(
        "welcomeUserName",
        firstName
    );


    /* --------------------------------------------------------
       TIME-BASED GREETING
    -------------------------------------------------------- */

    const greeting =
        getDashboardGreeting();


    setText(
        "currentGreeting",
        greeting.text
    );


    setText(
        "currentGreetingIcon",
        greeting.icon
    );


    console.log(
        "Dashboard greeting:",
        {
            name: firstName,
            greeting: greeting.text
        }
    );

}


/* ============================================================
   TIME-BASED GREETING
============================================================ */

function getDashboardGreeting() {

    const hour =
        new Date().getHours();


    if (hour < 12) {

        return {
            icon: "☀",
            text: "Good morning"
        };

    }


    if (hour < 17) {

        return {
            icon: "☀",
            text: "Good afternoon"
        };

    }


    if (hour < 21) {

        return {
            icon: "☀",
            text: "Good evening"
        };

    }


    return {
        icon: "🌙",
        text: "Good night"
    };

}


/* ============================================================
   LOAD STATISTICS
   ============================================================ */

async function loadDashboardStats() {

    try {

        const result =
            await API.get(
                "/api/dashboard/stats"
            );


        console.log(
            "Dashboard statistics response:",
            result
        );


        if (!result?.ok) {

            return;

        }


        const stats =
            result.data?.stats ??
            result.stats ??
            result.data ??
            {};


        dashboardState.stats = {

            totalTasks:
                Number(
                    stats.total_tasks ??
                    stats.totalTasks ??
                    0
                ),

            completedTasks:
                Number(
                    stats.completed_tasks ??
                    stats.completedTasks ??
                    0
                ),

            pendingTasks:
                Number(
                    stats.pending_tasks ??
                    stats.pendingTasks ??
                    0
                ),

            overdueTasks:
                Number(
                    stats.overdue_tasks ??
                    stats.overdueTasks ??
                    0
                ),

            totalNotes:
                Number(
                    stats.total_notes ??
                    stats.totalNotes ??
                    0
                ),

            todayTasks:
                Number(
                    stats.today_tasks ??
                    stats.todayTasks ??
                    0
                )

        };

    }

    catch (error) {

        console.error(
            "Dashboard stats error:",
            error
        );

    }

}


/* ============================================================
   LOAD TASKS
   ============================================================ */

async function loadDashboardTasks() {

    try {

        const result =
            await API.get(
                "/api/tasks"
            );


        console.log(
            "Dashboard tasks response:",
            result
        );


        if (!result?.ok) {

            dashboardState.tasks =
                [];

            return;

        }


        const tasks =
            result.data?.tasks ??
            result.data?.items ??
            result.tasks ??
            result.items ??
            result.data ??
            [];


        dashboardState.tasks =
            Array.isArray(tasks)

                ? tasks
                    .map(
                        normalizeTask
                    )
                    .filter(Boolean)

                : [];

    }

    catch (error) {

        console.error(
            "Dashboard tasks error:",
            error
        );


        dashboardState.tasks =
            [];

    }

}


/* ============================================================
   LOAD NOTES
   ============================================================ */

async function loadDashboardNotes() {

    try {

        const result =
            await API.get(
                "/api/notes"
            );


        console.log(
            "Dashboard notes response:",
            result
        );


        if (!result?.ok) {

            dashboardState.notes =
                [];

            return;

        }


        const notes =
            result.data?.notes ??
            result.data?.items ??
            result.notes ??
            result.items ??
            result.data ??
            [];


        dashboardState.notes =
            Array.isArray(notes)

                ? notes
                    .map(
                        normalizeNote
                    )
                    .filter(Boolean)

                : [];

    }

    catch (error) {

        console.error(
            "Dashboard notes error:",
            error
        );


        dashboardState.notes =
            [];

    }

}


/* ============================================================
   LOAD ACTIVITY
   ============================================================ */

async function loadDashboardActivity() {

    try {

        const result =
            await API.get(
                "/api/logs?limit=10"
            );


        console.log(
            "Dashboard activity response:",
            result
        );


        if (!result?.ok) {

            dashboardState.logs =
                [];

            return;

        }


        const logs =
            result.data?.logs ??
            result.data?.items ??
            result.logs ??
            result.items ??
            result.data ??
            [];


        dashboardState.logs =
            Array.isArray(logs)

                ? logs
                    .map(
                        normalizeLog
                    )
                    .filter(Boolean)

                : [];

    }

    catch (error) {

        console.error(
            "Dashboard activity error:",
            error
        );


        dashboardState.logs =
            [];

    }

}


/* ============================================================
   GLOBAL SEARCH
============================================================ */

function initializeGlobalSearch() {

    const searchButton =
        document.getElementById(
            "globalSearchButton"
        );

    const searchModal =
        document.getElementById(
            "searchModal"
        );

    const closeSearchModal =
        document.getElementById(
            "closeSearchModal"
        );

    const searchInput =
        document.getElementById(
            "globalSearch"
        );


    initializeSearchInput();


    /* --------------------------------------------------------
       OPEN SEARCH
    -------------------------------------------------------- */

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            () => {

                if (!searchModal) {
                    return;
                }

                searchModal.classList.remove(
                    "hidden"
                );

                document.body.classList.add(
                    "modal-open"
                );


                setTimeout(
                    () => {

                        searchInput?.focus();

                    },
                    100
                );

            }
        );

    }


    /* --------------------------------------------------------
       CLOSE SEARCH
    -------------------------------------------------------- */

    if (closeSearchModal) {

        closeSearchModal.addEventListener(
            "click",
            () => {

                closeSearchModalWindow();

            }
        );

    }


    /* --------------------------------------------------------
       CLICK OUTSIDE
    -------------------------------------------------------- */

    if (searchModal) {

        searchModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    searchModal
                ) {

                    closeSearchModalWindow();

                }

            }
        );

    }


    /* --------------------------------------------------------
       ESCAPE
    -------------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            if (
                searchModal &&
                !searchModal.classList.contains(
                    "hidden"
                )
            ) {

                closeSearchModalWindow();

            }

        }
    );

}


/* ============================================================
   CLOSE GLOBAL SEARCH
============================================================ */

function closeSearchModalWindow() {

    const searchModal =
        document.getElementById(
            "searchModal"
        );

    const searchInput =
        document.getElementById(
            "globalSearch"
        );


    if (searchModal) {

        searchModal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );


    if (searchInput) {

        searchInput.value = "";

    }

}


/* ============================================================
   NOTIFICATIONS
   ============================================================ */

function initializeNotifications() {

    const notificationButton =
        getElement("notificationButton");

    const notificationPanel =
        getElement("notificationPanel");


    if (!notificationButton || !notificationPanel) {

        console.warn(
            "Notification elements were not found."
        );

        return;
    }

}


function initializeNotificationEvents() {

    // Placeholder for notification event initialization
    // Add event listeners as needed

}

/* ============================================================
   NOTIFICATION BUTTON - DIRECT FIX
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Setting notification button..."
        );


        const button =
            document.getElementById(
                "notificationButton"
            );


        const panel =
            document.getElementById(
                "notificationPanel"
            );


        const closeButton =
            document.getElementById(
                "closeNotifications"
            );


        console.log(
            "Notification button:",
            button
        );


        console.log(
            "Notification panel:",
            panel
        );


        if (!button) {

            console.error(
                "ERROR: #notificationButton not found."
            );

            return;

        }


        if (!panel) {

            console.error(
                "ERROR: #notificationPanel not found."
            );

            return;

        }


        /* ----------------------------------------------------
           OPEN / CLOSE
        ---------------------------------------------------- */

        button.onclick =
            function (event) {

                event.preventDefault();

                event.stopPropagation();


                console.log(
                    "NOTIFICATION BUTTON CLICKED"
                );


                panel.classList.toggle(
                    "hidden"
                );


                console.log(
                    "Notification panel hidden:",
                    panel.classList.contains(
                        "hidden"
                    )
                );


                /*
                 * Load notifications whenever
                 * the panel is opened.
                 */

                if (
                    !panel.classList.contains(
                        "hidden"
                    )
                ) {

                    if (
                        typeof loadDashboardNotifications ===
                        "function"
                    ) {

                        loadDashboardNotifications();

                    }

                }

            };


        /* ----------------------------------------------------
           CLOSE BUTTON
        ---------------------------------------------------- */

        if (closeButton) {

            closeButton.onclick =
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    panel.classList.add(
                        "hidden"
                    );

                };

        }


        console.log(
            "Notification button ready."
        );

    }
);

/* ============================================================
   NOTIFICATIONS
============================================================ */

function openNotifications() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!panel) {

        return;

    }


    panel.classList.remove(
        "hidden"
    );


    loadDashboardNotifications();

}


function closeNotifications() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!panel) {

        return;

    }


    panel.classList.add(
        "hidden"
    );

}


function toggleNotifications() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!panel) {

        return;

    }


    if (
        panel.classList.contains(
            "hidden"
        )
    ) {

        openNotifications();

    }

    else {

        closeNotifications();

    }

}


/* ============================================================
   LOAD DASHBOARD NOTIFICATIONS
============================================================ */

/* ============================================================
   DASHBOARD NOTIFICATIONS
   ONLY TODAY'S TASKS
============================================================ */

async function loadDashboardNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) {

        console.warn(
            "#notificationList not found."
        );

        return;

    }


    /* ========================================================
       LOADING
    ======================================================== */

    list.innerHTML = `

        <div class="notification-loading">

            <div class="notification-loading-icon">
                ◷
            </div>

            <strong>
                Loading notifications...
            </strong>

            <p>
                Checking today's tasks.
            </p>

        </div>

    `;


    try {

        const result =
            await API.get(
                "/api/tasks"
            );


        console.log(
            "Notification API response:",
            result
        );


        if (
            !result ||
            result.ok !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to load notifications."
            );

        }


        /* ====================================================
           GET TASKS
        ==================================================== */

        let tasks =
            result.tasks ||
            result.data?.tasks ||
            result.items ||
            result.data ||
            [];


        if (
            !Array.isArray(tasks)
        ) {

            tasks = [];

        }


        /* ====================================================
           TODAY DATE
        ==================================================== */

        const today =
            new Date();


        const todayYear =
            today.getFullYear();


        const todayMonth =
            today.getMonth();


        const todayDate =
            today.getDate();


        /* ====================================================
           ONLY TODAY'S TASKS
        ==================================================== */

        const todayTasks =
            tasks.filter(
                task => {

                    if (
                        !task ||
                        !task.due_date
                    ) {

                        return false;

                    }


                    /*
                     * Do not show completed
                     * tasks as today's notifications.
                     */

                    if (
                        task.completed === true ||
                        String(
                            task.status || ""
                        ).toLowerCase() ===
                        "completed"
                    ) {

                        return false;

                    }


                    const taskDate =
                        new Date(
                            `${task.due_date}T00:00:00`
                        );


                    if (
                        Number.isNaN(
                            taskDate.getTime()
                        )
                    ) {

                        return false;

                    }


                    return (

                        taskDate.getFullYear() ===
                        todayYear &&

                        taskDate.getMonth() ===
                        todayMonth &&

                        taskDate.getDate() ===
                        todayDate

                    );

                }
            );


        /* ====================================================
           SORT TODAY'S TASKS BY TIME
        ==================================================== */

        todayTasks.sort(
            (
                a,
                b
            ) => {

                const timeA =
                    a.due_time ||
                    "23:59";


                const timeB =
                    b.due_time ||
                    "23:59";


                return String(
                    timeA
                ).localeCompare(
                    String(
                        timeB
                    )
                );

            }
        );


        console.log(
            "Today's notification tasks:",
            todayTasks
        );


        /* ====================================================
           EMPTY
        ==================================================== */

        if (
            todayTasks.length === 0
        ) {

            list.innerHTML = `

                <div class="notification-empty">

                    <div class="notification-empty-icon">
                        ✓
                    </div>

                    <strong>
                        No notifications
                    </strong>

                    <p>
                        You have no pending tasks for today.
                    </p>

                </div>

            `;


            updateNotificationDot(
                false
            );


            return;

        }


        /* ====================================================
           RENDER TODAY'S TASKS
        ==================================================== */

        list.innerHTML =
            todayTasks
                .map(
                    renderTodayNotification
                )
                .join("");


        updateNotificationDot(
            true
        );


    }

    catch (error) {

        console.error(
            "Notification loading error:",
            error
        );


        list.innerHTML = `

            <div class="notification-empty">

                <div class="notification-empty-icon">
                    !
                </div>

                <strong>
                    Unable to load notifications
                </strong>

                <p>
                    Please try again.
                </p>

                <button
                    type="button"
                    class="btn btn-primary btn-small"
                    onclick="loadDashboardNotifications()"
                >
                    Try Again
                </button>

            </div>

        `;


        updateNotificationDot(
            false
        );

    }

}


/* ============================================================
   RENDER TODAY TASK NOTIFICATION
============================================================ */

function renderTodayNotification(
    task
) {

    const title =
        String(
            task.title ||
            "Untitled task"
        );


    const time =
        task.due_time
            ? formatNotificationTime(
                task.due_time
            )
            : "Today";


    const priority =
        String(
            task.priority ||
            "medium"
        );


    return `

        <div
            class="notification-item today-task"
        >

            <div
                class="notification-item-icon"
            >
                ☑
            </div>


            <div
                class="notification-item-content"
            >

                <strong>
                    Today's Task
                </strong>


                <p>
                    ${escapeHTML(
                        title
                    )}
                </p>


                <span>
                    ${escapeHTML(
                        time
                    )}
                    ${priority
                        ? ` · ${escapeHTML(
                            capitalize(
                                priority
                            )
                        )}`
                        : ""
                    }
                </span>

            </div>

        </div>

    `;

}


/* ============================================================
   FORMAT NOTIFICATION TIME
============================================================ */

function formatNotificationTime(
    value
) {

    if (!value) {

        return "Today";

    }


    const parts =
        String(
            value
        ).split(":");


    if (
        parts.length < 2
    ) {

        return value;

    }


    let hour =
        parseInt(
            parts[0],
            10
        );


    const minute =
        parts[1];


    if (
        Number.isNaN(
            hour
        )
    ) {

        return value;

    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${suffix}`;

}


/* ============================================================
   NOTIFICATION DOT
============================================================ */

function updateNotificationDot(
    show
) {

    const dot =
        document.getElementById(
            "notificationDot"
        );


    if (!dot) {

        return;

    }


    dot.classList.toggle(
        "hidden",
        !show
    );

}


/* ============================================================
   GLOBAL
============================================================ */

window.loadDashboardNotifications =
    loadDashboardNotifications;


/* ============================================================
   GLOBAL SEARCH
============================================================ */

function performGlobalSearch(query) {

    const resultsContainer =
        getElement(
            "searchResults"
        );


    if (!resultsContainer) {

        return;

    }


    const searchTerm =
        String(query || "")
            .trim()
            .toLowerCase();


    if (!searchTerm) {

        resultsContainer.innerHTML = `

            <div class="search-empty">

                <span>⌕</span>

                <p>
                    Start typing to search
                </p>

            </div>

        `;

        return;

    }


    const taskResults =
        dashboardState.tasks.filter(
            task => {

                const text =
                    [

                        task.title,

                        task.description,

                        task.category,

                        task.priority

                    ]
                        .join(" ")
                        .toLowerCase();


                return text.includes(
                    searchTerm
                );

            }
        );


    const noteResults =
        dashboardState.notes.filter(
            note => {

                const text =
                    [

                        note.title,

                        note.content,

                        note.category

                    ]
                        .join(" ")
                        .toLowerCase();


                return text.includes(
                    searchTerm
                );

            }
        );


    if (
        !taskResults.length &&
        !noteResults.length
    ) {

        resultsContainer.innerHTML = `

            <div class="search-empty">

                <span>⌕</span>

                <p>
                    No results found
                </p>

                <small>
                    Try a different search term.
                </small>

            </div>

        `;

        return;

    }


    let html = "";


    if (taskResults.length) {

        html += `

            <div class="search-section">

                <div class="search-section-title">
                    TASKS
                </div>

                ${taskResults
                    .slice(0, 10)
                    .map(
                        task => `

                            <a
                                href="/tasks"
                                class="search-result-item"
                            >

                                <div class="search-result-icon">
                                    ☑
                                </div>

                                <div class="search-result-content">

                                    <strong>
                                        ${escapeHTML(
                                            task.title
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            task.due_date
                                                ? formatDate(
                                                    task.due_date
                                                )
                                                : "No due date"
                                        )}
                                    </span>

                                </div>

                            </a>

                        `
                    )
                    .join("")}

            </div>

        `;

    }


    if (noteResults.length) {

        html += `

            <div class="search-section">

                <div class="search-section-title">
                    NOTES
                </div>

                ${noteResults
                    .slice(0, 10)
                    .map(
                        note => `

                            <a
                                href="/notes"
                                class="search-result-item"
                            >

                                <div class="search-result-icon">
                                    ✎
                                </div>

                                <div class="search-result-content">

                                    <strong>
                                        ${escapeHTML(
                                            note.title
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            note.category
                                        )}
                                    </span>

                                </div>

                            </a>

                        `
                    )
                    .join("")}

            </div>

        `;

    }


    resultsContainer.innerHTML =
        html;

}


/* ============================================================
   SEARCH INPUT
============================================================ */

function initializeSearchInput() {

    const searchInput =
        getElement(
            "globalSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        event => {

            performGlobalSearch(
                event.target.value
            );

        }
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                performGlobalSearch(
                    event.target.value
                );

            }

        }
    );

}
/* ============================================================
   RENDER DASHBOARD
   ============================================================ */

function renderDashboard() {

    console.log(
        "Rendering dashboard..."
    );


    renderDashboardDate();

    renderDashboardStats();

    renderTodayTasks();

    renderUpcomingTasks();

    renderRecentActivity();

    renderDashboardProgress();

    updateSidebarCounts();

    updateDashboardGreeting(
        dashboardState.user
    );


    /*
     * Notifications depend on the
     * freshly loaded task data.
     */

    if (
        typeof window.renderDashboardNotifications ===
        "function"
    ) {

        window.renderDashboardNotifications();

    }

}


/* ============================================================
   DASHBOARD DATE
   ============================================================ */

function renderDashboardDate() {

    const today =
        new Date();


    setText(
        "todayDate",
        today.toLocaleDateString(
            "en-IN",
            {

                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"

            }
        )
    );

}


/* ============================================================
   DASHBOARD STATISTICS
   ============================================================ */

function renderDashboardStats() {

    const stats =
        dashboardState.stats;


    setText(
        "totalNotes",
        stats.totalNotes
    );


    setText(
        "totalTasks",
        stats.totalTasks
    );


    setText(
        "completedTasks",
        stats.completedTasks
    );


    setText(
        "pendingTasks",
        stats.pendingTasks
    );

}


/* ============================================================
   CALCULATE LOCAL STATISTICS
   ============================================================ */

function calculateLocalStats() {

    const tasks =
        Array.isArray(
            dashboardState.tasks
        )
            ? dashboardState.tasks
            : [];


    const notes =
        Array.isArray(
            dashboardState.notes
        )
            ? dashboardState.notes
            : [];


    /*
     * If task API contains data, use it
     * as a reliable fallback.
     */

    const totalTasks =
        tasks.length;


    const completedTasks =
        tasks.filter(
            task =>
                Boolean(
                    task.completed
                ) ||
                task.status ===
                    "completed"
        ).length;


    const pendingTasks =
        tasks.filter(
            task =>
                !(
                    Boolean(
                        task.completed
                    ) ||
                    task.status ===
                        "completed"
                )
        ).length;


    const today =
        startOfDay();


    const todayTasks =
        tasks.filter(
            task => {

                if (
                    task.completed ||
                    task.status ===
                        "completed" ||
                    !task.due_date
                ) {

                    return false;

                }


                const taskDate =
                    startOfDay(
                        new Date(
                            task.due_date
                        )
                    );


                return (
                    taskDate.getTime() ===
                    today.getTime()
                );

            }
        ).length;


    const overdueTasks =
        tasks.filter(
            task => {

                if (
                    task.completed ||
                    task.status ===
                        "completed" ||
                    !task.due_date
                ) {

                    return false;

                }


                const taskDate =
                    startOfDay(
                        new Date(
                            task.due_date
                        )
                    );


                return (
                    taskDate < today
                );

            }
        ).length;


    /*
     * Preserve valid API statistics
     * when they were returned.
     */

    dashboardState.stats.totalTasks =
        Number.isFinite(
            dashboardState.stats.totalTasks
        ) &&
        dashboardState.stats.totalTasks > 0
            ? dashboardState.stats.totalTasks
            : totalTasks;


    dashboardState.stats.completedTasks =
        Number.isFinite(
            dashboardState.stats.completedTasks
        )
            ? dashboardState.stats.completedTasks
            : completedTasks;


    dashboardState.stats.pendingTasks =
        Number.isFinite(
            dashboardState.stats.pendingTasks
        )
            ? dashboardState.stats.pendingTasks
            : pendingTasks;


    dashboardState.stats.overdueTasks =
        Number.isFinite(
            dashboardState.stats.overdueTasks
        )
            ? dashboardState.stats.overdueTasks
            : overdueTasks;


    dashboardState.stats.totalNotes =
        Number.isFinite(
            dashboardState.stats.totalNotes
        ) &&
        dashboardState.stats.totalNotes > 0
            ? dashboardState.stats.totalNotes
            : notes.length;


    dashboardState.stats.todayTasks =
        todayTasks;


    /*
     * When the local task collection is
     * available, make sure counts match
     * the actual loaded data.
     */

    if (tasks.length > 0) {

        dashboardState.stats.totalTasks =
            totalTasks;

        dashboardState.stats.completedTasks =
            completedTasks;

        dashboardState.stats.pendingTasks =
            pendingTasks;

        dashboardState.stats.overdueTasks =
            overdueTasks;

    }


    if (notes.length > 0) {

        dashboardState.stats.totalNotes =
            notes.length;

    }


    console.log(
        "Local dashboard statistics:",
        dashboardState.stats
    );

}


/* ============================================================
   SIDEBAR COUNTS
   ============================================================ */

function updateSidebarCounts() {

    const tasks =
        Array.isArray(
            dashboardState.tasks
        )
            ? dashboardState.tasks
            : [];


    const notes =
        Array.isArray(
            dashboardState.notes
        )
            ? dashboardState.notes
            : [];


    const pending =
        tasks.filter(
            task =>
                !task.completed &&
                task.status !==
                    "completed"
        );


    const upcoming =
        pending.filter(
            task =>
                Boolean(
                    task.due_date
                )
        );


    updateCounter(
        "tasksCount",
        tasks.length
    );


    updateCounter(
        "notesCount",
        notes.length
    );


    updateCounter(
        "upcomingCount",
        upcoming.length
    );

}


/* ============================================================
   TODAY'S TASKS
   ============================================================ */

function renderTodayTasks() {

    const container =
        getElement(
            "todayTasks"
        );


    const emptyState =
        getElement(
            "emptyTodayTasks"
        );


    if (!container) {

        return;

    }


    const today =
        startOfDay();


    const tasks =
        dashboardState.tasks.filter(
            task => {

                if (
                    !task.due_date
                ) {

                    return false;

                }


                if (
                    task.completed ||
                    task.status ===
                        "completed"
                ) {

                    return false;

                }


                const dueDate =
                    startOfDay(
                        new Date(
                            task.due_date
                        )
                    );


                return (
                    dueDate.getTime() ===
                    today.getTime()
                );

            }
        );


    tasks.sort(
        compareDashboardTasks
    );


    if (!tasks.length) {

        container.innerHTML =
            "";


        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    container.innerHTML =
        tasks
            .slice(
                0,
                5
            )
            .map(
                renderDashboardTask
            )
            .join("");

}


/* ============================================================
   COMPARE TASKS
   ============================================================ */

function compareDashboardTasks(
    a,
    b
) {

    const dateA =
        new Date(
            `${a.due_date || "9999-12-31"}T${
                a.due_time || "23:59"
            }`
        ).getTime();


    const dateB =
        new Date(
            `${b.due_date || "9999-12-31"}T${
                b.due_time || "23:59"
            }`
        ).getTime();


    return (
        dateA - dateB
    );

}


/* ============================================================
   RENDER DASHBOARD TASK
   ============================================================ */

function renderDashboardTask(
    task
) {

    const priority =
        String(
            task.priority ||
            "medium"
        ).toLowerCase();


    const dueText =
        getDashboardTaskDueText(
            task
        );


    return `

        <article
            class="dashboard-task-item"
            data-task-id="${escapeHTML(
                task.id
            )}"
        >

            <div
                class="dashboard-task-check ${
                    task.completed
                        ? "completed"
                        : ""
                }"
            >
                ${
                    task.completed
                        ? "✓"
                        : "○"
                }
            </div>


            <div
                class="dashboard-task-content"
            >

                <strong>
                    ${escapeHTML(
                        task.title
                    )}
                </strong>


                <span>
                    ${escapeHTML(
                        dueText
                    )}
                </span>

            </div>


            <span
                class="priority-badge ${escapeHTML(
                    priority
                )}"
            >
                ${escapeHTML(
                    capitalize(
                        priority
                    )
                )}
            </span>

        </article>

    `;

}


/* ============================================================
   TASK DUE TEXT
   ============================================================ */

function getDashboardTaskDueText(
    task
) {

    if (!task) {

        return "";

    }


    if (
        !task.due_date
    ) {

        return "No due date";

    }


    const date =
        new Date(
            `${task.due_date}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            task.due_date
        );

    }


    const today =
        startOfDay();


    const taskDay =
        startOfDay(
            date
        );


    let label;


    if (
        taskDay.getTime() ===
        today.getTime()
    ) {

        label =
            "Today";

    }

    else {

        const tomorrow =
            new Date(today);


        tomorrow.setDate(
            tomorrow.getDate() + 1
        );


        if (
            taskDay.getTime() ===
            tomorrow.getTime()
        ) {

            label =
                "Tomorrow";

        }

        else {

            label =
                formatDate(
                    task.due_date
                );

        }

    }


    if (
        task.due_time
    ) {

        label +=
            ` ${formatTime(
                task.due_time
            )}`;

    }


    return label;

}


/* ============================================================
   FORMAT TIME
   ============================================================ */

function formatTime(
    value
) {

    if (!value) {

        return "";

    }


    const text =
        String(
            value
        );


    const match =
        text.match(
            /^(\d{1,2}):(\d{2})$/
        );


    if (!match) {

        return text;

    }


    let hours =
        Number(
            match[1]
        );


    const minutes =
        match[2];


    if (
        hours > 23
    ) {

        return text;

    }


    const suffix =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12 ||
        12;


    return (
        `${hours}:${minutes} ${suffix}`
    );

}


/* ============================================================
   UPCOMING DASHBOARD TASKS
   ============================================================ */

function renderUpcomingTasks() {

    const container =
        getElement(
            "upcomingTasks"
        );


    if (!container) {

        return;

    }


    const today =
        startOfDay();


    const tasks =
        dashboardState.tasks

            .filter(
                task => {

                    if (
                        task.completed ||
                        task.status ===
                            "completed"
                    ) {

                        return false;

                    }


                    if (
                        !task.due_date
                    ) {

                        return false;

                    }


                    const dueDate =
                        startOfDay(
                            new Date(
                                task.due_date
                            )
                        );


                    return (
                        dueDate >= today
                    );

                }
            )

            .sort(
                compareDashboardTasks
            );


    if (!tasks.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ✓
                </div>

                <h4>
                    Nothing upcoming
                </h4>

                <p>
                    You have no upcoming tasks.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        tasks
            .slice(
                0,
                5
            )
            .map(
                renderDashboardUpcomingTask
            )
            .join("");

}


/* ============================================================
   RENDER UPCOMING ITEM
   ============================================================ */

function renderDashboardUpcomingTask(
    task
) {

    const date =
        new Date(
            `${task.due_date}T00:00:00`
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const month =
        date.toLocaleDateString(
            "en-IN",
            {
                month:
                    "short"
            }
        );


    return `

        <a
            href="/tasks"
            class="upcoming-item"
            data-task-id="${escapeHTML(
                task.id
            )}"
        >

            <div class="upcoming-item-date">

                <strong>
                    ${escapeHTML(day)}
                </strong>

                <span>
                    ${escapeHTML(
                        month
                    )}
                </span>

            </div>


            <div class="upcoming-item-content">

                <strong>
                    ${escapeHTML(
                        task.title
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        task.due_time
                            ? formatTime(
                                task.due_time
                            )
                            : formatDate(
                                task.due_date
                            )
                    )}
                </span>

            </div>

        </a>

    `;

}


/* ============================================================
   RECENT ACTIVITY
   ============================================================ */

function renderRecentActivity() {

    const container =
        getElement(
            "recentActivity"
        );


    if (!container) {

        return;

    }


    const logs =
        Array.isArray(
            dashboardState.logs
        )
            ? dashboardState.logs
            : [];


    if (!logs.length) {

        container.innerHTML = `

            <div class="activity-empty">

                <span>
                    ✓
                </span>

                <p>
                    No recent activity.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        logs
            .slice(
                0,
                8
            )
            .map(
                renderActivityItem
            )
            .join("");

}


/* ============================================================
   RENDER ACTIVITY ITEM
   ============================================================ */

function renderActivityItem(
    log
) {

    const action =
        capitalize(
            log.action ||
            "activity"
        );


    const title =
        log.title ||
        log.description ||
        "Workspace activity";


    const icon =
        getActivityIcon(
            log.action ||
            log.type
        );


    return `

        <div class="activity-item">

            <div class="activity-icon">
                ${icon}
            </div>

            <div class="activity-content">

                <strong>
                    ${escapeHTML(
                        title
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        action
                    )}
                    ·
                    ${escapeHTML(
                        relativeTime(
                            log.created_at
                        )
                    )}
                </span>

            </div>

        </div>

    `;

}


/* ============================================================
   ACTIVITY ICON
   ============================================================ */

function getActivityIcon(
    action
) {

    const value =
        String(
            action || ""
        ).toLowerCase();


    if (
        value.includes(
            "create"
        )
    ) {

        return "+";

    }


    if (
        value.includes(
            "complete"
        )
    ) {

        return "✓";

    }


    if (
        value.includes(
            "delete"
        )
    ) {

        return "×";

    }


    if (
        value.includes(
            "update"
        ) ||
        value.includes(
            "edit"
        )
    ) {

        return "✎";

    }


    if (
        value.includes(
            "login"
        )
    ) {

        return "↪";

    }


    return "•";

}


/* ============================================================
   DASHBOARD PROGRESS
   ============================================================ */

function renderDashboardProgress() {

    const total =
        Number(
            dashboardState.stats.totalTasks
        ) || 0;


    const completed =
        Number(
            dashboardState.stats.completedTasks
        ) || 0;


    const pending =
        Math.max(
            total - completed,
            0
        );


    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    setText(
        "completionPercentage",
        `${percentage}%`
    );


    setText(
        "progressCompleted",
        completed
    );


    setText(
        "progressPending",
        pending
    );


    const progress =
        getElement(
            "completionProgress"
        );


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }

}


/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */

function initializeSidebar() {

    const sidebar =
        getElement(
            "appSidebar"
        );

    const openButton =
        getElement(
            "openSidebar"
        );

    const closeButton =
        getElement(
            "closeSidebar"
        );

    const overlay =
        getElement(
            "sidebarOverlay"
        );


    if (!sidebar) {

        return;

    }


    function openSidebar() {

        sidebar.classList.add(
            "open"
        );

        overlay?.classList.add(
            "open"
        );

        document.body.classList.add(
            "sidebar-open"
        );

    }


    function closeSidebar() {

        sidebar.classList.remove(
            "open"
        );

        overlay?.classList.remove(
            "open"
        );

        document.body.classList.remove(
            "sidebar-open"
        );

    }


    openButton?.addEventListener(
        "click",
        openSidebar
    );


    closeButton?.addEventListener(
        "click",
        closeSidebar
    );


    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeSidebar();

            }

        }
    );

}


/* ============================================================
   INITIALIZE SIDEBAR
   ============================================================ */

initializeSidebar();


/* ============================================================
   LOGOUT
   ============================================================ */

function initializeLogout() {

    const logoutButton =
        getElement(
            "logoutButton"
        );

    const logoutModal =
        getElement(
            "logoutModal"
        );

    const cancelLogout =
        getElement(
            "cancelLogout"
        );

    const confirmLogout =
        getElement(
            "confirmLogout"
        );


    if (!logoutButton) {

        return;

    }


    function openLogoutModal() {

        if (logoutModal) {

            logoutModal.classList.remove(
                "hidden"
            );

        }

    }


    function closeLogoutModal() {

        if (logoutModal) {

            logoutModal.classList.add(
                "hidden"
            );

        }

    }


    logoutButton.addEventListener(
        "click",
        openLogoutModal
    );


    cancelLogout?.addEventListener(
        "click",
        closeLogoutModal
    );


    logoutModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                logoutModal
            ) {

                closeLogoutModal();

            }

        }
    );


    confirmLogout?.addEventListener(
        "click",
        async () => {

            confirmLogout.disabled =
                true;


            try {

                let result;


                if (
                    typeof API !==
                    "undefined" &&
                    typeof API.post ===
                        "function"
                ) {

                    result =
                        await API.post(
                            "/api/auth/logout",
                            {}
                        );

                }

                else {

                    result = {
                        ok: true
                    };

                }


                if (
                    result?.ok === false
                ) {

                    throw new Error(
                        getResponseMessage(
                            result,
                            "Logout failed."
                        )
                    );

                }


                window.location.href =
                    "/login";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                /*
                 * If the backend does not
                 * expose a logout endpoint,
                 * still navigate to login.
                 */

                window.location.href =
                    "/login";

            }

            finally {

                confirmLogout.disabled =
                    false;

            }

        }
    );

}


initializeLogout();


/* ============================================================
   REFRESH DASHBOARD
   ============================================================ */

let dashboardRefreshTimer =
    null;


function startDashboardRefresh(...args) {

    if (dashboardRefreshTimer) {

        clearInterval(
            dashboardRefreshTimer
        );

    }


    /*
     * Refresh every 60 seconds.
     *
     * This also keeps the greeting
     * and today's date correct.
     */
    dashboardRefreshTimer =
        setInterval(
            async () => {

                try {

                    await Promise.all([
                        loadDashboardStats(),

                        loadDashboardTasks(),

                        loadDashboardNotes(),

                        loadDashboardActivity()
                    ]);


                    calculateLocalStats();

                    renderDashboard();

                }

                catch (error) {

                    console.error(
                        "Dashboard refresh error:",
                        error
                    );

                }

            },
            60000
        );

}


/* ============================================================
   STOP REFRESH
   ============================================================ */

function stopDashboardRefresh() {

    if (
        dashboardRefreshTimer
    ) {

        clearInterval(
            dashboardRefreshTimer
        );


        dashboardRefreshTimer =
            null;

    }

}


/* ============================================================
   VISIBILITY REFRESH
   ============================================================ */

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            updateDashboardGreeting();

            updateDashboardDate();

        }

    }
);


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.openGlobalSearch =
    openGlobalSearch;


window.closeGlobalSearch =
    closeGlobalSearch;


window.openNotifications =
    openNotifications;


window.closeNotifications =
    closeNotifications;


window.toggleNotifications =
    toggleNotifications;


window.completeDashboardTask =
    completeDashboardTask;


window.loadDashboardStats =
    loadDashboardStats;


window.loadDashboardTasks =
    loadDashboardTasks;


window.loadDashboardNotes =
    loadDashboardNotes;


window.loadDashboardActivity =
    loadDashboardActivity;


/* ============================================================
   FINAL STARTUP
   ============================================================ */

console.log(
    "Dashboard UI handlers ready."
);




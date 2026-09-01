"use strict";

// ============================================================
// MyNotes & Tasks
// LOGS.JS
// ============================================================

console.log("Logs JS loaded");


// ============================================================
// STATE
// ============================================================

const logsState = {

    logs: [],

    filteredLogs: [],

    search: "",

    type: "all",

    period: "all"

};


// ============================================================
// DOM
// ============================================================

function $(id) {

    return document.getElementById(id);

}


// ============================================================
// TEXT
// ============================================================

function setText(id, value) {

    const element = $(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// DATE
// ============================================================

function parseDate(value) {

    if (!value) {

        return null;

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    return date;

}


function formatDateTime(value) {

    const date =
        parseDate(value);

    if (!date) {

        return "—";

    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// ACTION TEXT
// ============================================================

function formatAction(action) {

    const value =
        String(
            action || "activity"
        )
            .toLowerCase()
            .trim();


    const actions = {

        created:
            "Created",

        create:
            "Created",

        added:
            "Added",

        add:
            "Added",

        updated:
            "Updated",

        update:
            "Updated",

        edited:
            "Edited",

        edit:
            "Edited",

        deleted:
            "Deleted",

        delete:
            "Deleted",

        removed:
            "Removed",

        remove:
            "Removed",

        completed:
            "Completed",

        complete:
            "Completed",

        login:
            "Logged in",

        logout:
            "Logged out",

        verified:
            "Email verified",

        verify:
            "Email verified"

    };


    return (
        actions[value] ||
        capitalize(value)
    );

}


// ============================================================
// CAPITALIZE
// ============================================================

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


// ============================================================
// NORMALIZE LOG
// ============================================================

function normalizeLog(log) {

    if (
        !log ||
        typeof log !== "object"
    ) {

        return null;

    }


    return {

        id:
            String(
                log.id ??
                log._id ??
                ""
            ),

        user_id:
            log.user_id ??
            "",

        action:
            String(
                log.action ??
                ""
            ),

        type:
            String(
                log.type ??
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

        category:
            String(
                log.category ??
                ""
            ),

        task_id:
            log.task_id ??
            null,

        note_id:
            log.note_id ??
            null,

        created_at:
            log.created_at ??
            null

    };

}


// ============================================================
// LOAD LOGS
// ============================================================

async function loadLogs() {

    console.log(
        "Loading logs..."
    );


    const timeline =
        $("activityTimeline");


    if (timeline) {

        timeline.innerHTML = `

            <div class="loading-state">

                <div class="loading-spinner"></div>

                <span>
                    Loading activity...
                </span>

            </div>

        `;

    }


    try {

        const response =
            await fetch(
                "/api/logs?limit=500",
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "Logs HTTP status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Logs API data:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load logs."
            );

        }


        /*
         * Your actual Flask response is:
         *
         * {
         *     "logs": [...]
         *     "ok": true
         * }
         */

        const rawLogs =
            Array.isArray(
                data.logs
            )
                ? data.logs
                : [];


        logsState.logs =
            rawLogs
                .map(
                    normalizeLog
                )
                .filter(Boolean);


        console.log(
            "Loaded logs:",
            logsState.logs.length
        );


        applyFilters();

    }

    catch (error) {

        console.error(
            "Logs loading error:",
            error
        );


        if (timeline) {

            timeline.innerHTML = `

                <div class="empty-state">

                    <div class="empty-state-icon">
                        !
                    </div>

                    <h4>
                        Unable to load activity
                    </h4>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Please try again."
                        )}
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="retryLogsButton"
                    >
                        Try Again
                    </button>

                </div>

            `;


            const retry =
                $("retryLogsButton");


            if (retry) {

                retry.addEventListener(
                    "click",
                    loadLogs
                );

            }

        }

    }

}


// ============================================================
// FILTER
// ============================================================

function applyFilters() {

    let logs =
        [...logsState.logs];


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (
        logsState.search
    ) {

        const search =
            logsState.search
                .toLowerCase();


        logs =
            logs.filter(
                log => {

                    const text = [

                        log.action,

                        log.type,

                        log.title,

                        log.description,

                        log.category

                    ]
                        .join(" ")
                        .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    // --------------------------------------------------------
    // TYPE
    // --------------------------------------------------------

    if (
        logsState.type !==
        "all"
    ) {

        logs =
            logs.filter(
                log =>
                    String(
                        log.type ||
                        ""
                    )
                        .toLowerCase() ===
                    logsState.type
            );

    }


    // --------------------------------------------------------
    // PERIOD
    // --------------------------------------------------------

    if (
        logsState.period !==
        "all"
    ) {

        const now =
            new Date();


        logs =
            logs.filter(
                log => {

                    const date =
                        parseDate(
                            log.created_at
                        );


                    if (!date) {

                        return false;

                    }


                    if (
                        logsState.period ===
                        "today"
                    ) {

                        return (
                            date.getFullYear() ===
                                now.getFullYear() &&

                            date.getMonth() ===
                                now.getMonth() &&

                            date.getDate() ===
                                now.getDate()
                        );

                    }


                    if (
                        logsState.period ===
                        "week"
                    ) {

                        const weekAgo =
                            new Date(
                                now
                            );

                        weekAgo.setDate(
                            now.getDate() - 7
                        );

                        return date >=
                            weekAgo;

                    }


                    if (
                        logsState.period ===
                        "month"
                    ) {

                        return (
                            date.getFullYear() ===
                                now.getFullYear() &&

                            date.getMonth() ===
                                now.getMonth()
                        );

                    }


                    return true;

                }
            );

    }


    logsState.filteredLogs =
        logs;


    renderLogs();

    updateStatistics();
    loadCompletedTasks();

}


// ============================================================
// RENDER LOGS
// ============================================================

function renderLogs() {

    const timeline =
        $("activityTimeline");


    if (!timeline) {

        console.error(
            "#activityTimeline not found."
        );

        return;

    }


    const empty =
        $("activityEmpty");


    const logs =
        logsState.filteredLogs;


    if (!logs.length) {

        timeline.innerHTML = "";


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    timeline.innerHTML =
        logs
            .map(
                renderLog
            )
            .join("");

}


// ============================================================
// RENDER SINGLE LOG
// ============================================================

function renderLog(log) {

    const action =
        formatAction(
            log.action
        );


    const title =
        log.title ||
        action;


    const description =
        log.description ||
        "";


    const type =
        log.type ||
        "";


    const icon =
        getIcon(
            log
        );


    const cssClass =
        getLogClass(
            log
        );


    return `

        <div
            class="activity-item"
            data-log-id="${escapeHTML(log.id)}"
        >

            <div
                class="activity-icon ${cssClass}"
            >
                ${icon}
            </div>


            <div
                class="activity-content"
            >

                <div
                    class="activity-header"
                >

                    <strong>
                        ${escapeHTML(action)}
                    </strong>

                    <time>
                        ${escapeHTML(
                            formatDateTime(
                                log.created_at
                            )
                        )}
                    </time>

                </div>


                <h4>
                    ${escapeHTML(title)}
                </h4>


                ${
                    description
                        ? `
                            <p>
                                ${escapeHTML(
                                    description
                                )}
                            </p>
                        `
                        : ""
                }


                <div
                    class="activity-meta"
                >

                    ${
                        type
                            ? `
                                <span>
                                    ${escapeHTML(
                                        capitalize(
                                            type
                                        )
                                    )}
                                </span>
                            `
                            : ""
                    }


                    ${
                        log.category
                            ? `
                                <span>
                                    ${escapeHTML(
                                        log.category
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>

        </div>

    `;

}


// ============================================================
// ICON
// ============================================================

function getIcon(log) {

    const value =
        `${log.action} ${log.type}`
            .toLowerCase();


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
        ) ||
        value.includes(
            "remove"
        )
    ) {

        return "×";

    }


    if (
        value.includes(
            "create"
        ) ||
        value.includes(
            "add"
        )
    ) {

        return "+";

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

        return "→";

    }


    if (
        value.includes(
            "logout"
        )
    ) {

        return "←";

    }


    if (
        value.includes(
            "verify"
        )
    ) {

        return "✓";

    }


    if (
        value.includes(
            "task"
        )
    ) {

        return "☑";

    }


    if (
        value.includes(
            "note"
        )
    ) {

        return "✎";

    }


    return "•";

}


// ============================================================
// LOG CLASS
// ============================================================

function getLogClass(log) {

    const action =
        String(
            log.action ||
            ""
        )
            .toLowerCase();


    if (
        action ===
        "completed"
    ) {

        return "success";

    }


    if (
        action ===
        "deleted"
    ) {

        return "danger";

    }


    if (
        action ===
        "created"
    ) {

        return "create";

    }


    if (
        action ===
        "updated"
    ) {

        return "update";

    }


    if (
        action ===
        "login" ||
        action ===
        "verified"
    ) {

        return "success";

    }


    return "";

}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    const logs =
        logsState.logs;


    const completed =
        logs.filter(
            log =>
                log.action ===
                "completed"
        ).length;


    const notesCreated =
        logs.filter(
            log =>
                (
                    log.action ===
                    "created" &&
                    log.type ===
                    "note"
                )
        ).length;


    const tasksCreated =
        logs.filter(
            log =>
                (
                    log.action ===
                    "created" &&
                    log.type ===
                    "task"
                )
        ).length;


    const activity =
        logs.length;


    setText(
        "completedCount",
        completed
    );


    setText(
        "notesCreatedCount",
        notesCreated
    );


    setText(
        "tasksCreatedCount",
        tasksCreated
    );


    setText(
        "activityCount",
        activity
    );


    setText(
        "completedResultCount",
        `${completed} tasks`
    );

}


// ============================================================
// SEARCH
// ============================================================

function initializeSearch() {

    const search =
        $("logsSearch");


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        () => {

            logsState.search =
                search.value
                    .trim()
                    .toLowerCase();


            const clear =
                $("clearLogsSearch");


            if (clear) {

                clear.classList.toggle(
                    "hidden",
                    !logsState.search
                );

            }


            applyFilters();

        }
    );

}


// ============================================================
// CLEAR SEARCH
// ============================================================

function initializeClearSearch() {

    const button =
        $("clearLogsSearch");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            const search =
                $("logsSearch");


            if (search) {

                search.value = "";

            }


            logsState.search =
                "";


            button.classList.add(
                "hidden"
            );


            applyFilters();

        }
    );

}


// ============================================================
// TYPE FILTER
// ============================================================

function initializeTypeFilters() {

    const buttons =
        document.querySelectorAll(
            "[data-log-type]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    logsState.type =
                        button.dataset.logType ||
                        "all";


                    applyFilters();

                }
            );

        }
    );

}


// ============================================================
// PERIOD FILTER
// ============================================================

function initializePeriodFilter() {

    const select =
        $("logDateFilter");


    if (!select) {

        return;

    }


    select.addEventListener(
        "change",
        () => {

            logsState.period =
                select.value ||
                "all";


            applyFilters();

        }
    );

}


// ============================================================
// REFRESH
// ============================================================

function initializeRefresh() {

    const button =
        $("refreshLogs");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;


            try {

                await loadLogs();

            }

            finally {

                button.disabled =
                    false;

            }

        }
    );

}


// ============================================================
// ACTIVITY DETAILS
// ============================================================

function initializeActivityDetails() {

    const timeline =
        $("activityTimeline");


    if (!timeline) {

        return;

    }


    timeline.addEventListener(
        "click",
        event => {

            const item =
                event.target.closest(
                    "[data-log-id]"
                );


            if (!item) {

                return;

            }


            const id =
                item.dataset.logId;


            const log =
                logsState.logs.find(
                    item =>
                        item.id ===
                        id
                );


            if (!log) {

                return;

            }


            showActivityDetails(
                log
            );

        }
    );

}


// ============================================================
// DETAILS MODAL
// ============================================================

function showActivityDetails(log) {

    const modal =
        $("activityModal");


    const details =
        $("activityDetails");


    if (
        !modal ||
        !details
    ) {

        return;

    }


    details.innerHTML = `

        <div class="activity-detail-row">

            <strong>
                Action
            </strong>

            <span>
                ${escapeHTML(
                    formatAction(
                        log.action
                    )
                )}
            </span>

        </div>


        <div class="activity-detail-row">

            <strong>
                Type
            </strong>

            <span>
                ${escapeHTML(
                    capitalize(
                        log.type
                    )
                )}
            </span>

        </div>


        <div class="activity-detail-row">

            <strong>
                Title
            </strong>

            <span>
                ${escapeHTML(
                    log.title
                )}
            </span>

        </div>


        <div class="activity-detail-row">

            <strong>
                Description
            </strong>

            <span>
                ${escapeHTML(
                    log.description ||
                    "—"
                )}
            </span>

        </div>


        <div class="activity-detail-row">

            <strong>
                Date
            </strong>

            <span>
                ${escapeHTML(
                    formatDateTime(
                        log.created_at
                    )
                )}
            </span>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeActivityModal() {

    const modal =
        $("activityModal");


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


function initializeModal() {

    const close =
        $("closeActivityModal");


    const closeButton =
        $("closeActivityButton");


    if (close) {

        close.addEventListener(
            "click",
            closeActivityModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeActivityModal
        );

    }


    const modal =
        $("activityModal");


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeActivityModal();

                }

            }
        );

    }

}


// ============================================================
// USER INFO
// ============================================================

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        const user =
            data.user ||
            data.data?.user ||
            data.data;


        if (!user) {

            return;

        }


        const name =
            user.name ||
            user.full_name ||
            user.username ||
            "User";


        const email =
            user.email ||
            "";


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


        const initials =
            name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(
                    part =>
                        part
                            .charAt(0)
                            .toUpperCase()
                )
                .join("");


        setText(
            "sidebarAvatar",
            initials ||
            "U"
        );


        setText(
            "topbarAvatar",
            initials ||
            "U"
        );

    }

    catch (error) {

        console.warn(
            "Could not load current user:",
            error
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

function initializeLogout() {

    const logout =
        $("logoutButton");


    if (!logout) {

        return;

    }


    logout.addEventListener(
        "click",
        () => {

            const modal =
                $("logoutModal");


            if (modal) {

                modal.classList.remove(
                    "hidden"
                );

            }

        }
    );


    const cancel =
        $("cancelLogout");


    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                const modal =
                    $("logoutModal");


                if (modal) {

                    modal.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }


    const confirm =
        $("confirmLogout");


    if (confirm) {

        confirm.addEventListener(
            "click",
            async () => {

                try {

                    const response =
                        await fetch(
                            "/api/auth/logout",
                            {
                                method:
                                    "POST",

                                credentials:
                                    "same-origin",

                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    if (
                        response.ok
                    ) {

                        window.location.href =
                            "/login";

                    }

                    else {

                        window.location.href =
                            "/login";

                    }

                }

                catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    window.location.href =
                        "/login";

                }

            }
        );

    }

}


// ============================================================
// SIDEBAR
// ============================================================

function initializeSidebar() {

    const sidebar =
        $("appSidebar");


    const overlay =
        $("sidebarOverlay");


    const open =
        $("openSidebar");


    const close =
        $("closeSidebar");


    if (
        open &&
        sidebar
    ) {

        open.addEventListener(
            "click",
            () => {

                sidebar.classList.add(
                    "open"
                );


                if (overlay) {

                    overlay.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    if (
        close &&
        sidebar
    ) {

        close.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "open"
                );


                if (overlay) {

                    overlay.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (
        overlay &&
        sidebar
    ) {

        overlay.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "open"
                );


                overlay.classList.remove(
                    "active"
                );

            }
        );

    }

}


// ============================================================
// SEARCH BUTTON
// ============================================================

function initializeSearchButton() {

    const button =
        $("logsSearchButton");


    const input =
        $("logsSearch");


    if (
        button &&
        input
    ) {

        button.addEventListener(
            "click",
            () => {

                input.focus();

            }
        );

    }

}

// ============================================================
// LOAD COMPLETED TASKS
// ============================================================

async function loadCompletedTasks() {

    const container =
        document.getElementById("completedTasksList");

    const empty =
        document.getElementById("completedEmpty");

    if (!container) {
        console.error(
            "#completedTasksList not found."
        );
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Loading completed tasks...</span>
        </div>
    `;

    try {

        const response = await fetch(
            "/api/tasks",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        console.log(
            "Completed tasks HTTP status:",
            response.status
        );

        const data =
            await response.json();

        console.log(
            "Tasks API response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load tasks."
            );

        }

        const rawTasks =
            Array.isArray(data.tasks)
                ? data.tasks
                : [];

        const completedTasks =
            rawTasks.filter(
                task =>
                    task.completed === true ||
                    task.status === "completed"
            );

        console.log(
            "Completed tasks:",
            completedTasks.length
        );

        setText(
            "completedCount",
            completedTasks.length
        );

        setText(
            "completedResultCount",
            `${completedTasks.length} tasks`
        );

        if (!completedTasks.length) {

            container.innerHTML = "";

            if (empty) {
                empty.classList.remove("hidden");
            }

            return;
        }

        if (empty) {
            empty.classList.add("hidden");
        }

        container.innerHTML =
            completedTasks
                .map(
                    renderCompletedTask
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Completed tasks error:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    !
                </div>

                <h4>
                    Unable to load completed tasks
                </h4>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Please try again."
                    )}
                </p>

            </div>
        `;

    }

}


// ============================================================
// RENDER COMPLETED TASKS FROM LOGS
// ============================================================

function loadCompletedTasks() {

    const container =
        document.getElementById(
            "completedTasksList"
        );

    const empty =
        document.getElementById(
            "completedEmpty"
        );

    if (!container) {

        console.error(
            "#completedTasksList not found."
        );

        return;

    }


    const completedLogs =
        logsState.logs.filter(
            log =>
                String(
                    log.action || ""
                ).toLowerCase() ===
                "completed"
        );


    console.log(
        "Completed task logs:",
        completedLogs
    );


    setText(
        "completedCount",
        completedLogs.length
    );


    setText(
        "completedResultCount",
        `${completedLogs.length} tasks`
    );


    if (!completedLogs.length) {

        container.innerHTML = "";

        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    container.innerHTML =
        completedLogs
            .map(
                log => `

                    <div
                        class="completed-task-item"
                    >

                        <div
                            class="completed-task-check"
                        >
                            ✓
                        </div>


                        <div
                            class="completed-task-content"
                        >

                            <h4>
                                ${escapeHTML(
                                    log.title ||
                                    "Completed task"
                                )}
                            </h4>


                            ${
                                log.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                log.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }


                            <div
                                class="completed-task-meta"
                            >

                                <span>
                                    Completed
                                </span>


                                ${
                                    log.category
                                        ? `
                                            <span>
                                                ${escapeHTML(
                                                    log.category
                                                )}
                                            </span>
                                        `
                                        : ""
                                }


                                <span>
                                    ${escapeHTML(
                                        formatDateTime(
                                            log.created_at
                                        )
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}

// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Initializing logs page..."
        );


        initializeSearch();

        initializeClearSearch();

        initializeTypeFilters();

        initializePeriodFilter();

        initializeRefresh();

        initializeActivityDetails();

        initializeModal();

        initializeLogout();

        initializeSidebar();

        initializeSearchButton();


        await loadCurrentUser();

        await loadLogs();

        await loadCompletedTasks();

    }
);


// ============================================================
// GLOBAL
// ============================================================

window.loadLogs =
    loadLogs;


window.closeActivityModal =
    closeActivityModal;
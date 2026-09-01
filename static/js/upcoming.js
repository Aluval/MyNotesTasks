/* =========================================================
   MyNotes & Tasks
   Upcoming Tasks JavaScript

   Handles:
   - Upcoming tasks
   - Today
   - Tomorrow
   - This week
   - Later
   - Search
   - Priority filter
   - Category filter
   - Date navigation
   - Complete / uncomplete
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const upcomingState = {

    tasks: [],

    filteredTasks: [],

    search: "",

    priority: "all",

    category: "all",

    selectedDate: null

};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Upcoming JS loaded"
        );


        /* =================================================
           MOBILE SIDEBAR
        ================================================= */

        initializeSidebar();


        /* =================================================
           DEFAULT DATE
        ================================================= */

        upcomingState.selectedDate =
            startOfDay();


        /* =================================================
           UPCOMING PAGE
        ================================================= */

        initializeUpcomingPage();


        /* =================================================
           CURRENT USER
        ================================================= */

        await loadCurrentUser();


        /* =================================================
           LOAD UPCOMING TASKS
        ================================================= */

        await loadUpcomingTasks();

    }
);

/* =========================================================
   MOBILE SIDEBAR / NAVIGATION
========================================================= */

function initializeSidebar() {

    console.log(
        "Initializing sidebar..."
    );


    const sidebar =
        document.getElementById(
            "appSidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    const openButton =
        document.getElementById(
            "openSidebar"
        );


    const closeButton =
        document.getElementById(
            "closeSidebar"
        );


    /* =====================================================
       OPEN SIDEBAR
    ====================================================== */

    openButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            sidebar?.classList.add(
                "open"
            );

            overlay?.classList.add(
                "active"
            );

            document.body.classList.add(
                "sidebar-open"
            );

        }
    );


    /* =====================================================
       CLOSE SIDEBAR
    ====================================================== */

    function closeSidebar() {

        sidebar?.classList.remove(
            "open"
        );

        overlay?.classList.remove(
            "active"
        );

        document.body.classList.remove(
            "sidebar-open"
        );

    }


    closeButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeSidebar();

        }
    );


    /* =====================================================
       CLICK OUTSIDE SIDEBAR
    ====================================================== */

    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    /* =====================================================
       SIDEBAR NAVIGATION
       
       IMPORTANT:
       Do NOT use preventDefault() here.
       The href must work normally.
    ====================================================== */

    sidebar
        ?.querySelectorAll(
            ".nav-item"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        closeSidebar();

                    }
                );

            }
        );


    /* =====================================================
       ESCAPE KEY
    ====================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

            }

        }
    );


    console.log(
        "Sidebar initialized successfully"
    );

}

/* =========================================================
   PAGE INITIALIZATION
========================================================= */

function initializeUpcomingPage() {


    /* =====================================================
       SEARCH
    ====================================================== */

    document
        .getElementById(
            "upcomingSearch"
        )
        ?.addEventListener(
            "input",
            debounce(
                event => {

                    upcomingState.search =
                        event.target.value
                            .trim()
                            .toLowerCase();


                    applyUpcomingFilters();

                },
                250
            )
        );


    /* =====================================================
       PRIORITY
    ====================================================== */

    document
        .getElementById(
            "upcomingPriorityFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                upcomingState.priority =
                    event.target.value ||
                    "all";


                applyUpcomingFilters();

            }
        );


    /* =====================================================
       CATEGORY
    ====================================================== */

    document
        .getElementById(
            "upcomingCategoryFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                upcomingState.category =
                    event.target.value ||
                    "all";


                applyUpcomingFilters();

            }
        );


    /* =====================================================
       PREVIOUS DAY
    ====================================================== */

    document
        .getElementById(
            "previousUpcomingDay"
        )
        ?.addEventListener(
            "click",
            () => {

                changeUpcomingDay(
                    -1
                );

            }
        );


    /* =====================================================
       NEXT DAY
    ====================================================== */

    document
        .getElementById(
            "nextUpcomingDay"
        )
        ?.addEventListener(
            "click",
            () => {

                changeUpcomingDay(
                    1
                );

            }
        );


    /* =====================================================
       TODAY
    ====================================================== */

    document
        .getElementById(
            "upcomingTodayButton"
        )
        ?.addEventListener(
            "click",
            () => {

                upcomingState.selectedDate =
                    startOfDay();


                renderUpcomingPage();

            }
        );


    /* =====================================================
       DATE PICKER
    ====================================================== */

    document
        .getElementById(
            "upcomingDatePicker"
        )
        ?.addEventListener(
            "change",
            event => {

                if (
                    !event.target.value
                ) {

                    return;

                }


                upcomingState.selectedDate =
                    startOfDay(
                        new Date(
                            `${event.target.value}T00:00:00`
                        )
                    );


                renderUpcomingPage();

            }
        );


    /* =====================================================
       CLEAR SEARCH
    ====================================================== */

    document
        .getElementById(
            "clearUpcomingSearch"
        )
        ?.addEventListener(
            "click",
            clearUpcomingSearch
        );

}


/* =========================================================
   NORMALIZE TASK
========================================================= */

function normalizeTask(task) {

    if (
        !task ||
        typeof task !== "object"
    ) {

        return null;

    }


    const rawId =
        task.id ??
        task._id ??
        task.task_id ??
        "";


    return {

        ...task,


        id:
            String(
                rawId
            ),


        title:
            String(
                task.title ??
                ""
            ),


        description:
            String(
                task.description ??
                task.content ??
                ""
            ),


        category:
            String(
                task.category ??
                "general"
            )
                .toLowerCase(),


        priority:
            String(
                task.priority ??
                "medium"
            )
                .toLowerCase(),


        completed:
            Boolean(
                task.completed ??
                (
                    String(
                        task.status ??
                        ""
                    ).toLowerCase() ===
                    "completed"
                )
            ),


        status:
            String(
                task.status ??
                (
                    task.completed
                        ? "completed"
                        : "pending"
                )
            )
                .toLowerCase(),


        due_date:
            task.due_date ??
            task.dueDate ??
            task.date ??
            null,


        due_time:
            task.due_time ??
            task.dueTime ??
            task.time ??
            null,


        completed_at:
            task.completed_at ??
            task.completedAt ??
            null,


        checklist:
            Array.isArray(
                task.checklist
            )
                ? task.checklist
                : []

    };

}

/* =========================================================
   LOAD UPCOMING TASKS
========================================================= */

async function loadUpcomingTasks() {

    console.log(
        "Loading upcoming tasks..."
    );


    const loading =
        document.getElementById(
            "upcomingLoading"
        );


    const empty =
        document.getElementById(
            "upcomingEmpty"
        );


    /*
     * Show loading
     */

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    let result;


    try {

        if (
            typeof API !== "undefined" &&
            typeof API.get === "function"
        ) {

            result =
                await API.get(
                    "/api/tasks"
                );

        }

        else {

            const response =
                await fetch(
                    "/api/tasks",
                    {
                        method: "GET",
                        credentials: "same-origin",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const data =
                await response.json();


            result = {

                ok:
                    response.ok &&
                    data.ok !== false,

                status:
                    response.status,

                ...data

            };

        }

    }

    catch (error) {

        console.error(
            "Upcoming tasks API error:",
            error
        );


        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        return;

    }


    console.log(
        "Upcoming tasks API response:",
        result
    );


    if (
        !result ||
        result.ok !== true
    ) {

        console.error(
            "Load upcoming tasks failed:",
            result
        );


        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        return;

    }


    /*
     * Flask response:
     *
     * {
     *     "ok": true,
     *     "tasks": [...]
     * }
     */

    let tasks =
        result.tasks ??
        result.items ??
        result.data?.tasks ??
        result.data?.items ??
        result.data ??
        [];


    if (
        !Array.isArray(tasks)
    ) {

        console.error(
            "Invalid tasks response:",
            tasks
        );

        tasks = [];

    }


    /*
     * Normalize tasks
     */

    upcomingState.tasks =
        tasks
            .map(
                normalizeTask
            )
            .filter(
                Boolean
            );


    console.log(
        "Upcoming tasks loaded:",
        upcomingState.tasks
    );


    /*
     * Hide loading
     */

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }


    /*
     * Apply filters
     */

    applyUpcomingFilters();


    console.log(
        "Upcoming tasks rendering completed."
    );

}



/* =========================================================
   FILTER UPCOMING TASKS
========================================================= */

function applyUpcomingFilters() {

    let tasks =
        Array.isArray(
            upcomingState.tasks
        )
            ? [...upcomingState.tasks]
            : [];


    /*
     * Only pending tasks with a due date.
     */

    tasks =
        tasks.filter(
            task => {

                if (!task) {
                    return false;
                }


                const completed =
                    task.completed === true ||
                    String(
                        task.completed
                    ).toLowerCase() === "true" ||
                    String(
                        task.status || ""
                    ).toLowerCase() ===
                    "completed";


                const dueDate =
                    task.due_date ||
                    task.dueDate ||
                    task.date;


                return (
                    !completed &&
                    Boolean(dueDate)
                );

            }
        );


    /*
     * SEARCH
     */

    if (
        upcomingState.search
    ) {

        tasks =
            tasks.filter(
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
                        upcomingState.search
                    );

                }
            );

    }


    /*
     * PRIORITY
     */

    if (
        upcomingState.priority !==
        "all"
    ) {

        tasks =
            tasks.filter(
                task =>

                    String(
                        task.priority ||
                        "medium"
                    )
                        .toLowerCase() ===

                    String(
                        upcomingState.priority
                    )
                        .toLowerCase()

            );

    }


    /*
     * CATEGORY
     */

    if (
        upcomingState.category !==
        "all"
    ) {

        tasks =
            tasks.filter(
                task =>

                    String(
                        task.category ||
                        "general"
                    )
                        .toLowerCase() ===

                    String(
                        upcomingState.category
                    )
                        .toLowerCase()

            );

    }


    /*
     * SORT BY DUE DATE
     */

    tasks.sort(
        compareUpcomingTask
    );


    upcomingState.filteredTasks =
        tasks;


    console.log(
        "Upcoming filtered tasks:",
        upcomingState.filteredTasks
    );


    /*
     * Render
     */

    renderUpcomingPage();

}

/* =========================================================
   SORT
========================================================= */

function compareUpcomingTask(
    a,
    b
) {

    const dateA =
        new Date(
            `${a.due_date}T${
                a.due_time ||
                "23:59"
            }`
        );


    const dateB =
        new Date(
            `${b.due_date}T${
                b.due_time ||
                "23:59"
            }`
        );


    return (
        dateA - dateB
    );

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderUpcomingPage() {

    updateUpcomingDateUI();

    renderUpcomingGroups();

    updateUpcomingCounters();

}


/* =========================================================
   DATE UI
========================================================= */

function updateUpcomingDateUI() {

    const date =
        upcomingState.selectedDate ||
        startOfDay();


    setText(
        "upcomingSelectedDate",
        formatLongDate(
            date
        )
    );


    const picker =
        document.getElementById(
            "upcomingDatePicker"
        );


    if (picker) {

        picker.value =
            formatDateForInput(
                date
            );

    }


    const today =
        startOfDay();


    const todayButton =
        document.getElementById(
            "upcomingTodayButton"
        );


    if (todayButton) {

        todayButton.classList.toggle(

            "active",

            date.getTime() ===
            today.getTime()

        );

    }

}


/* =========================================================
   CHANGE DAY
========================================================= */

function changeUpcomingDay(
    amount
) {

    const date =
        new Date(
            upcomingState.selectedDate ||
            startOfDay()
        );


    date.setDate(
        date.getDate() +
        amount
    );


    upcomingState.selectedDate =
        startOfDay(
            date
        );


    renderUpcomingPage();

}



/* =========================================================
   RENDER UPCOMING GROUPS
========================================================= */

function renderUpcomingGroups() {

    const todayGroup =
        document.getElementById("todayGroup");

    const tomorrowGroup =
        document.getElementById("tomorrowGroup");

    const weekGroup =
        document.getElementById("weekGroup");

    const laterGroup =
        document.getElementById("laterGroup");

    const todayTasks =
        document.getElementById("todayTasks");

    const tomorrowTasks =
        document.getElementById("tomorrowTasks");

    const weekTasks =
        document.getElementById("weekTasks");

    const laterTasks =
        document.getElementById("laterTasks");

    const empty =
        document.getElementById("upcomingEmpty");

    const loading =
        document.getElementById("upcomingLoading");


    /*
     * Hide loading
     */

    if (loading) {
        loading.classList.add("hidden");
    }


    /*
     * Clear old tasks
     */

    if (todayTasks) {
        todayTasks.innerHTML = "";
    }

    if (tomorrowTasks) {
        tomorrowTasks.innerHTML = "";
    }

    if (weekTasks) {
        weekTasks.innerHTML = "";
    }

    if (laterTasks) {
        laterTasks.innerHTML = "";
    }


    /*
     * Hide all groups first
     */

    [
        todayGroup,
        tomorrowGroup,
        weekGroup,
        laterGroup
    ].forEach(
        group => {

            if (group) {
                group.classList.add("hidden");
            }

        }
    );


    const tasks =
        upcomingState.filteredTasks || [];


    /*
     * No tasks
     */

    if (!tasks.length) {

        if (empty) {
            empty.classList.remove("hidden");
        }

        return;
    }


    /*
     * Tasks exist
     */

    if (empty) {
        empty.classList.add("hidden");
    }


    const groups =
        groupUpcomingTasks(tasks);


    /*
     * TODAY
     */

    if (
        groups.Today &&
        groups.Today.length
    ) {

        if (todayGroup) {
            todayGroup.classList.remove("hidden");
        }

        if (todayTasks) {

            todayTasks.innerHTML =
                groups.Today
                    .map(renderUpcomingTask)
                    .join("");

        }

    }


    /*
     * TOMORROW
     */

    if (
        groups.Tomorrow &&
        groups.Tomorrow.length
    ) {

        if (tomorrowGroup) {
            tomorrowGroup.classList.remove("hidden");
        }

        if (tomorrowTasks) {

            tomorrowTasks.innerHTML =
                groups.Tomorrow
                    .map(renderUpcomingTask)
                    .join("");

        }

    }


    /*
     * THIS WEEK
     */

    if (
        groups["This Week"] &&
        groups["This Week"].length
    ) {

        if (weekGroup) {
            weekGroup.classList.remove("hidden");
        }

        if (weekTasks) {

            weekTasks.innerHTML =
                groups["This Week"]
                    .map(renderUpcomingTask)
                    .join("");

        }

    }


    /*
     * LATER
     */

    if (
        groups.Later &&
        groups.Later.length
    ) {

        if (laterGroup) {
            laterGroup.classList.remove("hidden");
        }

        if (laterTasks) {

            laterTasks.innerHTML =
                groups.Later
                    .map(renderUpcomingTask)
                    .join("");

        }

    }


    /*
     * Update date labels
     */

    const today =
        startOfDay();

    const tomorrow =
        new Date(today);

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    setText(
        "todayDateLabel",
        formatDate(today)
    );

    setText(
        "tomorrowDateLabel",
        formatDate(tomorrow)
    );

}

/* =========================================================
   UPDATE UPCOMING COUNTERS
========================================================= */

function updateUpcomingCounters() {

    const tasks =
        Array.isArray(upcomingState.tasks)
            ? upcomingState.tasks
            : [];


    /*
     * Pending tasks
     */

    const pending =
        tasks.filter(
            task =>
                !task.completed &&
                task.due_date
        );


    /*
     * Completed tasks
     */

    const completed =
        tasks.filter(
            task =>
                Boolean(task.completed)
        );


    /*
     * Today
     */

    const today =
        pending.filter(
            task =>
                isTaskDueToday(task)
        );


    /*
     * Tomorrow
     */

    const tomorrowDate =
        startOfDay();

    tomorrowDate.setDate(
        tomorrowDate.getDate() + 1
    );


    const tomorrow =
        pending.filter(
            task => {

                if (!task.due_date) {
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
                    tomorrowDate.getTime()
                );

            }
        );


    /*
     * This week
     */

    const todayDate =
        startOfDay();

    const day =
        todayDate.getDay();

    const weekEnd =
        new Date(todayDate);

    weekEnd.setDate(
        weekEnd.getDate() +
        (7 - day)
    );

    const thisWeek =
        pending.filter(
            task => {

                if (!task.due_date) {
                    return false;
                }

                const taskDate =
                    startOfDay(
                        new Date(
                            task.due_date
                        )
                    );

                return (
                    taskDate >= todayDate &&
                    taskDate <= weekEnd
                );

            }
        );


    /*
     * Due soon
     *
     * Today + tomorrow
     */

    const dueSoon =
        pending.filter(
            task =>
                isTaskDueToday(task) ||
                (
                    task.due_date &&
                    startOfDay(
                        new Date(
                            task.due_date
                        )
                    ).getTime() ===
                    tomorrowDate.getTime()
                )
        );


    /*
     * Update HTML
     */

    setText(
        "upcomingTotal",
        pending.length
    );

    setText(
        "dueSoonTotal",
        dueSoon.length
    );

    setText(
        "thisWeekTotal",
        thisWeek.length
    );

    setText(
        "upcomingCompleted",
        completed.length
    );


    /*
     * Sidebar count
     */

    setText(
        "upcomingCount",
        pending.length
    );


    /*
     * Compatibility with other HTML/JS
     */

    setText(
        "upcomingTotalCount",
        pending.length
    );

    setText(
        "upcomingTodayCount",
        today.length
    );

    setText(
        "upcomingTomorrowCount",
        tomorrow.length
    );

    setText(
        "upcomingOverdueCount",
        pending.filter(
            task =>
                isTaskOverdue(task)
        ).length
    );


    console.log(
        "Upcoming counters:",
        {
            pending: pending.length,
            today: today.length,
            tomorrow: tomorrow.length,
            thisWeek: thisWeek.length,
            dueSoon: dueSoon.length,
            completed: completed.length
        }
    );

}

/* =========================================================
   GROUP TASKS
========================================================= */

function groupUpcomingTasks(
    tasks
) {

    const groups = {

        "Today": [],

        "Tomorrow": [],

        "This Week": [],

        "Later": []

    };


    const today =
        startOfDay();


    const tomorrow =
        new Date(
            today
        );


    tomorrow.setDate(
        tomorrow.getDate() +
        1
    );


    const weekEnd =
        new Date(
            today
        );


    /*
     * Sunday = end of week.
     */

    const day =
        today.getDay();


    const daysUntilSunday =
        7 - day;


    weekEnd.setDate(
        weekEnd.getDate() +
        daysUntilSunday
    );


    tasks.forEach(
        task => {

            if (
                !task.due_date
            ) {

                return;

            }


            const date =
                startOfDay(
                    new Date(
                        `${task.due_date}T00:00:00`
                    )
                );


            if (
                date.getTime() ===
                today.getTime()
            ) {

                groups["Today"]
                    .push(
                        task
                    );

                return;

            }


            if (
                date.getTime() ===
                tomorrow.getTime()
            ) {

                groups["Tomorrow"]
                    .push(
                        task
                    );

                return;

            }


            if (
                date <=
                weekEnd
            ) {

                groups["This Week"]
                    .push(
                        task
                    );

                return;

            }


            groups["Later"]
                .push(
                    task
                );

        }
    );


    return groups;

}

/* =========================================================
   CHECK TASK OVERDUE
========================================================= */

function isTaskOverdue(task) {

    if (
        !task ||
        !task.due_date ||
        task.completed
    ) {

        return false;
    }


    const dueDate =
        String(
            task.due_date
        ).trim();


    if (!dueDate) {
        return false;
    }


    /*
     * If a due time exists, use it.
     * Otherwise consider the task overdue
     * after the end of the due date.
     */

    const dueTime =
        task.due_time
            ? String(
                task.due_time
            ).trim()
            : "23:59";


    const dueDateTime =
        new Date(
            `${dueDate}T${dueTime}`
        );


    if (
        Number.isNaN(
            dueDateTime.getTime()
        )
    ) {

        return false;
    }


    return (
        dueDateTime.getTime() <
        Date.now()
    );

}
/* =========================================================
   TASK DUE TEXT
========================================================= */

function getTaskDueText(task) {

    if (
        !task ||
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


    const dateText =
        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    if (
        task.due_time
    ) {

        return `${dateText} at ${task.due_time}`;

    }


    return dateText;

}

/* =========================================================
   RENDER UPCOMING TASK
========================================================= */

function renderUpcomingTask(
    task
) {

    const priority =
        String(
            task.priority ||
            "medium"
        )
            .toLowerCase();


    const overdue =
        isTaskOverdue(
            task
        );


    return `

        <article
            class="upcoming-task-card ${
                overdue
                    ? "overdue"
                    : ""
            }"
            data-task-id="${escapeHTML(
                task.id
            )}"
        >

            <button
                type="button"
                class="task-list-check"
                onclick="completeUpcomingTask('${escapeHTML(
                    task.id
                )}')"
                title="Complete task"
            >
                ○
            </button>


            <div
                class="upcoming-task-main"
            >

                <h3>

                    ${escapeHTML(
                        task.title
                    )}

                </h3>


                ${
                    task.description

                        ? `

                            <p>
                                ${escapeHTML(
                                    task.description
                                )}
                            </p>

                        `

                        : ""

                }


                <div
                    class="upcoming-task-meta"
                >

                    <span
                        class="upcoming-due ${
                            overdue
                                ? "overdue-text"
                                : ""
                        }"
                    >

                        📅

                        ${escapeHTML(
                            getTaskDueText(
                                task
                            )
                        )}

                    </span>


                    ${
                        task.category

                            ? `

                                <span>
                                    #${escapeHTML(
                                        task.category
                                    )}
                                </span>

                            `

                            : ""

                    }


                    ${
                        task.checklist?.length

                            ? `

                                <span>
                                    ☑

                                    ${
                                        task.checklist.filter(
                                            item =>
                                                item.completed
                                        ).length
                                    }/${
                                        task.checklist.length
                                    }

                                </span>

                            `

                            : ""

                    }

                </div>

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


            <div
                class="upcoming-task-actions"
            >

                <button
                    type="button"
                    class="icon-button"
                    onclick="viewUpcomingTask('${escapeHTML(
                        task.id
                    )}')"
                    title="View task"
                >
                    👁
                </button>


                <button
                    type="button"
                    class="icon-button"
                    onclick="editUpcomingTask('${escapeHTML(
                        task.id
                    )}')"
                    title="Edit task"
                >
                    ✎
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   COMPLETE TASK
========================================================= */

async function completeUpcomingTask(
    taskId
) {

    const task =
        upcomingState.tasks.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    taskId
                )
        );


    if (!task) {

        showToast(
            "Task not found.",
            "error"
        );

        return;

    }


    const result =
        await API.patch(

            `/api/tasks/${encodeURIComponent(
                taskId
            )}`,

            {

                completed: true,

                status: "completed"

            }

        );


    if (!result.ok) {

        showToast(
            getResponseMessage(
                result,
                "Unable to complete task."
            ),
            "error"
        );

        return;

    }


    task.completed =
        true;


    task.status =
        "completed";


    task.completed_at =
        new Date().toISOString();


    applyUpcomingFilters();


    showToast(
        "Task completed.",
        "success"
    );

}


/* =========================================================
   VIEW TASK
========================================================= */

function viewUpcomingTask(
    taskId
) {

    console.log(
        "Viewing upcoming task:",
        taskId
    );


    if (
        typeof viewTask ===
        "function"
    ) {

        viewTask(
            taskId
        );

        return;

    }


    /*
     * Fallback if tasks.js
     * is not loaded.
     */

    window.location.href =
        `/tasks?view=${encodeURIComponent(
            taskId
        )}`;

}


/* =========================================================
   EDIT TASK
========================================================= */

function editUpcomingTask(
    taskId
) {

    console.log(
        "Editing upcoming task:",
        taskId
    );


    if (
        typeof openTaskEditor ===
        "function"
    ) {

        openTaskEditor(
            taskId
        );

        return;

    }


    /*
     * Fallback if tasks.js
     * is not loaded.
     */

    window.location.href =
        `/tasks?edit=${encodeURIComponent(
            taskId
        )}`;

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

function clearUpcomingSearch() {

    const input =
        document.getElementById(
            "upcomingSearch"
        );


    if (input) {

        input.value =
            "";

    }


    upcomingState.search =
        "";


    applyUpcomingFilters();

}



/* =========================================================
   LOCAL DATE HELPERS
========================================================= */

function startOfDay(
    value = new Date()
) {

    const date =
        new Date(
            value
        );


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


function formatDateForInput(
    date
) {

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   FORMAT LONG DATE
========================================================= */

function formatLongDate(
    date
) {

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {

            weekday: "long",

            day: "numeric",

            month: "long",

            year: "numeric"

        }
    );

}

/* =========================================================
   CHECK TASK DUE TODAY
========================================================= */

function isTaskDueToday(task) {

    if (
        !task ||
        !task.due_date
    ) {

        return false;
    }


    const taskDate =
        startOfDay(
            new Date(
                `${task.due_date}T00:00:00`
            )
        );


    const today =
        startOfDay();


    return (
        taskDate.getTime() ===
        today.getTime()
    );

}

/* =========================================================
   CHECK TASK OVERDUE
========================================================= */

function isTaskOverdue(task) {

    if (
        !task ||
        !task.due_date ||
        task.completed
    ) {

        return false;
    }


    const dueDate =
        String(
            task.due_date
        ).trim();


    if (!dueDate) {
        return false;
    }


    const dueTime =
        task.due_time
            ? String(
                task.due_time
            ).trim()
            : "23:59";


    const dueDateTime =
        new Date(
            `${dueDate}T${dueTime}`
        );


    if (
        Number.isNaN(
            dueDateTime.getTime()
        )
    ) {

        return false;
    }


    return (
        dueDateTime.getTime() <
        Date.now()
    );

}

/* =========================================================
   TASK DUE TEXT
========================================================= */

function getTaskDueText(task) {

    if (
        !task ||
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


    const dateText =
        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    if (
        task.due_time
    ) {

        return `${dateText} at ${task.due_time}`;
    }


    return dateText;

}

/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    console.log(
        "Loading current user..."
    );


    let result;


    try {

        if (
            typeof API !== "undefined" &&
            typeof API.get === "function"
        ) {

            result =
                await API.get(
                    "/api/auth/me"
                );

        }

        else {

            const response =
                await fetch(
                    "/api/auth/me",
                    {
                        method: "GET",
                        credentials: "same-origin",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            }

            catch (error) {

                console.error(
                    "Invalid user response:",
                    error
                );

            }


            result = {

                ok:
                    response.ok &&
                    data.ok !== false,

                status:
                    response.status,

                ...data

            };

        }

    }

    catch (error) {

        console.error(
            "Current user API error:",
            error
        );

        return;

    }


    console.log(
        "Current user response:",
        result
    );


    if (
        !result ||
        !result.ok
    ) {

        console.warn(
            "Unable to load current user.",
            result
        );

        return;

    }


    const user =
        result.user ||
        result.data?.user ||
        {};


    const name =
        user.name ||
        user.full_name ||
        user.fullName ||
        user.username ||
        user.display_name ||
        "User";


    const email =
        user.email ||
        "";


    const initials =
        getUserInitials(
            name
        );


    /* -----------------------------------------------------
       SIDEBAR
    ----------------------------------------------------- */

    setText(
        "sidebarUserName",
        name
    );


    setText(
        "sidebarUserEmail",
        email
    );


    /* -----------------------------------------------------
       TOPBAR
    ----------------------------------------------------- */

    setText(
        "topbarUserName",
        name
    );


    /* -----------------------------------------------------
       AVATARS
    ----------------------------------------------------- */

    const sidebarAvatar =
        document.getElementById(
            "sidebarAvatar"
        );


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    const topbarAvatar =
        document.getElementById(
            "topbarAvatar"
        );


    if (topbarAvatar) {

        topbarAvatar.textContent =
            initials;

    }


    console.log(
        "Current user loaded:",
        {
            name,
            email
        }
    );

}


/* =========================================================
   USER INITIALS
========================================================= */

function getUserInitials(
    name
) {

    const value =
        String(
            name ||
            "User"
        )
            .trim();


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
        parts[parts.length - 1][0]
    )
        .toUpperCase();

}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   RESPONSE MESSAGE
========================================================= */

function getResponseMessage(
    result,
    fallback = "Something went wrong."
) {

    if (!result) {

        return fallback;

    }


    return (
        result.message ||
        result.error ||
        result.data?.message ||
        fallback
    );

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


/* =========================================================
   COUNTER HELPER
========================================================= */

function updateCounter(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(
    value
) {

    const text =
        String(
            value || ""
        );


    if (!text) {

        return "";

    }


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* =========================================================
   DEBOUNCE
========================================================= */

function debounce(
    callback,
    delay = 250
) {

    let timer = null;


    return function (...args) {

        clearTimeout(
            timer
        );


        timer =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.loadUpcomingTasks =
    loadUpcomingTasks;


window.completeUpcomingTask =
    completeUpcomingTask;


window.viewUpcomingTask =
    viewUpcomingTask;


window.editUpcomingTask =
    editUpcomingTask;


window.clearUpcomingSearch =
    clearUpcomingSearch;
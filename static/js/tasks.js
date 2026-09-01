/* ============================================================
   MyNotes & Tasks
   CLEAN TASKS JAVASCRIPT
   ============================================================

   Supports:

   - Load tasks
   - Create task
   - Edit task
   - Delete task
   - Complete / uncomplete
   - Checklist
   - Search
   - Status filter
   - Priority filter
   - Sorting
   - Counters
   - Sidebar user
   - Logout

   Matched to the current tasks.html
   ============================================================ */

"use strict";


/* ============================================================
   STATE
   ============================================================ */

const tasksState = {

    tasks: [],

    filteredTasks: [],

    search: "",

    status: "all",

    priority: "all",

    sort: "due_asc",

    editingId: null,

    deleteId: null,

    checklist: []

};


/* ============================================================
   DOM HELPERS
   ============================================================ */

function getElement(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element = getElement(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


function setInputValue(id, value) {

    const element = getElement(id);

    if (element) {

        element.value =
            value ?? "";

    }

}


function getInputValue(id) {

    const element = getElement(id);

    return element
        ? element.value
        : "";

}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ============================================================
   DEBOUNCE
   ============================================================ */

function debounce(
    callback,
    delay = 250
) {

    let timer;

    return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(
            () => callback.apply(this, args),
            delay
        );

    };

}


/* ============================================================
   TEMPORARY ID
   ============================================================ */

function createTemporaryId() {

    return (
        "temp-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* ============================================================
   RESPONSE MESSAGE
   ============================================================ */

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


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    type = "info"
) {

    const container =
        getElement("toastContainer");


    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    const toast =
        document.createElement("div");


    toast.className =
        `toast toast-${type}`;


    toast.innerHTML = `

        <span class="toast-message">
            ${escapeHTML(message)}
        </span>

        <button
            type="button"
            class="toast-close"
            aria-label="Close"
        >
            ×
        </button>

    `;


    container.appendChild(toast);


    toast
        .querySelector(".toast-close")
        ?.addEventListener(
            "click",
            () => toast.remove()
        );


    setTimeout(
        () => {

            if (toast.isConnected) {

                toast.remove();

            }

        },
        3500
    );

}


/* ============================================================
   BUTTON LOADING
   ============================================================ */

function setButtonLoading(
    button,
    loading,
    text = "Loading..."
) {

    if (!button) {

        return;

    }


    button.disabled =
        loading;


    const textElement =
        button.querySelector(
            "span:first-child"
        );


    if (loading) {

        button.dataset.originalText =
            textElement?.textContent ||
            button.textContent;


        if (textElement) {

            textElement.textContent =
                text;

        }

        button.classList.add(
            "loading"
        );

    }

    else {

        if (textElement) {

            textElement.textContent =
                button.dataset.originalText ||
                "Save";

        }

        button.classList.remove(
            "loading"
        );

    }

}


/* ============================================================
   MODALS
   ============================================================ */

function openModal(modal) {

    if (!modal) {

        console.error(
            "Modal not found."
        );

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(modal) {

    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "modal-open"
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

        id: String(id),

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
            null,

        due_time:
            task.due_time ??
            task.dueTime ??
            null,

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
                task.completed ??
                task.is_completed ??
                false
            ),

        status:
            task.status ||
            (
                task.completed
                    ? "completed"
                    : "pending"
            ),

        checklist:
            Array.isArray(
                task.checklist
            )
                ? task.checklist
                : [],

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
   API REQUEST
   ============================================================ */

async function apiRequest(
    url,
    options = {}
) {

    try {

        const response =
            await fetch(
                url,
                {

                    credentials: "same-origin",

                    ...options,

                    headers: {

                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})

                    }

                }
            );


        let data = {};

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }

        else {

            const text =
                await response.text();

            data = {

                message:
                    text ||
                    response.statusText

            };

        }


        return {

            ok:
                response.ok &&
                data.ok !== false,

            status:
                response.status,

            ...data

        };

    }

    catch (error) {

        console.error(
            "API request error:",
            error
        );


        return {

            ok: false,

            status: 0,

            message:
                "Unable to connect to the server."

        };

    }

}


/* ============================================================
   LOADING
   ============================================================ */

function showLoading(
    show = true
) {

    const loading =
        getElement("tasksLoading");

    const list =
        getElement("tasksList");

    const empty =
        getElement("tasksEmpty");


    if (loading) {

        loading.classList.toggle(
            "hidden",
            !show
        );

    }


    if (show) {

        if (list) {

            list.classList.add(
                "hidden"
            );

        }


        if (empty) {

            empty.classList.add(
                "hidden"
            );

        }

    }

    else {

        if (list) {

            list.classList.remove(
                "hidden"
            );

        }

    }

}


/* ============================================================
   LOAD CURRENT USER
   ============================================================ */

async function loadCurrentUser() {

    try {

        const result =
            await apiRequest(
                "/api/auth/me"
            );


        if (
            !result.ok ||
            !result.user
        ) {

            return;

        }


        const user =
            result.user;


        const name =
            user.name ||
            user.full_name ||
            user.fullName ||
            user.username ||
            "User";


        const username =
            user.username ||
            "";


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


        console.log(
            "Current user loaded:",
            user
        );

    }

    catch (error) {

        console.warn(
            "Could not load current user:",
            error
        );

    }

}


/* ============================================================
   USER INITIALS
   ============================================================ */

function getInitials(name) {

    const value =
        String(name || "User")
            .trim();


    if (!value) {

        return "U";

    }


    const parts =
        value
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* ============================================================
   LOAD TASKS
   ============================================================ */

async function loadTasks() {

    console.log(
        "Loading tasks..."
    );


    showLoading(true);


    const result =
        await apiRequest(
            "/api/tasks"
        );


    if (!result.ok) {

        showLoading(false);

        renderTaskLoadError(
            getResponseMessage(
                result,
                "Unable to load tasks."
            )
        );

        return;

    }


    let tasks =
        result.tasks ??
        result.items ??
        result.data?.tasks ??
        result.data?.items ??
        result.data ??
        [];


    if (!Array.isArray(tasks)) {

        tasks = [];

    }


    tasksState.tasks =
        tasks
            .map(normalizeTask)
            .filter(Boolean);


    console.log(
        "Tasks loaded:",
        tasksState.tasks
    );


    showLoading(false);


    applyTaskFilters();

}


/* ============================================================
   LOAD ERROR
   ============================================================ */

function renderTaskLoadError(
    message
) {

    const container =
        getElement("tasksList");


    if (!container) {

        return;

    }


    container.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        <div class="page-empty-state">

            <div class="empty-state">

                <div class="empty-state-icon">
                    !
                </div>

                <h3>
                    Unable to load tasks
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="btn btn-primary btn-small"
                    id="retryLoadTasks"
                >
                    Try Again
                </button>

            </div>

        </div>

    `;


    getElement(
        "retryLoadTasks"
    )?.addEventListener(
        "click",
        loadTasks
    );

}


/* ============================================================
   APPLY FILTERS
   ============================================================ */

function applyTaskFilters() {

    let tasks =
        [...tasksState.tasks];


    /* SEARCH */

    const search =
        tasksState.search
            .trim()
            .toLowerCase();


    if (search) {

        tasks =
            tasks.filter(
                task => {

                    const searchable = [

                        task.title,

                        task.description,

                        task.category,

                        task.priority,

                        task.status,

                        task.due_date,

                        task.due_time

                    ]

                        .join(" ")

                        .toLowerCase();


                    return searchable.includes(
                        search
                    );

                }
            );

    }


    /* STATUS */

    if (
        tasksState.status !==
        "all"
    ) {

        if (
            tasksState.status ===
            "completed"
        ) {

            tasks =
                tasks.filter(
                    task =>
                        task.completed
                );

        }

        else if (
            tasksState.status ===
            "pending"
        ) {

            tasks =
                tasks.filter(
                    task =>
                        !task.completed
                );

        }

        else if (
            tasksState.status ===
            "overdue"
        ) {

            tasks =
                tasks.filter(
                    task =>
                        isTaskOverdue(task)
                );

        }

    }


    /* PRIORITY */

    if (
        tasksState.priority !==
        "all"
    ) {

        tasks =
            tasks.filter(
                task =>
                    task.priority ===
                    tasksState.priority
            );

    }


    /* SORT */

    tasks.sort(
        getTaskSortFunction(
            tasksState.sort
        )
    );


    tasksState.filteredTasks =
        tasks;


    renderTasks();

    updateTaskCounters();

}


/* ============================================================
   SORT
   ============================================================ */

function getTaskSortFunction(
    sort
) {

    switch (sort) {


        case "created_desc":

            return (
                a,
                b
            ) => {

                return (
                    getDateValue(
                        b.created_at
                    ) -
                    getDateValue(
                        a.created_at
                    )
                );

            };


        case "created_asc":

            return (
                a,
                b
            ) => {

                return (
                    getDateValue(
                        a.created_at
                    ) -
                    getDateValue(
                        b.created_at
                    )
                );

            };


        case "priority":

            return (
                a,
                b
            ) => {

                const order = {

                    high: 1,

                    medium: 2,

                    low: 3

                };


                return (
                    (order[a.priority] || 4) -
                    (order[b.priority] || 4)
                );

            };


        case "title":

            return (
                a,
                b
            ) => {

                return String(
                    a.title
                ).localeCompare(
                    String(
                        b.title
                    )
                );

            };


        case "due_asc":

        default:

            return (
                a,
                b
            ) => {

                const aTime =
                    getTaskDueTimestamp(a);

                const bTime =
                    getTaskDueTimestamp(b);


                if (
                    aTime === null &&
                    bTime === null
                ) {

                    return 0;

                }


                if (
                    aTime === null
                ) {

                    return 1;

                }


                if (
                    bTime === null
                ) {

                    return -1;

                }


                return aTime - bTime;

            };

    }

}


/* ============================================================
   DATE VALUE
   ============================================================ */

function getDateValue(
    value
) {

    if (!value) {

        return 0;

    }


    const timestamp =
        new Date(value)
            .getTime();


    return Number.isNaN(timestamp)
        ? 0
        : timestamp;

}


/* ============================================================
   TASK DUE TIMESTAMP
   ============================================================ */

function getTaskDueTimestamp(
    task
) {

    if (
        !task ||
        !task.due_date
    ) {

        return null;

    }


    const time =
        task.due_time ||
        "23:59";


    const date =
        new Date(
            `${task.due_date}T${time}:00`
        );


    const timestamp =
        date.getTime();


    return Number.isNaN(timestamp)
        ? null
        : timestamp;

}


/* ============================================================
   RENDER TASKS
   ============================================================ */

function renderTasks() {

    const container =
        getElement("tasksList");


    if (!container) {

        return;

    }


    if (
        !tasksState.filteredTasks.length
    ) {

        container.innerHTML = "";

        container.classList.remove(
            "hidden"
        );

        renderTasksEmptyState();

        return;

    }


    const empty =
        getElement("tasksEmpty");


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    container.classList.remove(
        "hidden"
    );


    container.innerHTML =
        tasksState.filteredTasks
            .map(
                renderTaskItem
            )
            .join("");

}


/* ============================================================
   RENDER TASK ITEM
   ============================================================ */

function renderTaskItem(
    task
) {

    const completed =
        Boolean(
            task.completed
        );


    const overdue =
        isTaskOverdue(task);


    const priority =
        task.priority ||
        "medium";


    const priorityLabel =
        capitalize(priority);


    const dueText =
        getTaskDueText(task);


    const checklist =
        Array.isArray(
            task.checklist
        )
            ? task.checklist
            : [];


    const completedChecklist =
        checklist.filter(
            item =>
                Boolean(
                    item.completed
                )
        ).length;


    return `

        <article
            class="
                task-list-item
                ${completed ? "completed" : ""}
            "
            data-task-id="${escapeHTML(task.id)}"
        >

            <!-- COMPLETE -->

            <button
                type="button"
                class="
                    task-list-check
                    ${completed ? "completed" : ""}
                "
                data-action="toggle"
                data-id="${escapeHTML(task.id)}"
                title="${
                    completed
                        ? "Mark as pending"
                        : "Mark as completed"
                }"
            >
                ${completed ? "✓" : ""}
            </button>


            <!-- MAIN -->

            <div
                class="task-list-main"
            >

                <span
                    class="task-list-title"
                >
                    ${escapeHTML(task.title)}
                </span>


                ${
                    task.description
                        ? `

                            <span
                                class="task-list-description"
                            >
                                ${escapeHTML(
                                    task.description
                                )}
                            </span>

                        `
                        : ""
                }


                <div
                    class="task-list-meta"
                >

                    ${
                        task.due_date
                            ? `

                                <span
                                    class="
                                        task-meta
                                        ${
                                            overdue
                                                ? "overdue-text"
                                                : ""
                                        }
                                    "
                                >
                                    📅
                                    ${escapeHTML(
                                        dueText
                                    )}
                                </span>

                            `
                            : ""
                    }


                    ${
                        task.category
                            ? `

                                <span
                                    class="task-meta"
                                >
                                    #${escapeHTML(
                                        task.category
                                    )}
                                </span>

                            `
                            : ""
                    }


                    ${
                        checklist.length
                            ? `

                                <span
                                    class="task-meta"
                                >
                                    ☑
                                    ${completedChecklist}/${checklist.length}
                                </span>

                            `
                            : ""
                    }

                </div>

            </div>


            <!-- PRIORITY -->

            <span
                class="
                    priority-badge
                    ${escapeHTML(priority)}
                "
            >
                ${escapeHTML(priorityLabel)}
            </span>


            <!-- ACTIONS -->

            <div
                class="task-actions"
            >

                <button
                    type="button"
                    class="icon-button"
                    data-action="edit"
                    data-id="${escapeHTML(task.id)}"
                    title="Edit"
                >
                    ✎
                </button>


                <button
                    type="button"
                    class="
                        icon-button
                        delete
                    "
                    data-action="delete"
                    data-id="${escapeHTML(task.id)}"
                    title="Delete"
                >
                    ×
                </button>

            </div>

        </article>

    `;

}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function renderTasksEmptyState() {

    const empty =
        getElement("tasksEmpty");


    if (!empty) {

        return;

    }


    const hasFilters =
        Boolean(
            tasksState.search
        ) ||
        tasksState.status !== "all" ||
        tasksState.priority !== "all";


    const text =
        getElement(
            "tasksEmptyText"
        );


    if (hasFilters) {

        empty.classList.remove(
            "hidden"
        );


        if (text) {

            text.textContent =
                "Try changing your search or filters.";

        }

    }

    else {

        empty.classList.remove(
            "hidden"
        );


        if (text) {

            text.textContent =
                "Create your first task to get started.";

        }

    }

}


/* ============================================================
   COUNTERS
   ============================================================ */

function updateTaskCounters() {

    const tasks =
        tasksState.tasks;


    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const pending =
        tasks.filter(
            task =>
                !task.completed
        ).length;


    const overdue =
        tasks.filter(
            task =>
                isTaskOverdue(task)
        ).length;


    setText(
        "totalTasks",
        total
    );


    setText(
        "pendingTasks",
        pending
    );


    setText(
        "completedTasks",
        completed
    );


    setText(
        "overdueTasks",
        overdue
    );


    setText(
        "tasksCount",
        total
    );


    setText(
        "taskResultCount",
        `${tasksState.filteredTasks.length} ${
            tasksState.filteredTasks.length === 1
                ? "task"
                : "tasks"
        }`
    );

}


/* ============================================================
   TASK OVERDUE
   ============================================================ */

function isTaskOverdue(
    task
) {

    if (
        !task ||
        task.completed ||
        !task.due_date
    ) {

        return false;

    }


    const due =
        getTaskDueTimestamp(
            task
        );


    if (due === null) {

        return false;

    }


    return (
        due <
        Date.now()
    );

}


/* ============================================================
   TASK DUE TODAY
   ============================================================ */

function isTaskDueToday(
    task
) {

    if (
        !task ||
        !task.due_date
    ) {

        return false;

    }


    const today =
        new Date();


    const due =
        parseDateOnly(
            task.due_date
        );


    return (
        today.getFullYear() ===
            due.getFullYear() &&

        today.getMonth() ===
            due.getMonth() &&

        today.getDate() ===
            due.getDate()
    );

}


/* ============================================================
   PARSE YYYY-MM-DD
   ============================================================ */

function parseDateOnly(
    value
) {

    const parts =
        String(value)
            .split("-")
            .map(Number);


    if (
        parts.length !== 3 ||
        parts.some(
            Number.isNaN
        )
    ) {

        return new Date(
            value
        );

    }


    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


/* ============================================================
   TASK DUE TEXT
   ============================================================ */

function getTaskDueText(
    task
) {

    if (
        !task ||
        !task.due_date
    ) {

        return "";

    }


    if (
        isTaskDueToday(task)
    ) {

        return task.due_time
            ? `Today, ${task.due_time}`
            : "Today";

    }


    const due =
        parseDateOnly(
            task.due_date
        );


    const tomorrow =
        new Date();


    tomorrow.setHours(
        0,
        0,
        0,
        0
    );


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    if (
        due.getTime() ===
        tomorrow.getTime()
    ) {

        return task.due_time
            ? `Tomorrow, ${task.due_time}`
            : "Tomorrow";

    }


    const dateText =
        due.toLocaleDateString(
            "en-IN",
            {

                day: "2-digit",

                month: "short",

                year: "numeric"

            }
        );


    return task.due_time
        ? `${dateText}, ${task.due_time}`
        : dateText;

}


/* ============================================================
   OPEN TASK EDITOR
   ============================================================ */

function openTaskEditor(
    taskId = null
) {

    console.log(
        "Opening task editor:",
        taskId || "new"
    );


    const modal =
        getElement("taskModal");

    const form =
        getElement("taskForm");


    if (!modal || !form) {

        console.error(
            "Task modal or task form not found."
        );

        return;

    }


    tasksState.editingId =
        taskId
            ? String(taskId)
            : null;


    form.reset();


    tasksState.checklist =
        [];


    setInputValue(
        "taskId",
        taskId || ""
    );


    /* NEW TASK */

    if (!taskId) {

        setText(
            "taskModalTitle",
            "New Task"
        );


        setText(
            "saveTaskText",
            "Save Task"
        );


        setInputValue(
            "taskPriority",
            "medium"
        );


        setInputValue(
            "taskCategory",
            "personal"
        );


        const reminder =
            getElement(
                "taskReminder"
            );


        if (reminder) {

            reminder.checked =
                false;

        }

        const googleCalendar =
            getElement("taskGoogleCalendar");

        if (googleCalendar) {
           googleCalendar.checked = false;
        } 

        


        renderChecklistEditor();


        openModal(
            modal
        );


        setTimeout(
            () => {

                getElement(
                    "taskTitle"
                )?.focus();

            },
            100
        );


        return;

    }


    /* EDIT */

    const task =
        tasksState.tasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );


    if (!task) {

        showToast(
            "Task not found.",
            "error"
        );

        return;

    }


    setText(
        "taskModalTitle",
        "Edit Task"
    );


    setText(
        "saveTaskText",
        "Save Changes"
    );


    setInputValue(
        "taskTitle",
        task.title
    );


    setInputValue(
        "taskDescription",
        task.description
    );


    setInputValue(
        "taskDueDate",
        formatDateForInput(
            task.due_date
        )
    );


    setInputValue(
        "taskDueTime",
        task.due_time
    );


    setInputValue(
        "taskPriority",
        task.priority ||
        "medium"
    );


    setInputValue(
        "taskCategory",
        task.category ||
        "personal"
    );


    const reminder =
        getElement(
            "taskReminder"
        );


    if (reminder) {

        reminder.checked =
            Boolean(
                task.reminder
            );

    }

    const googleCalendar =
    getElement("taskGoogleCalendar");

if (googleCalendar) {
    googleCalendar.checked =
        Boolean(
            task.google_calendar
        );
}


    tasksState.checklist =
        Array.isArray(
            task.checklist
        )

            ? task.checklist.map(
                item => ({

                    id:
                        item.id ||
                        createTemporaryId(),

                    text:
                        item.text ??
                        item.title ??
                        "",

                    completed:
                        Boolean(
                            item.completed
                        )

                })
            )

            : [];


    renderChecklistEditor();


    openModal(
        modal
    );

}


/* ============================================================
   CLOSE TASK EDITOR
   ============================================================ */

function closeTaskEditor() {

    closeModal(
        getElement(
            "taskModal"
        )
    );


    tasksState.editingId =
        null;


    tasksState.checklist =
        [];


    const form =
        getElement(
            "taskForm"
        );


    if (form) {

        form.reset();

    }

}


/* ============================================================
   SAVE TASK
   ============================================================ */

async function saveTask(
    event
) {

    event.preventDefault();


    const title =
        getInputValue(
            "taskTitle"
        ).trim();


    const description =
        getInputValue(
            "taskDescription"
        ).trim();


    const dueDate =
        getInputValue(
            "taskDueDate"
        );


    const dueTime =
        getInputValue(
            "taskDueTime"
        );


    const priority =
        getInputValue(
            "taskPriority"
        ) ||
        "medium";


    const category =
        getInputValue(
            "taskCategory"
        )
            .trim()
            .toLowerCase() ||
        "personal";


    const reminderElement =
        getElement(
            "taskReminder"
        );


    const reminder =
        Boolean(
            reminderElement?.checked
        );

    const googleCalendarElement =
    getElement(
        "taskGoogleCalendar"
    );

    const googleCalendar =
    Boolean(
        googleCalendarElement?.checked
    );  


    /* TITLE */

    if (!title) {

        showToast(
            "Please enter a task title.",
            "error"
        );


        getElement(
            "taskTitle"
        )?.focus();


        return;

    }


    /* DATE */

    if (
        dueDate &&
        !isValidDateString(
            dueDate
        )
    ) {

        showToast(
            "Please select a valid due date.",
            "error"
        );

        return;

    }


    /* TIME */

    if (
        dueTime &&
        !isValidTimeString(
            dueTime
        )
    ) {

        showToast(
            "Please select a valid due time.",
            "error"
        );

        return;

    }


    /* CHECKLIST */

    const checklist =
        tasksState.checklist

            .map(
                item => ({

                    text:
                        String(
                            item.text ||
                            ""
                        ).trim(),

                    completed:
                        Boolean(
                            item.completed
                        )

                })
            )

            .filter(
                item =>
                    item.text.length > 0
            );


    /* PAYLOAD */

    const payload = {

        title,

        description,

        due_date:
            dueDate ||
            null,

        due_time:
            dueTime ||
            null,

        priority,

        category,

        checklist,

        reminder,

        google_calendar:
            googleCalendar

    };


    console.log(
        "Task payload:",
        payload
    );


    const button =
        getElement(
            "saveTaskButton"
        );


    setButtonLoading(
        button,
        true,
        tasksState.editingId
            ? "Saving..."
            : "Creating..."
    );


    let result;


    try {

        /* EDIT */

        if (
            tasksState.editingId
        ) {

            result =
                await apiRequest(

                    `/api/tasks/${encodeURIComponent(
                        tasksState.editingId
                    )}`,

                    {

                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )

                    }

                );

        }

        /* CREATE */

        else {

            result =
                await apiRequest(

                    "/api/tasks",

                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                payload
                            )

                    }

                );

        }

    }

    catch (error) {

        console.error(
            "Save task error:",
            error
        );


        result = {

            ok: false,

            message:
                "Unable to save task."

        };

    }


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        console.error(
            "Save task response:",
            result
        );


        showToast(
            getResponseMessage(
                result,
                "Unable to save task."
            ),
            "error"
        );


        return;

    }


    const wasEditing =
        Boolean(
            tasksState.editingId
        );


    closeTaskEditor();


    showToast(
        wasEditing
            ? "Task updated successfully."
            : "Task created successfully.",
        "success"
    );


    await loadTasks();

}

/* ============================================================
   MOBILE SIDEBAR
============================================================ */

function initializeSidebar() {

    console.log("Initializing sidebar...");

    const sidebar =
        document.getElementById("appSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const openButton =
        document.getElementById("openSidebar");

    const closeButton =
        document.getElementById("closeSidebar");


    console.log({
        sidebar,
        overlay,
        openButton,
        closeButton
    });


    if (!sidebar) {
        console.warn("Sidebar #appSidebar not found.");
        return;
    }


    /* ========================================================
       OPEN
    ======================================================== */

    openButton?.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            sidebar.classList.add("open");

            overlay?.classList.add("active");

            document.body.classList.add(
                "sidebar-open"
            );

        }
    );


    /* ========================================================
       CLOSE
    ======================================================== */

    function closeSidebar() {

        sidebar.classList.remove("open");

        overlay?.classList.remove("active");

        document.body.classList.remove(
            "sidebar-open"
        );

    }


    closeButton?.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeSidebar();

        }
    );


    /* ========================================================
       OVERLAY
    ======================================================== */

    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    /* ========================================================
       SIDEBAR LINKS
    ======================================================== */

    sidebar
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    closeSidebar
                );

            }
        );


    /* ========================================================
       ESC
    ======================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

            }

        }
    );

}

/* ============================================================
   TOGGLE TASK
   ============================================================ */

async function toggleTask(
    taskId
) {

    const task =
        tasksState.tasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );


    if (!task) {

        showToast(
            "Task not found.",
            "error"
        );

        return;

    }


    const completed =
        !task.completed;


    const result =
        await apiRequest(

            `/api/tasks/${encodeURIComponent(
                taskId
            )}`,

            {

                method:
                    "PATCH",

                body:
                    JSON.stringify({

                        completed,

                        status:
                            completed
                                ? "completed"
                                : "pending"

                    })

            }

        );


    if (!result.ok) {

        showToast(
            getResponseMessage(
                result,
                "Unable to update task."
            ),
            "error"
        );

        return;

    }


    task.completed =
        completed;


    task.status =
        completed
            ? "completed"
            : "pending";


    task.completed_at =
        completed
            ? new Date().toISOString()
            : null;


    applyTaskFilters();


    showToast(
        completed
            ? "Task completed."
            : "Task marked as pending.",
        "success"
    );

}


/* ============================================================
   DELETE MODAL
   ============================================================ */

function openDeleteTaskModal(
    taskId
) {

    const task =
        tasksState.tasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );


    if (!task) {

        showToast(
            "Task not found.",
            "error"
        );

        return;

    }


    tasksState.deleteId =
        String(taskId);


    const modal =
        getElement(
            "deleteTaskModal"
        );


    openModal(
        modal
    );

}


/* ============================================================
   CLOSE DELETE MODAL
   ============================================================ */

function closeDeleteTaskModal() {

    closeModal(
        getElement(
            "deleteTaskModal"
        )
    );


    tasksState.deleteId =
        null;

}


/* ============================================================
   CONFIRM DELETE
   ============================================================ */

async function confirmDeleteTask() {

    const taskId =
        tasksState.deleteId;


    if (!taskId) {

        return;

    }


    const button =
        getElement(
            "confirmDeleteTask"
        );


    setButtonLoading(
        button,
        true,
        "Deleting..."
    );


    const result =
        await apiRequest(

            `/api/tasks/${encodeURIComponent(
                taskId
            )}`,

            {

                method:
                    "DELETE"

            }

        );


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        showToast(
            getResponseMessage(
                result,
                "Unable to delete task."
            ),
            "error"
        );

        return;

    }


    tasksState.tasks =
        tasksState.tasks.filter(
            task =>
                String(task.id) !==
                String(taskId)
        );


    closeDeleteTaskModal();


    applyTaskFilters();


    showToast(
        "Task deleted successfully.",
        "success"
    );

}


/* ============================================================
   CHECKLIST - ADD
   ============================================================ */

function addChecklistItem() {

    tasksState.checklist.push({

        id:
            createTemporaryId(),

        text:
            "",

        completed:
            false

    });


    renderChecklistEditor();


    setTimeout(
        () => {

            const inputs =
                document.querySelectorAll(
                    ".checklist-editor-item input[type='text']"
                );


            inputs[
                inputs.length - 1
            ]?.focus();

        },
        50
    );

}


/* ============================================================
   CHECKLIST - REMOVE
   ============================================================ */

function removeChecklistItem(
    index
) {

    if (
        index < 0 ||
        index >=
            tasksState.checklist.length
    ) {

        return;

    }


    tasksState.checklist.splice(
        index,
        1
    );


    renderChecklistEditor();

}


/* ============================================================
   CHECKLIST - TEXT
   ============================================================ */

function updateChecklistText(
    index,
    value
) {

    if (
        !tasksState.checklist[index]
    ) {

        return;

    }


    tasksState.checklist[index].text =
        value;

}


/* ============================================================
   CHECKLIST - COMPLETED
   ============================================================ */

function updateChecklistCompleted(
    index,
    completed
) {

    if (
        !tasksState.checklist[index]
    ) {

        return;

    }


    tasksState.checklist[index].completed =
        Boolean(
            completed
        );

}


/* ============================================================
   RENDER CHECKLIST EDITOR
   ============================================================ */

function renderChecklistEditor() {

    const container =
        getElement(
            "checklistItems"
        );


    if (!container) {

        return;

    }


    if (
        !tasksState.checklist.length
    ) {

        container.innerHTML = `

            <div class="task-meta">
                No checklist items.
                Click "Add item".
            </div>

        `;

        return;

    }


    container.innerHTML =
        tasksState.checklist
            .map(
                (
                    item,
                    index
                ) => `

                    <div
                        class="checklist-editor-item"
                    >

                        <input
                            type="checkbox"
                            ${
                                item.completed
                                    ? "checked"
                                    : ""
                            }
                            data-checklist-completed="${index}"
                            title="Completed"
                        >


                        <input
                            type="text"
                            value="${escapeHTML(
                                item.text
                            )}"
                            placeholder="Checklist item..."
                            data-checklist-text="${index}"
                        >


                        <button
                            type="button"
                            data-checklist-remove="${index}"
                            title="Remove"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");

}


/* ============================================================
   DATE VALIDATION
   ============================================================ */

function isValidDateString(
    value
) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        return false;

    }


    const date =
        parseDateOnly(
            value
        );


    return (
        !Number.isNaN(
            date.getTime()
        ) &&

        date.getFullYear() ===
            Number(
                value.substring(0, 4)
            ) &&

        date.getMonth() + 1 ===
            Number(
                value.substring(5, 7)
            ) &&

        date.getDate() ===
            Number(
                value.substring(8, 10)
            )
    );

}


/* ============================================================
   TIME VALIDATION
   ============================================================ */

function isValidTimeString(
    value
) {

    return /^([01]\d|2[0-3]):[0-5]\d$/
        .test(value);

}


/* ============================================================
   FORMAT DATE FOR INPUT
   ============================================================ */

function formatDateForInput(
    value
) {

    if (!value) {

        return "";

    }


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            String(value)
        )
    ) {

        return String(value);

    }


    const date =
        new Date(value);


    if (
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
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* ============================================================
   SEARCH
   ============================================================ */

function clearTaskSearch() {

    const input =
        getElement(
            "taskSearch"
        );


    if (input) {

        input.value =
            "";

    }


    tasksState.search =
        "";


    updateClearSearchButton();


    applyTaskFilters();

}


/* ============================================================
   CLEAR FILTERS
   ============================================================ */

function clearTaskFilters() {

    tasksState.search =
        "";


    tasksState.status =
        "all";


    tasksState.priority =
        "all";


    const search =
        getElement(
            "taskSearch"
        );


    if (search) {

        search.value =
            "";

    }


    const priority =
        getElement(
            "priorityFilter"
        );


    if (priority) {

        priority.value =
            "all";

    }


    const sort =
        getElement(
            "taskSort"
        );


    if (sort) {

        sort.value =
            "due_asc";

    }


    document
        .querySelectorAll(
            ".filter-button[data-status]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.status ===
                        "all"
                );

            }
        );


    updateClearSearchButton();


    applyTaskFilters();

}


/* ============================================================
   SEARCH CLEAR BUTTON
   ============================================================ */

function updateClearSearchButton() {

    const input =
        getElement(
            "taskSearch"
        );


    const button =
        getElement(
            "clearTaskSearch"
        );


    if (!input || !button) {

        return;

    }


    button.classList.toggle(
        "hidden",
        !input.value
    );

}


/* ============================================================
   CAPITALIZE
   ============================================================ */

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
        text.charAt(0)
            .toUpperCase() +
        text.slice(1)
    );

}


/* ============================================================
   EVENT DELEGATION
   ============================================================ */

function initializeTaskEvents() {

    console.log(
        "Initializing task events..."
    );


    /* NEW TASK */

    getElement(
        "addTaskButton"
    )?.addEventListener(
        "click",
        () => {

            console.log(
                "New Task clicked"
            );

            openTaskEditor();

        }
    );


    /* EMPTY CREATE */

    getElement(
        "emptyAddTaskButton"
    )?.addEventListener(
        "click",
        () => {

            openTaskEditor();

        }
    );


    /* CLOSE */

    getElement(
        "closeTaskModal"
    )?.addEventListener(
        "click",
        closeTaskEditor
    );


    /* CANCEL */

    getElement(
        "cancelTask"
    )?.addEventListener(
        "click",
        closeTaskEditor
    );


    /* SAVE */

    getElement(
        "taskForm"
    )?.addEventListener(
        "submit",
        saveTask
    );


    /* ADD CHECKLIST */

    getElement(
        "addChecklistItem"
    )?.addEventListener(
        "click",
        addChecklistItem
    );


    /* DELETE CANCEL */

    getElement(
        "cancelDeleteTask"
    )?.addEventListener(
        "click",
        closeDeleteTaskModal
    );


    /* DELETE CONFIRM */

    getElement(
        "confirmDeleteTask"
    )?.addEventListener(
        "click",
        confirmDeleteTask
    );


    /* SEARCH */

    const searchInput =
        getElement(
            "taskSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            debounce(
                event => {

                    tasksState.search =
                        event.target.value
                            .trim()
                            .toLowerCase();


                    updateClearSearchButton();


                    applyTaskFilters();

                },
                200
            )
        );

    }


    /* CLEAR SEARCH */

    getElement(
        "clearTaskSearch"
    )?.addEventListener(
        "click",
        clearTaskSearch
    );


    /* STATUS */

    document
        .querySelectorAll(
            ".filter-button[data-status]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".filter-button[data-status]"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        tasksState.status =
                            button.dataset.status ||
                            "all";


                        applyTaskFilters();

                    }
                );

            }
        );


    /* PRIORITY */

    getElement(
        "priorityFilter"
    )?.addEventListener(
        "change",
        event => {

            tasksState.priority =
                event.target.value ||
                "all";


            applyTaskFilters();

        }
    );


    /* SORT */

    getElement(
        "taskSort"
    )?.addEventListener(
        "change",
        event => {

            tasksState.sort =
                event.target.value ||
                "due_asc";


            applyTaskFilters();

        }
    );


    /* SEARCH ICON */

    getElement(
        "taskSearchButton"
    )?.addEventListener(
        "click",
        () => {

            const input =
                getElement(
                    "taskSearch"
                );


            input?.focus();

        }
    );


    /* TASK ACTIONS */

    getElement(
        "tasksList"
    )?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (!id) {

                return;

            }


            if (
                action ===
                "toggle"
            ) {

                toggleTask(id);

            }


            else if (
                action ===
                "edit"
            ) {

                openTaskEditor(id);

            }


            else if (
                action ===
                "delete"
            ) {

                openDeleteTaskModal(id);

            }

        }
    );


    /* CHECKLIST EVENTS */

    getElement(
        "checklistItems"
    )?.addEventListener(
        "input",
        event => {

            const textIndex =
                event.target.dataset
                    .checklistText;


            if (
                textIndex !==
                undefined
            ) {

                updateChecklistText(
                    Number(textIndex),
                    event.target.value
                );

            }

        }
    );


    getElement(
        "checklistItems"
    )?.addEventListener(
        "change",
        event => {

            const completedIndex =
                event.target.dataset
                    .checklistCompleted;


            if (
                completedIndex !==
                undefined
            ) {

                updateChecklistCompleted(
                    Number(completedIndex),
                    event.target.checked
                );

            }

        }
    );


    getElement(
        "checklistItems"
    )?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-checklist-remove]"
                );


            if (!button) {

                return;

            }


            removeChecklistItem(
                Number(
                    button.dataset
                        .checklistRemove
                )
            );

        }
    );


    /* DUE DATE */

    getElement(
        "taskDueDate"
    )?.addEventListener(
        "change",
        event => {

            if (
                event.target.value &&
                !isValidDateString(
                    event.target.value
                )
            ) {

                showToast(
                    "Invalid due date.",
                    "error"
                );


                event.target.value =
                    "";

            }

        }
    );


    /* MODAL BACKGROUND CLICK */

    getElement(
        "taskModal"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "taskModal"
            ) {

                closeTaskEditor();

            }

        }
    );


    getElement(
        "deleteTaskModal"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "deleteTaskModal"
            ) {

                closeDeleteTaskModal();

            }

        }
    );


    /* ESCAPE */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            const taskModal =
                getElement(
                    "taskModal"
                );


            const deleteModal =
                getElement(
                    "deleteTaskModal"
                );


            if (
                taskModal &&
                !taskModal.classList.contains(
                    "hidden"
                )
            ) {

                closeTaskEditor();

            }


            else if (
                deleteModal &&
                !deleteModal.classList.contains(
                    "hidden"
                )
            ) {

                closeDeleteTaskModal();

            }

        }
    );


    /* CTRL + N */

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                "n"
            ) {

                event.preventDefault();

                openTaskEditor();

            }

        }
    );

}


/* ============================================================
   LOGOUT
   ============================================================ */

function initializeLogout() {

    const logoutButton =
        getElement(
            "logoutButton"
        );


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        () => {

            const modal =
                getElement(
                    "logoutModal"
                );


            if (modal) {

                openModal(
                    modal
                );

            }

            else {

                performLogout();

            }

        }
    );


    getElement(
        "cancelLogout"
    )?.addEventListener(
        "click",
        () => {

            closeModal(
                getElement(
                    "logoutModal"
                )
            );

        }
    );


    getElement(
        "confirmLogout"
    )?.addEventListener(
        "click",
        performLogout
    );

}


/* ============================================================
   LOGOUT
   ============================================================ */

async function performLogout() {

    const button =
        getElement(
            "confirmLogout"
        );


    if (button) {

        setButtonLoading(
            button,
            true,
            "Logging out..."
        );

    }


    try {

        await apiRequest(
            "/api/auth/logout",
            {

                method:
                    "POST"

            }
        );

    }

    catch (error) {

        console.warn(
            "Logout request error:",
            error
        );

    }


    window.location.href =
        "/login";

}


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Tasks JS loaded"
        );


        /* ====================================================
           SIDEBAR
        ==================================================== */

        initializeSidebar();


        /* ====================================================
           TASK EVENTS
        ==================================================== */

        initializeTaskEvents();


        /* ====================================================
           LOGOUT
        ==================================================== */

        initializeLogout();


        /* ====================================================
           USER
        ==================================================== */

        await loadCurrentUser();


        /* ====================================================
           TASKS
        ==================================================== */

        await loadTasks();

    }
);
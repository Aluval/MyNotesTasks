/* ============================================================
   MyNotes & Tasks
   CLEAN NOTES JAVASCRIPT
   ============================================================

   Supports:
   - Load notes
   - Create note
   - Edit note
   - Delete note
   - View note
   - Pin / unpin
   - Search
   - Category filter
   - Sorting
   - Character counter
   - Logout
   - Current user in sidebar

   Matched to the Notes HTML structure.
   ============================================================ */

"use strict";


/* ============================================================
   STATE
   ============================================================ */

const notesState = {
    notes: [],
    filteredNotes: [],
    search: "",
    category: "all",
    sort: "updated",
    editingId: null,
    deleteId: null
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
        element.textContent = value ?? "";
    }
}


function setInputValue(id, value) {

    const element = getElement(id);

    if (element) {
        element.value = value ?? "";
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

function debounce(callback, delay = 250) {

    let timer = null;

    return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(
            () => callback.apply(this, args),
            delay
        );
    };
}


/* ============================================================
   MODAL HELPERS
   ============================================================ */

function openModal(modal) {

    if (!modal) {

        console.error("Modal not found.");

        return;
    }

    modal.classList.remove("hidden");

    document.body.classList.add("modal-open");
}


function closeModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");

    document.body.classList.remove("modal-open");
}


/* ============================================================
   BUTTON LOADING
   ============================================================ */

function setButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {

    if (!button) {
        return;
    }

    const textElement =
        button.querySelector("[id$='Text']") ||
        button.querySelector("span");

    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            textElement
                ? textElement.textContent
                : button.textContent;

        if (textElement) {
            textElement.textContent = loadingText;
        }

        button.classList.add("loading");
    }

    else {

        button.disabled = false;

        if (textElement) {

            textElement.textContent =
                button.dataset.originalText ||
                "Save";
        }

        button.classList.remove("loading");
    }
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
   API REQUEST
   ============================================================ */

async function notesApi(
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
                        "Content-Type": "application/json",
                        ...(options.headers || {})
                    }
                }
            );

        let data = {};

        const contentType =
            response.headers.get("content-type") || "";

        if (
            contentType.includes("application/json")
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
            "Notes API error:",
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
   NORMALIZE NOTE
   ============================================================ */

function normalizeNote(note) {

    if (
        !note ||
        typeof note !== "object"
    ) {

        return null;
    }

    const rawId =
        note.id ??
        note._id ??
        note.note_id ??
        "";

    return {

        ...note,

        id:
            String(rawId),

        title:
            String(
                note.title ?? ""
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
                note.is_pinned ??
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
   UPDATE NOTE STATISTICS
   ============================================================ */

function updateNoteStats() {

    const notes =
        Array.isArray(notesState.notes)
            ? notesState.notes
            : [];

    const total =
        notes.length;

    const pinned =
        notes.filter(
            note =>
                note.pinned === true
        ).length;

    const today =
        notes.filter(
            note =>
                isToday(
                    note.updated_at ||
                    note.created_at
                )
        ).length;

    setText(
        "totalNotes",
        total
    );

    setText(
        "pinnedNotes",
        pinned
    );

    setText(
        "todayNotes",
        today
    );

    console.log(
        "Note statistics:",
        {
            total,
            pinned,
            today
        }
    );
}

/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Notes JS loaded"
        );

        initializeNotesPage();

        await loadCurrentUser();

        /*
         * Only load notes when the Notes HTML
         * actually contains notesGrid.
         */
        if (getElement("notesGrid")) {
            await loadNotes();
        }
    }
);


/* ============================================================
   PAGE EVENTS
   ============================================================ */

function initializeNotesPage() {

    console.log(
        "Initializing Notes page..."
    );


    // ============================================================
    // NEW NOTE BUTTON
    // Supports the HTML button: #addNoteButton
    // ============================================================

    const addNoteButton =
        getElement("addNoteButton");

    const newNoteButton =
        getElement("newNoteButton");

    if (addNoteButton) {

        addNoteButton.addEventListener(
            "click",
            () => {

                console.log(
                    "New Note clicked"
                );

                openNoteEditor();

            }
        );

    }


    if (
        newNoteButton &&
        newNoteButton !== addNoteButton
    ) {

        newNoteButton.addEventListener(
            "click",
            () => {

                console.log(
                    "New Note clicked"
                );

                openNoteEditor();

            }
        );

    }


    // ============================================================
    // MOBILE SIDEBAR
    // ============================================================

    const appSidebar =
        getElement("appSidebar");

    const openSidebar =
        getElement("openSidebar");

    const closeSidebar =
        getElement("closeSidebar");

    const sidebarOverlay =
        getElement("sidebarOverlay");


    function openMobileSidebar() {

        if (appSidebar) {
            appSidebar.classList.add("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("active");
        }

        document.body.classList.add(
            "sidebar-open"
        );

        console.log(
            "Sidebar opened"
        );
    }


    function closeMobileSidebar() {

        if (appSidebar) {
            appSidebar.classList.remove("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }

        document.body.classList.remove(
            "sidebar-open"
        );

        console.log(
            "Sidebar closed"
        );
    }


    // ============================================================
    // OPEN SIDEBAR BUTTON
    // ============================================================

    if (openSidebar) {

        openSidebar.addEventListener(
            "click",
            openMobileSidebar
        );

    }


    // ============================================================
    // CLOSE SIDEBAR BUTTON
    // ============================================================

    if (closeSidebar) {

        closeSidebar.addEventListener(
            "click",
            closeMobileSidebar
        );

    }


    // ============================================================
    // SIDEBAR OVERLAY
    // ============================================================

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }


    // ============================================================
    // CLOSE SIDEBAR WHEN NAVIGATION LINK IS CLICKED
    // Mobile only
    // ============================================================

    if (appSidebar) {

        appSidebar
            .querySelectorAll(".nav-item")
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            closeMobileSidebar();

                        }
                    );

                }
            );

    }


    // ============================================================
    // CLOSE SIDEBAR WITH ESCAPE
    // ============================================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                appSidebar?.classList.contains("open")
            ) {

                closeMobileSidebar();

            }

        }
    );


    // ============================================================
    // CLOSE EDITOR
    // ============================================================

    getElement(
        "closeNoteModal"
    )?.addEventListener(
        "click",
        closeNoteEditor
    );


    getElement(
        "cancelNote"
    )?.addEventListener(
        "click",
        closeNoteEditor
    );


    getElement(
        "cancelNoteButton"
    )?.addEventListener(
        "click",
        closeNoteEditor
    );


    // ============================================================
    // SAVE NOTE
    // ============================================================

    getElement(
        "noteForm"
    )?.addEventListener(
        "submit",
        saveNote
    );


    // ============================================================
    // SEARCH
    // IMPORTANT: HTML ID = notesSearch
    // ============================================================

    const searchInput =
        getElement("notesSearch");


    searchInput?.addEventListener(
        "input",
        debounce(
            event => {

                notesState.search =
                    event.target.value
                        .trim()
                        .toLowerCase();

                updateClearSearchButton();

                applyNotesFilters();

            },
            200
        )
    );


    // ============================================================
    // CLEAR SEARCH
    // ============================================================

    getElement(
        "clearNoteSearch"
    )?.addEventListener(
        "click",
        clearNoteSearch
    );


    // ============================================================
    // CATEGORY FILTERS
    // ============================================================

    document
        .querySelectorAll(
            "[data-note-filter]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                "[data-note-filter]"
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


                        notesState.category =
                            button.dataset.noteFilter ||
                            "all";


                        applyNotesFilters();

                    }
                );

            }
        );


    // ============================================================
    // SORT
    // ============================================================

    getElement(
        "notesSort"
    )?.addEventListener(
        "change",
        event => {

            notesState.sort =
                event.target.value ||
                "updated";

            applyNotesFilters();

        }
    );


    // ============================================================
    // CHARACTER COUNT
    // ============================================================

    getElement(
        "noteContent"
    )?.addEventListener(
        "input",
        updateNoteCharacterCount
    );


    // ============================================================
    // DELETE
    // ============================================================

    getElement(
        "confirmDeleteNote"
    )?.addEventListener(
        "click",
        confirmDeleteNote
    );


    getElement(
        "cancelDeleteNote"
    )?.addEventListener(
        "click",
        closeDeleteNoteModal
    );


/* ============================================================
   VIEW MODAL CLOSE BUTTONS
   ============================================================ */

getElement(
    "closeNoteViewModal"
)?.addEventListener(
    "click",
    function () {

        closeViewNoteModal();

    }
);


getElement(
    "closeViewedNote"
)?.addEventListener(
    "click",
    function () {

        closeViewNoteModal();

    }
);


/* ============================================================
   EDIT NOTE FROM VIEW MODAL
   ============================================================ */

getElement(
    "editViewedNote"
)?.addEventListener(
    "click",
    function () {

        console.log(
            "Edit Note clicked"
        );

        const viewedNoteId =
            getElement(
                "viewedNoteId"
            )?.value;

        console.log(
            "Viewed Note ID:",
            viewedNoteId
        );


        if (!viewedNoteId) {

            showToast(
                "Unable to identify this note.",
                "error"
            );

            return;
        }


        // ------------------------------------------------------
        // FIRST: CLOSE VIEW MODAL COMPLETELY
        // ------------------------------------------------------

        const viewModal =
            getElement(
                "noteViewModal"
            );

        if (viewModal) {

            viewModal.classList.add(
                "hidden"
            );

            viewModal.style.display =
                "none";

            viewModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        // ------------------------------------------------------
        // THEN: OPEN EDIT MODAL
        // ------------------------------------------------------

        // Wait for the browser to finish closing
        // the View modal before opening Editor.

        requestAnimationFrame(
            function () {

                console.log(
                    "Opening editor for:",
                    viewedNoteId
                );

                openNoteEditor(
                    viewedNoteId
                );

            }
        );

    }
);


    // ============================================================
    // EMPTY CREATE NOTE
    // ============================================================

    getElement(
        "emptyAddNoteButton"
    )?.addEventListener(
        "click",
        () => {

            openNoteEditor();

        }
    );


    // ============================================================
    // NOTE EDITOR BACKGROUND
    // ============================================================

    getElement(
        "noteEditorModal"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "noteEditorModal"
            ) {

                closeNoteEditor();

            }

        }
    );


    // ============================================================
    // DELETE MODAL BACKGROUND
    // ============================================================

    getElement(
        "deleteNoteModal"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "deleteNoteModal"
            ) {

                closeDeleteNoteModal();

            }

        }
    );


    // ============================================================
    // VIEW MODAL BACKGROUND
    // ============================================================

    getElement(
        "noteViewModal"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "noteViewModal"
            ) {

                closeViewNoteModal();

            }

        }
    );


    // ============================================================
    // ESCAPE FOR MODALS
    // ============================================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            const editor =
                getElement(
                    "noteEditorModal"
                );


            const deleteModal =
                getElement(
                    "deleteNoteModal"
                );


            const viewModal =
                getElement(
                    "noteViewModal"
                );


            if (
                editor &&
                !editor.classList.contains(
                    "hidden"
                )
            ) {

                closeNoteEditor();

            }

            else if (
                deleteModal &&
                !deleteModal.classList.contains(
                    "hidden"
                )
            ) {

                closeDeleteNoteModal();

            }

            else if (
                viewModal &&
                !viewModal.classList.contains(
                    "hidden"
                )
            ) {

                closeViewNoteModal();

            }

        }
    );


    // ============================================================
    // CTRL + N
    // ============================================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() === "n"
            ) {

                event.preventDefault();

                openNoteEditor();

            }

        }
    );


    // ============================================================
    // LOGOUT
    // ============================================================

    initializeLogout();

}


/* ============================================================
   CURRENT USER
   ============================================================ */

async function loadCurrentUser() {

    const result =
        await notesApi(
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
        "Notes current user:",
        user
    );
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
        value.split(/\s+/);

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
   LOAD NOTES
   ============================================================ */

async function loadNotes() {

    console.log(
        "Loading notes..."
    );

    const container =
        getElement("notesGrid");

    if (container) {
        showNotesLoading();
    }

    const result =
        await notesApi(
            "/api/notes"
        );

    if (!result.ok) {

        console.error(
            "Load notes failed:",
            result
        );

        if (container) {

            container.innerHTML = `

                <div class="page-empty-state">

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            !
                        </div>

                        <h3>
                            Unable to load notes
                        </h3>

                        <p>
                            ${escapeHTML(
                                getResponseMessage(
                                    result,
                                    "Please refresh the page and try again."
                                )
                            )}
                        </p>

                        <button
                            type="button"
                            class="btn btn-primary btn-small"
                            id="retryLoadNotes"
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            `;

            getElement(
                "retryLoadNotes"
            )?.addEventListener(
                "click",
                loadNotes
            );
        }

        return;
    }

    let notes =
        result.notes ??
        result.items ??
        result.data?.notes ??
        result.data?.items ??
        result.data ??
        [];

    if (!Array.isArray(notes)) {
        notes = [];
    }

    notesState.notes =
        notes
            .map(normalizeNote)
            .filter(Boolean);

    console.log(
        "Notes loaded:",
        notesState.notes
    );

    applyNotesFilters();
}


/* ============================================================
   LOADING
   ============================================================ */

function showNotesLoading() {

    const container =
        getElement("notesGrid");

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="loading-state">

            <div class="loading-spinner"></div>

            <span>
                Loading notes...
            </span>

        </div>

    `;
}


/* ============================================================
   APPLY FILTERS
   ============================================================ */

function applyNotesFilters() {

    let notes =
        [...notesState.notes];


    /* --------------------------------------------------------
       SEARCH
    -------------------------------------------------------- */

    if (notesState.search) {

        notes =
            notes.filter(
                note => {

                    const searchable = [

                        note.title,

                        note.content,

                        note.category

                    ]
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        notesState.search
                    );
                }
            );
    }


    /* --------------------------------------------------------
       CATEGORY
    -------------------------------------------------------- */

    if (
        notesState.category !== "all"
    ) {

        notes =
            notes.filter(
                note =>
                    (
                        note.category ||
                        ""
                    ).toLowerCase() ===
                    notesState.category.toLowerCase()
            );
    }


    /* --------------------------------------------------------
       SORT
    -------------------------------------------------------- */

    notes.sort(
        getNoteSortFunction(
            notesState.sort
        )
    );

    notesState.filteredNotes =
        notes;

    renderNotes();

    updateNotesCount();
}


/* ============================================================
   SORT
   ============================================================ */

function getNoteSortFunction(sort) {

    switch (sort) {

        case "oldest":

            return (a, b) => {

                return (
                    getDateValue(
                        a.created_at
                    ) -
                    getDateValue(
                        b.created_at
                    )
                );
            };


        case "title":

            return (a, b) => {

                return String(
                    a.title
                ).localeCompare(
                    String(
                        b.title
                    )
                );
            };


        case "pinned":

            return (a, b) => {

                if (
                    a.pinned !==
                    b.pinned
                ) {

                    return a.pinned
                        ? -1
                        : 1;
                }

                return (
                    getDateValue(
                        b.updated_at ||
                        b.created_at
                    ) -
                    getDateValue(
                        a.updated_at ||
                        a.created_at
                    )
                );
            };


        case "newest":

            return (a, b) => {

                return (
                    getDateValue(
                        b.created_at
                    ) -
                    getDateValue(
                        a.created_at
                    )
                );
            };


        case "updated":

        default:

            return (a, b) => {

                return (
                    getDateValue(
                        b.updated_at ||
                        b.created_at
                    ) -
                    getDateValue(
                        a.updated_at ||
                        a.created_at
                    )
                );
            };
    }
}


/* ============================================================
   DATE VALUE
   ============================================================ */

function getDateValue(value) {

    if (!value) {
        return 0;
    }

    const timestamp =
        new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}


/* ============================================================
   RENDER NOTES
   ============================================================ */

function renderNotes() {

    const container =
        getElement("notesGrid");

    if (!container) {

        console.error(
            "#notesGrid not found."
        );

        return;
    }

    if (
        !notesState.filteredNotes.length
    ) {

        renderNotesEmptyState();

        return;
    }

    container.innerHTML =
        notesState.filteredNotes
            .map(renderNoteCard)
            .join("");

    container
        .querySelectorAll(
            "[data-note-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    handleNoteAction
                );
            }
        );
}


/* ============================================================
   NOTE CARD
   ============================================================ */

function renderNoteCard(note) {

    const category =
        note.category
            ? capitalize(note.category)
            : "General";

    const preview =
        note.content ||
        "No content";

    const dateText =
        note.updated_at
            ? `Updated ${relativeTime(
                note.updated_at
            )}`
            : formatDate(
                note.created_at
            );

    return `

        <article
            class="
                note-card
                ${note.pinned ? "pinned" : ""}
            "
            data-note-id="${escapeHTML(note.id)}"
        >

            <div
                class="note-card-header"
            >

                <button
                    type="button"
                    class="
                        note-pin
                        ${note.pinned ? "active" : ""}
                    "
                    data-note-action="pin"
                    data-id="${escapeHTML(note.id)}"
                    title="${
                        note.pinned
                            ? "Unpin note"
                            : "Pin note"
                    }"
                >
                    ${note.pinned ? "★" : "☆"}
                </button>


                <div
                    class="note-actions"
                >

                    <button
                        type="button"
                        class="icon-button"
                        data-note-action="view"
                        data-id="${escapeHTML(note.id)}"
                        title="View note"
                    >
                        👁
                    </button>


                    <button
                        type="button"
                        class="icon-button"
                        data-note-action="edit"
                        data-id="${escapeHTML(note.id)}"
                        title="Edit note"
                    >
                        ✎
                    </button>


                    <button
                        type="button"
                        class="
                            icon-button
                            delete
                        "
                        data-note-action="delete"
                        data-id="${escapeHTML(note.id)}"
                        title="Delete note"
                    >
                        ×
                    </button>

                </div>

            </div>


            <h3
                class="note-card-title"
            >
                ${escapeHTML(note.title)}
            </h3>


            <span
                class="note-category"
            >
                ${escapeHTML(category)}
            </span>


            <p
                class="note-content"
            >
                ${escapeHTML(preview)}
            </p>


            <div
                class="note-card-footer"
            >

                <span
                    class="note-date"
                >
                    ${escapeHTML(dateText)}
                </span>


                <button
                    type="button"
                    class="text-button"
                    data-note-action="view"
                    data-id="${escapeHTML(note.id)}"
                >
                    Read
                </button>

            </div>

        </article>

    `;
}


// ============================================================
// NOTE ACTION
// ============================================================

function handleNoteAction(event) {

    event.preventDefault();
    event.stopPropagation();

    const button =
        event.currentTarget;

    const action =
        button.dataset.noteAction;

    const id =
        button.dataset.id;

    if (!id) {
        console.error(
            "Note action: missing note ID"
        );

        return;
    }

    console.log(
        "NOTE ACTION:",
        action,
        "ID:",
        id
    );


    switch (action) {

        // ----------------------------------------------------
        // VIEW
        // ----------------------------------------------------

        case "view":

            console.log(
                "Opening VIEW modal:",
                id
            );

            viewNote(id);

            break;


        // ----------------------------------------------------
        // EDIT
        // ----------------------------------------------------

        case "edit":

            console.log(
                "Opening EDIT modal:",
                id
            );

            openNoteEditor(id);

            break;


        // ----------------------------------------------------
        // DELETE
        // ----------------------------------------------------

        case "delete":

            openDeleteNoteModal(id);

            break;


        // ----------------------------------------------------
        // PIN
        // ----------------------------------------------------

        case "pin":

            togglePinNote(id);

            break;


        default:

            console.warn(
                "Unknown note action:",
                action
            );

    }

}

/* ============================================================
   EMPTY STATE
   ============================================================ */

function renderNotesEmptyState() {

    const container =
        getElement("notesGrid");

    if (!container) {
        return;
    }

    const filtered =
        Boolean(
            notesState.search
        ) ||
        notesState.category !== "all";


    if (filtered) {

        container.innerHTML = `

            <div class="page-empty-state">

                <div class="empty-state">

                    <div class="empty-state-icon">
                        🔎
                    </div>

                    <h3>
                        No matching notes
                    </h3>

                    <p>
                        Try changing your search or filter.
                    </p>

                    <button
                        type="button"
                        class="btn btn-secondary btn-small"
                        id="clearNoteFiltersButton"
                    >
                        Clear Filters
                    </button>

                </div>

            </div>

        `;

        getElement(
            "clearNoteFiltersButton"
        )?.addEventListener(
            "click",
            clearNoteFilters
        );

        return;
    }


    container.innerHTML = `

        <div class="page-empty-state">

            <div class="empty-state">

                <div class="empty-state-icon">
                    📝
                </div>

                <h3>
                    No notes yet
                </h3>

                <p>
                    Create your first note and keep your ideas organized.
                </p>

                <button
                    type="button"
                    class="btn btn-primary btn-small"
                    id="emptyCreateNoteButton"
                >
                    + Create Note
                </button>

            </div>

        </div>

    `;

    getElement(
        "emptyCreateNoteButton"
    )?.addEventListener(
        "click",
        () => openNoteEditor()
    );
}


/* ============================================================
   CHECK TODAY
   ============================================================ */

function isToday(value) {

    if (!value) {
        return false;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return false;
    }

    const today =
        new Date();

    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );
}


/* ============================================================
   NOTES COUNTS
   ============================================================ */

function updateNotesCount() {

    const total =
        notesState.notes.length;

    const filtered =
        notesState.filteredNotes.length;

    const pinned =
        notesState.notes.filter(
            note =>
                note.pinned === true
        ).length;


    setText(
        "notesResultCount",
        `${filtered} ${
            filtered === 1
                ? "note"
                : "notes"
        }`
    );


    setText(
        "totalNotesCount",
        total
    );


    setText(
        "totalNotes",
        total
    );


    setText(
        "pinnedNotesCount",
        pinned
    );


    setText(
        "pinnedNotes",
        pinned
    );


    setText(
        "notesCount",
        total
    );


    const today =
        notesState.notes.filter(
            note =>
                isToday(
                    note.updated_at ||
                    note.created_at
                )
        ).length;


    setText(
        "todayNotes",
        today
    );


    console.log(
        "Notes counts:",
        {
            total,
            filtered,
            pinned,
            today
        }
    );
}

/* ============================================================
   SEARCH CLEAR
   ============================================================ */

function updateClearSearchButton() {

    const input =
        getElement("notesSearch");

    const button =
        getElement("clearNoteSearch");

    if (!input || !button) {
        return;
    }

    button.classList.toggle(
        "hidden",
        !input.value
    );
}


function clearNoteSearch() {

    const input =
        getElement("notesSearch");

    if (input) {
        input.value = "";
    }

    notesState.search = "";

    updateClearSearchButton();

    applyNotesFilters();
}


/* ============================================================
   CLEAR ALL FILTERS
   ============================================================ */

function clearNoteFilters() {

    notesState.search = "";

    notesState.category = "all";

    const search =
        getElement("notesSearch");

    if (search) {
        search.value = "";
    }

    document
        .querySelectorAll(
            "[data-note-filter]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.noteFilter === "all"
                );

            }
        );

    updateClearSearchButton();

    applyNotesFilters();
}


/* ============================================================
   OPEN NOTE EDITOR
   ============================================================ */

function openNoteEditor(
    noteId = null
) {

    console.log(
        "Opening note editor:",
        noteId || "new"
    );

    const modal =
        getElement(
            "noteEditorModal"
        );

    const form =
        getElement(
            "noteForm"
        );

    if (!modal || !form) {

        console.error(
            "Note editor modal or form not found."
        );

        return;
    }

    notesState.editingId =
        noteId
            ? String(noteId)
            : null;

    form.reset();

    setInputValue(
        "noteId",
        noteId || ""
    );

    setInputValue(
        "notesSearch",
        ""
    );

    /* --------------------------------------------------------
       NEW NOTE
    -------------------------------------------------------- */

    if (!noteId) {

        setText(
            "noteModalTitle",
            "Create Note"
        );

        setText(
            "saveNoteText",
            "Save Note"
        );

        const pinned =
            getElement(
                "notePinned"
            );

        if (pinned) {
            pinned.checked = false;
        }

        updateNoteCharacterCount();

        openModal(modal);

        setTimeout(
            () => {

                getElement(
                    "noteTitle"
                )?.focus();

            },
            100
        );

        return;
    }


    /* --------------------------------------------------------
       EDIT NOTE
    -------------------------------------------------------- */

    const note =
        notesState.notes.find(
            item =>
                String(item.id) ===
                String(noteId)
        );

    if (!note) {

        showToast(
            "Note not found.",
            "error"
        );

        return;
    }

    setText(
        "noteModalTitle",
        "Edit Note"
    );

    setText(
        "saveNoteText",
        "Save Changes"
    );

    setInputValue(
        "noteTitle",
        note.title
    );

    setInputValue(
        "noteContent",
        note.content
    );

    setInputValue(
        "noteCategory",
        note.category ||
        "general"
    );

    const pinned =
        getElement(
            "notePinned"
        );

    if (pinned) {

        pinned.checked =
            Boolean(
                note.pinned
            );
    }

    updateNoteCharacterCount();

    openModal(modal);

    setTimeout(
        () => {

            getElement(
                "noteTitle"
            )?.focus();

        },
        100
    );
}


/* ============================================================
   CLOSE NOTE EDITOR
   ============================================================ */

function closeNoteEditor() {

    closeModal(
        getElement(
            "noteEditorModal"
        )
    );

    notesState.editingId = null;

    setInputValue(
        "notesSearch",
        ""
    );

    setInputValue(
        "noteId",
        ""
    );
}


/* ============================================================
   SAVE NOTE
   ============================================================ */

async function saveNote(event) {

    event.preventDefault();

    const title =
        getInputValue(
            "noteTitle"
        ).trim();

    const content =
        getInputValue(
            "noteContent"
        ).trim();

    const category =
        getInputValue(
            "noteCategory"
        )
            .trim()
            .toLowerCase() ||
        "general";

    const pinnedElement =
        getElement(
            "notePinned"
        );

    const pinned =
        Boolean(
            pinnedElement?.checked
        );


    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    if (!title) {

        showToast(
            "Please enter a note title.",
            "error"
        );

        getElement(
            "noteTitle"
        )?.focus();

        return;
    }

    if (title.length > 200) {

        showToast(
            "Note title is too long.",
            "error"
        );

        return;
    }

    if (!content) {

        showToast(
            "Please enter some note content.",
            "error"
        );

        getElement(
            "noteContent"
        )?.focus();

        return;
    }

    if (content.length > 10000) {

        showToast(
            "Note content is too long.",
            "error"
        );

        return;
    }


    const payload = {

        title,

        content,

        category,

        pinned
    };


    console.log(
        "Note payload:",
        payload
    );


    const button =
        getElement(
            "saveNoteButton"
        );

    setButtonLoading(
        button,
        true,
        notesState.editingId
            ? "Saving..."
            : "Creating..."
    );


    let result;


    try {

        /* ----------------------------------------------------
           UPDATE
        ---------------------------------------------------- */

        if (notesState.editingId) {

            result =
                await notesApi(

                    `/api/notes/${encodeURIComponent(
                        notesState.editingId
                    )}`,

                    {

                        method: "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );
        }


        /* ----------------------------------------------------
           CREATE
        ---------------------------------------------------- */

        else {

            result =
                await notesApi(

                    "/api/notes",

                    {

                        method: "POST",

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
            "Save note error:",
            error
        );

        result = {

            ok: false,

            message:
                "Unable to save note."
        };
    }


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        console.error(
            "Save note response:",
            result
        );

        showToast(
            getResponseMessage(
                result,
                "Unable to save note."
            ),
            "error"
        );

        return;
    }


    const editing =
        Boolean(
            notesState.editingId
        );


    closeNoteEditor();

    notesState.editingId = null;


    showToast(
        editing
            ? "Note updated successfully."
            : "Note created successfully.",
        "success"
    );


    await loadNotes();
}


/* ============================================================
   VIEW NOTE
   ============================================================ */

function viewNote(noteId) {

    const note =
        notesState.notes.find(
            item =>
                String(item.id) ===
                String(noteId)
        );


    if (!note) {

        console.error(
            "VIEW NOTE: Note not found:",
            noteId
        );

        showToast(
            "Note not found.",
            "error"
        );

        return;
    }


    console.log(
        "VIEW NOTE:",
        note
    );


    /* --------------------------------------------------------
       STORE NOTE ID
    -------------------------------------------------------- */

    setInputValue(
        "viewedNoteId",
        note.id
    );


    /* --------------------------------------------------------
       TITLE
    -------------------------------------------------------- */

    setText(
        "viewNoteTitle",
        note.title || "Untitled Note"
    );


    /* --------------------------------------------------------
       CATEGORY
    -------------------------------------------------------- */

    setText(
        "viewNoteCategory",
        capitalize(
            note.category ||
            "general"
        )
    );


    /* --------------------------------------------------------
       CONTENT
    -------------------------------------------------------- */

    setText(
        "viewNoteContent",
        note.content || ""
    );


    /* --------------------------------------------------------
       DATE
    -------------------------------------------------------- */

    setText(
        "viewNoteDate",
        note.updated_at
            ? `Updated ${formatDateTime(
                note.updated_at
            )}`
            : `Created ${formatDateTime(
                note.created_at
            )}`
    );


    /* --------------------------------------------------------
       OPTIONAL PIN STATUS
    -------------------------------------------------------- */

    const pinStatus =
        getElement(
            "viewNotePinned"
        );


    if (pinStatus) {

        pinStatus.textContent =
            note.pinned
                ? "Pinned"
                : "";

    }


    /* --------------------------------------------------------
       VIEW MODAL
    -------------------------------------------------------- */

const modal =
    getElement(
        "noteViewModal"
    );

if (!modal) {

    console.error(
        "VIEW NOTE ERROR: #noteViewModal does not exist."
    );

    showToast(
        "Note view modal is missing.",
        "error"
    );

    return;
}

modal.style.display = "";
modal.classList.remove("hidden");

modal.setAttribute(
    "aria-hidden",
    "false"
);


    /* --------------------------------------------------------
       OPEN VIEW MODAL
    -------------------------------------------------------- */

    console.log(
        "Opening Note View Modal"
    );


    openModal(
        modal
    );

}


/* ============================================================
   CLOSE VIEW NOTE MODAL
   ============================================================ */

function closeViewNoteModal() {

    const modal =
        document.getElementById(
            "noteViewModal"
        );

    if (!modal) {
        return;
    }

    // Completely close the View modal
    modal.classList.add("hidden");

    // Remove any inline display that may keep it visible
    modal.style.display = "none";

    // Prevent it from remaining above/below another modal
    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    console.log(
        "View Note modal closed"
    );
}

/* ============================================================
   PIN / UNPIN
   ============================================================ */

async function togglePinNote(noteId) {

    const note =
        notesState.notes.find(
            item =>
                String(item.id) ===
                String(noteId)
        );

    if (!note) {
        return;
    }

    const newPinned =
        !note.pinned;

    const result =
        await notesApi(

            `/api/notes/${encodeURIComponent(
                noteId
            )}`,

            {

                method: "PUT",

                body:
                    JSON.stringify({
                        pinned: newPinned
                    })
            }
        );

    if (!result.ok) {

        showToast(
            getResponseMessage(
                result,
                "Unable to update note."
            ),
            "error"
        );

        return;
    }

    note.pinned =
        newPinned;

    note.updated_at =
        new Date().toISOString();

    applyNotesFilters();

    showToast(
        newPinned
            ? "Note pinned."
            : "Note unpinned.",
        "success"
    );
}


/* ============================================================
   DELETE NOTE
   ============================================================ */

function openDeleteNoteModal(noteId) {

    const note =
        notesState.notes.find(
            item =>
                String(item.id) ===
                String(noteId)
        );

    if (!note) {

        showToast(
            "Note not found.",
            "error"
        );

        return;
    }

    notesState.deleteId =
        String(noteId);

    setText(
        "deleteNoteTitle",
        note.title
    );

    const modal =
        getElement(
            "deleteNoteModal"
        );

    if (!modal) {

        if (
            confirm(
                `Delete "${note.title}"?`
            )
        ) {

            confirmDeleteNote();
        }

        return;
    }

    openModal(modal);
}


/* ============================================================
   CONFIRM DELETE
   ============================================================ */

async function confirmDeleteNote() {

    const noteId =
        notesState.deleteId;

    if (!noteId) {
        return;
    }

    const button =
        getElement(
            "confirmDeleteNote"
        );

    setButtonLoading(
        button,
        true,
        "Deleting..."
    );

    const result =
        await notesApi(

            `/api/notes/${encodeURIComponent(
                noteId
            )}`,

            {
                method: "DELETE"
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
                "Unable to delete note."
            ),
            "error"
        );

        return;
    }

    notesState.notes =
        notesState.notes.filter(
            note =>
                String(note.id) !==
                String(noteId)
        );

    closeDeleteNoteModal();

    notesState.deleteId = null;

    applyNotesFilters();

    showToast(
        "Note deleted successfully.",
        "success"
    );
}


/* ============================================================
   CLOSE DELETE NOTE MODAL
   ============================================================ */

function closeDeleteNoteModal() {

    closeModal(
        getElement(
            "deleteNoteModal"
        )
    );

    notesState.deleteId = null;
}


/* ============================================================
   CHARACTER COUNT
   ============================================================ */

function updateNoteCharacterCount() {

    const content =
        getElement(
            "noteContent"
        );

    const counter =
        getElement(
            "noteCharacterCount"
        );

    if (!content || !counter) {
        return;
    }

    counter.textContent =
        `${content.value.length.toLocaleString()} / 10,000`;
}


/* ============================================================
   FORMAT DATE
   ============================================================ */

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
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* ============================================================
   FORMAT DATE TIME
   ============================================================ */

function formatDateTime(value) {

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


/* ============================================================
   RELATIVE TIME
   ============================================================ */

function relativeTime(value) {

    if (!value) {
        return "just now";
    }

    const timestamp =
        new Date(value).getTime();

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
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


/* ============================================================
   LOGOUT
   ============================================================ */

function initializeLogout() {

    getElement(
        "logoutButton"
    )?.addEventListener(
        "click",
        () => {

            const modal =
                getElement(
                    "logoutModal"
                );

            if (modal) {

                openModal(modal);

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
   PERFORM LOGOUT
   ============================================================ */

async function performLogout() {

    const button =
        getElement(
            "confirmLogout"
        );

    setButtonLoading(
        button,
        true,
        "Logging out..."
    );

    try {

        await notesApi(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

    }

    catch (error) {

        console.warn(
            "Logout error:",
            error
        );
    }

    window.location.href =
        "/login";
}


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.loadNotes =
    loadNotes;

window.openNoteEditor =
    openNoteEditor;

window.editNote =
    openNoteEditor;

window.viewNote =
    viewNote;

window.togglePinNote =
    togglePinNote;

window.openDeleteNoteModal =
    openDeleteNoteModal;

window.confirmDeleteNote =
    confirmDeleteNote;

window.closeDeleteNoteModal =
    closeDeleteNoteModal;

window.closeNoteEditor =
    closeNoteEditor;

window.closeViewNoteModal =
    closeViewNoteModal;

window.clearNoteFilters =
    clearNoteFilters;

window.updateNoteCharacterCount =
    updateNoteCharacterCount;

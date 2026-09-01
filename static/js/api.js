
"use strict";

/* =========================================================
   MyNotes & Tasks
   Common API Helper
========================================================= */

const API = {

    /* =====================================================
       GET
    ===================================================== */

    async get(url) {

        try {

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        },

                        credentials: "same-origin"
                    }
                );


            return await parseResponse(
                response
            );

        } catch (error) {

            console.error(
                "GET API Error:",
                error
            );


            return {

                ok: false,

                status: 0,

                message:
                    "Unable to connect to the server."

            };

        }

    },


    /* =====================================================
       POST
    ===================================================== */

    async post(
        url,
        data = {}
    ) {

        try {

            const response =
                await fetch(
                    url,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify(
                                data
                            )

                    }
                );


            return await parseResponse(
                response
            );

        } catch (error) {

            console.error(
                "POST API Error:",
                error
            );


            return {

                ok: false,

                status: 0,

                message:
                    "Unable to connect to the server."

            };

        }

    },


    /* =====================================================
       PUT
    ===================================================== */

    async put(
        url,
        data = {}
    ) {

        try {

            const response =
                await fetch(
                    url,
                    {

                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify(
                                data
                            )

                    }
                );


            return await parseResponse(
                response
            );

        } catch (error) {

            console.error(
                "PUT API Error:",
                error
            );


            return {

                ok: false,

                status: 0,

                message:
                    "Unable to connect to the server."

            };

        }

    },


    /* =====================================================
       PATCH
    ===================================================== */

    async patch(
        url,
        data = {}
    ) {

        try {

            const response =
                await fetch(
                    url,
                    {

                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify(
                                data
                            )

                    }
                );


            return await parseResponse(
                response
            );

        } catch (error) {

            console.error(
                "PATCH API Error:",
                error
            );


            return {

                ok: false,

                status: 0,

                message:
                    "Unable to connect to the server."

            };

        }

    },


    /* =====================================================
       DELETE
    ===================================================== */

    async delete(
        url
    ) {

        try {

            const response =
                await fetch(
                    url,
                    {

                        method: "DELETE",

                        headers: {

                            "Accept":
                                "application/json"

                        },

                        credentials:
                            "same-origin"

                    }
                );


            return await parseResponse(
                response
            );

        } catch (error) {

            console.error(
                "DELETE API Error:",
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

};


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(
    response
) {

    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = {};

    }


    /*
     * Flask normally returns:
     *
     * {
     *     ok: true,
     *     message: "...",
     *     ...
     * }
     *
     * If Flask doesn't provide "ok",
     * use the HTTP status.
     */

    if (
        typeof data.ok !==
        "boolean"
    ) {

        data.ok =
            response.ok;

    }


    data.status =
        response.status;


    /*
     * Always provide a message.
     */

    if (
        !data.message
    ) {

        if (
            response.status === 400
        ) {

            data.message =
                "Invalid request.";

        }

        else if (
            response.status === 401
        ) {

            data.message =
                "Please log in again.";

        }

        else if (
            response.status === 403
        ) {

            data.message =
                "You do not have permission to perform this action.";

        }

        else if (
            response.status === 404
        ) {

            data.message =
                "Requested resource was not found.";

        }

        else if (
            response.status === 409
        ) {

            data.message =
                "This information already exists.";

        }

        else if (
            response.status >= 500
        ) {

            data.message =
                "Server error. Please try again later.";

        }

        else {

            data.message =
                response.ok
                    ? "Request successful."
                    : "Request failed.";

        }

    }


    return data;

}


/* =========================================================
   RESPONSE MESSAGE
========================================================= */

function getResponseMessage(
    response,
    fallback =
        "Something went wrong."
) {

    if (
        response &&
        response.message
    ) {

        return response.message;

    }


    return fallback;

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {

    if (!button) {
        return;
    }


    if (loading) {

        /*
         * Save original text so we can restore it.
         */

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.querySelector(
                    "span"
                )?.textContent ||
                button.textContent.trim();

        }


        button.disabled = true;

        button.classList.add(
            "loading"
        );


        const text =
            button.querySelector(
                "span"
            );


        if (text) {

            text.textContent =
                loadingText;

        }


        const spinner =
            button.querySelector(
                ".button-spinner"
            );


        if (spinner) {

            spinner.classList.add(
                "active"
            );

        }

    }

    else {

        button.disabled = false;

        button.classList.remove(
            "loading"
        );


        const text =
            button.querySelector(
                "span"
            );


        if (
            text &&
            button.dataset.originalText
        ) {

            text.textContent =
                button.dataset.originalText;

        }


        const spinner =
            button.querySelector(
                ".button-spinner"
            );


        if (spinner) {

            spinner.classList.remove(
                "active"
            );

        }

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info",
    duration = 3500
) {

    /*
     * Create toast container if it doesn't exist.
     */

    let container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "toastContainer";

        container.className =
            "toast-container";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    const icon =
        document.createElement(
            "span"
        );


    icon.className =
        "toast-icon";


    if (
        type === "success"
    ) {

        icon.textContent =
            "✓";

    }

    else if (
        type === "error"
    ) {

        icon.textContent =
            "!";

    }

    else if (
        type === "warning"
    ) {

        icon.textContent =
            "⚠";

    }

    else {

        icon.textContent =
            "i";

    }


    const text =
        document.createElement(
            "span"
        );


    text.className =
        "toast-message";

    text.textContent =
        message;


    const close =
        document.createElement(
            "button"
        );


    close.type =
        "button";

    close.className =
        "toast-close";

    close.textContent =
        "×";

    close.setAttribute(
        "aria-label",
        "Close notification"
    );


    close.addEventListener(
        "click",
        () => {

            removeToast(
                toast
            );

        }
    );


    toast.appendChild(
        icon
    );

    toast.appendChild(
        text
    );

    toast.appendChild(
        close
    );


    container.appendChild(
        toast
    );


    /*
     * Animate in.
     */

    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    /*
     * Automatically remove.
     */

    const timeout =
        setTimeout(
            () => {

                removeToast(
                    toast
                );

            },
            duration
        );


    toast.dataset.timeout =
        timeout;


    return toast;

}


/* =========================================================
   REMOVE TOAST
========================================================= */

function removeToast(
    toast
) {

    if (!toast) {
        return;
    }


    const timeout =
        toast.dataset.timeout;


    if (timeout) {

        clearTimeout(
            Number(timeout)
        );

    }


    toast.classList.remove(
        "show"
    );


    setTimeout(
        () => {

            toast.remove();

        },
        250
    );

}


/* =========================================================
   FORM VALIDATION HELPERS
========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            String(
                email || ""
            )
            .trim()
        );

}


function isStrongPassword(
    password
) {

    return (

        typeof password ===
        "string"

        &&

        password.length >= 8

        &&

        /[A-Z]/.test(
            password
        )

        &&

        /[a-z]/.test(
            password
        )

        &&

        /[0-9]/.test(
            password
        )

    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

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


/* =========================================================
   FORMAT DATE + TIME
========================================================= */

function formatDateTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

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


/* =========================================================
   DEBOUNCE
========================================================= */

function debounce(
    callback,
    delay = 300
) {

    let timer;


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
   LOGOUT HELPER
========================================================= */

async function logoutUser() {

    const result =
        await API.post(
            "/api/auth/logout"
        );


    if (
        result.ok
    ) {

        window.location.href =
            "/login";

        return true;

    }


    showToast(
        getResponseMessage(
            result,
            "Unable to logout."
        ),
        "error"
    );


    return false;

}


/* =========================================================
   AUTH CHECK
========================================================= */

async function checkAuthentication() {

    const result =
        await API.get(
            "/api/auth/me"
        );


    return result.ok
        ? result.user
        : null;

}


/* =========================================================
   EXPORT / GLOBAL ACCESS
========================================================= */

window.API =
    API;

window.getResponseMessage =
    getResponseMessage;

window.setButtonLoading =
    setButtonLoading;

window.showToast =
    showToast;

window.isValidEmail =
    isValidEmail;

window.isStrongPassword =
    isStrongPassword;

window.escapeHtml =
    escapeHtml;

window.formatDate =
    formatDate;

window.formatDateTime =
    formatDateTime;

window.debounce =
    debounce;

window.logoutUser =
    logoutUser;

window.checkAuthentication =
    checkAuthentication;


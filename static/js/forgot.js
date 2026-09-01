"use strict";

/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotState = {
    email: ""
};


document.addEventListener("DOMContentLoaded", () => {

    const page =
        document.getElementById(
            "forgotPasswordPage"
        );

    if (!page) {
        return;
    }

    initializeForgotPassword();

});


/* =========================================================
   INITIALIZE
========================================================= */

function initializeForgotPassword() {

    const form =
        document.getElementById(
            "forgotPasswordForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            sendResetCode
        );

    }

}


/* =========================================================
   SEND RESET CODE
========================================================= */

async function sendResetCode(event) {

    event.preventDefault();


    const email =
        document
            .getElementById(
                "forgotEmail"
            )
            ?.value
            .trim()
            .toLowerCase();


    if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        showForgotError(
            "Please enter a valid email address."
        );

        return;

    }


    const button =
        document.getElementById(
            "forgotPasswordButton"
        );


    setButtonLoading(
        button,
        true,
        "Sending..."
    );


    const result =
        await API.post(
            "/api/auth/forgot-password",
            {
                email: email
            }
        );


"use strict";

/* =========================================================
   FORGOT PASSWORD
   MyNotes & Tasks
========================================================= */

const forgotState = {
    email: ""
};


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const page =
            document.getElementById(
                "forgotPasswordPage"
            );

        if (!page) {
            return;
        }

        initializeForgotPassword();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeForgotPassword() {

    const form =
        document.getElementById(
            "forgotPasswordForm"
        );

    if (!form) {
        console.error(
            "Forgot password form not found."
        );

        return;
    }

    form.addEventListener(
        "submit",
        sendResetCode
    );


    /* -----------------------------------------------------
       Clear error while typing
    ----------------------------------------------------- */

    const emailInput =
        document.getElementById(
            "forgotEmail"
        );

    if (emailInput) {

        emailInput.addEventListener(
            "input",
            () => {

                hideForgotMessages();

            }
        );

    }

}


/* =========================================================
   SEND RESET CODE
========================================================= */

async function sendResetCode(event) {

    event.preventDefault();


    const emailInput =
        document.getElementById(
            "forgotEmail"
        );


    if (!emailInput) {

        showForgotError(
            "Email input was not found."
        );

        return;

    }


    const email =
        emailInput.value
            .trim()
            .toLowerCase();


    /* -----------------------------------------------------
       VALIDATE EMAIL
    ----------------------------------------------------- */

    if (!email) {

        showForgotError(
            "Please enter your email address."
        );

        emailInput.focus();

        return;

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    ) {

        showForgotError(
            "Please enter a valid email address."
        );

        emailInput.focus();

        return;

    }


    /* -----------------------------------------------------
       BUTTON
    ----------------------------------------------------- */

    const button =
        document.getElementById(
            "forgotPasswordButton"
        );


    setForgotButtonLoading(
        button,
        true
    );


    hideForgotMessages();


    try {

        /* -------------------------------------------------
           API REQUEST
        ------------------------------------------------- */

        let result;


        /*
         * Use existing API helper if available.
         */

        if (
            typeof API !== "undefined" &&
            typeof API.post === "function"
        ) {

            result =
                await API.post(
                    "/api/auth/forgot-password",
                    {
                        email: email
                    }
                );

        }

        /*
         * Fallback to fetch if API helper
         * is not available.
         */

        else {

            const response =
                await fetch(
                    "/api/auth/forgot-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email: email
                            })
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch (error) {

                data = {};

            }


            result = {

                ok:
                    response.ok,

                status:
                    response.status,

                data:
                    data,

                message:
                    data.message ||
                    data.error ||
                    ""

            };

        }


        /* -------------------------------------------------
           API ERROR
        ------------------------------------------------- */

        if (!result || !result.ok) {

            const message =
                getForgotResponseMessage(
                    result,
                    "Unable to process your request. Please try again."
                );


            showForgotError(
                message
            );


            setForgotButtonLoading(
                button,
                false
            );


            return;

        }


        /* -------------------------------------------------
           SAVE EMAIL
        ------------------------------------------------- */

        forgotState.email =
            email;


        sessionStorage.setItem(
            "resetEmail",
            email
        );


        /* -------------------------------------------------
           SUCCESS
        ------------------------------------------------- */

        showForgotSuccess(
            "If an account exists for this email, a password reset code has been sent."
        );


        setForgotButtonLoading(
            button,
            false
        );


        /* -------------------------------------------------
           GO TO RESET PASSWORD
        ------------------------------------------------- */

        setTimeout(
            () => {

                window.location.href =
                    "/reset-password";

            },
            1200
        );

    }

    catch (error) {

        console.error(
            "Forgot password error:",
            error
        );


        showForgotError(
            "Unable to connect to the server. Please try again."
        );


        setForgotButtonLoading(
            button,
            false
        );

    }

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setForgotButtonLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }


    const text =
        button.querySelector(
            "span:first-child"
        );


    const spinner =
        button.querySelector(
            ".button-spinner"
        );


    if (loading) {

        button.disabled = true;

        button.setAttribute(
            "aria-busy",
            "true"
        );


        if (text) {

            text.dataset.originalText =
                text.textContent;

            text.textContent =
                "Sending...";

        }


        if (spinner) {

            spinner.classList.add(
                "active"
            );

        }

    }

    else {

        button.disabled = false;

        button.removeAttribute(
            "aria-busy"
        );


        if (text) {

            text.textContent =
                text.dataset.originalText ||
                "Send Reset Code";

        }


        if (spinner) {

            spinner.classList.remove(
                "active"
            );

        }

    }

}


/* =========================================================
   HIDE MESSAGES
========================================================= */

function hideForgotMessages() {

    const error =
        document.getElementById(
            "authError"
        );


    const success =
        document.getElementById(
            "authSuccess"
        );


    if (error) {

        error.hidden = true;

        error.textContent = "";

    }


    if (success) {

        success.hidden = true;

        success.textContent = "";

    }

}


/* =========================================================
   ERROR
========================================================= */

function showForgotError(
    message
) {

    const error =
        document.getElementById(
            "authError"
        );


    const success =
        document.getElementById(
            "authSuccess"
        );


    if (success) {

        success.hidden = true;

        success.textContent = "";

    }


    if (error) {

        error.hidden = false;

        error.textContent =
            message;

        return;

    }


    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            "error"
        );

    }

}


/* =========================================================
   SUCCESS
========================================================= */

function showForgotSuccess(
    message
) {

    const error =
        document.getElementById(
            "authError"
        );


    const success =
        document.getElementById(
            "authSuccess"
        );


    if (error) {

        error.hidden = true;

        error.textContent = "";

    }


    if (success) {

        success.hidden = false;

        success.textContent =
            message;

        return;

    }


    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            "success"
        );

    }

}


/* =========================================================
   RESPONSE MESSAGE
========================================================= */

function getForgotResponseMessage(
    result,
    fallback
) {

    if (!result) {
        return fallback;
    }


    if (
        typeof getResponseMessage ===
        "function"
    ) {

        try {

            return getResponseMessage(
                result,
                fallback
            );

        }

        catch (error) {

            console.warn(
                "getResponseMessage failed:",
                error
            );

        }

    }


    if (result.message) {

        return result.message;

    }


    if (
        result.data &&
        result.data.message
    ) {

        return result.data.message;

    }


    if (
        result.data &&
        result.data.error
    ) {

        return result.data.error;

    }


    return fallback;

}

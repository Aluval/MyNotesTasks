"use strict";

/* =========================================================
   FORGOT PASSWORD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

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


    const emailInput =
        document.getElementById(
            "forgotEmail"
        );


    if (emailInput) {

        emailInput.addEventListener(
            "input",
            function () {

                clearForgotMessages();

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


    const button =
        document.getElementById(
            "forgotPasswordButton"
        );


    if (!emailInput) {

        showForgotError(
            "Email input not found."
        );

        return;
    }


    const email =
        emailInput.value
            .trim()
            .toLowerCase();


    /* -----------------------------------------------------
       VALIDATION
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
       LOADING
    ----------------------------------------------------- */

    setForgotLoading(
        button,
        true
    );


    clearForgotMessages();


    try {

        console.log(
            "Sending password reset request..."
        );


        console.log(
            "Email:",
            email
        );


        /* -------------------------------------------------
           DIRECT FETCH
        ------------------------------------------------- */

        const response =
            await fetch(
                "/api/auth/forgot-password",
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
                        JSON.stringify({

                            email:
                                email

                        })

                }
            );


        console.log(
            "Forgot password HTTP status:",
            response.status
        );


        /* -------------------------------------------------
           READ RESPONSE
        ------------------------------------------------- */

        let data = {};


        try {

            data =
                await response.json();

        }

        catch (jsonError) {

            console.error(
                "Invalid JSON response:",
                jsonError
            );

            showForgotError(
                "Server returned an invalid response."
            );

            setForgotLoading(
                button,
                false
            );

            return;
        }


        console.log(
            "Forgot password response:",
            data
        );


        /* -------------------------------------------------
           SERVER ERROR
        ------------------------------------------------- */

        if (!response.ok || data.ok === false) {

            showForgotError(

                data.message ||
                data.error ||
                "Unable to send reset code."

            );


            setForgotLoading(
                button,
                false
            );


            return;
        }


        /* -------------------------------------------------
           SAVE EMAIL
        ------------------------------------------------- */

        sessionStorage.setItem(
            "resetEmail",
            email
        );


        /* -------------------------------------------------
           SUCCESS
        ------------------------------------------------- */

        showForgotSuccess(
            data.message ||
            "A password reset code has been sent to your email."
        );


        setForgotLoading(
            button,
            false
        );


        /* -------------------------------------------------
           REDIRECT
        ------------------------------------------------- */

        setTimeout(
            function () {

                window.location.href =
                    "/reset-password";

            },
            1500
        );

    }


    catch (error) {

        console.error(
            "Forgot password request failed:",
            error
        );


        showForgotError(
            "Unable to connect to the server. Please try again."
        );


        setForgotLoading(
            button,
            false
        );

    }

}


/* =========================================================
   LOADING
========================================================= */

function setForgotLoading(
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


    console.error(
        message
    );

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


    console.log(
        message
    );

}


/* =========================================================
   CLEAR MESSAGES
========================================================= */

function clearForgotMessages() {

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

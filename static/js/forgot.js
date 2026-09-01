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


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        showForgotError(
            getResponseMessage(
                result,
                "Unable to process your request."
            )
        );

        return;

    }


    /*
     * Save email so reset.js can use it.
     */

    forgotState.email =
        email;


    sessionStorage.setItem(
        "resetEmail",
        email
    );


    showForgotSuccess(
        "If an account exists for this email, a password reset code has been sent."
    );


    setTimeout(() => {

        window.location.href =
            "/reset-password";

    }, 1200);

}


/* =========================================================
   ERROR
========================================================= */

function showForgotError(message) {

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
    }


    if (error) {

        error.hidden = false;

        error.textContent =
            message;

        return;

    }


    showToast(
        message,
        "error"
    );

}


/* =========================================================
   SUCCESS
========================================================= */

function showForgotSuccess(message) {

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
    }


    if (success) {

        success.hidden = false;

        success.textContent =
            message;

        return;

    }


    showToast(
        message,
        "success"
    );

}
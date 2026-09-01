"use strict";

/* =========================================================
   EMAIL VERIFICATION
========================================================= */

const verifyState = {
    email: sessionStorage.getItem("verificationEmail") || "",
    timer: null
};


document.addEventListener("DOMContentLoaded", () => {

    const page = document.getElementById("verificationPage");

    if (!page) {
        return;
    }

    initializeVerification();

});


/* =========================================================
   INITIALIZE
========================================================= */

function initializeVerification() {

    const emailInput =
        document.getElementById("verificationEmail");

    const emailDisplay =
        document.getElementById("verificationEmailDisplay");


    if (emailInput && verifyState.email) {
        emailInput.value = verifyState.email;
    }


    if (emailDisplay) {
        emailDisplay.textContent =
            verifyState.email || "";
    }


    const form =
        document.getElementById("verificationForm");

    if (form) {
        form.addEventListener(
            "submit",
            verifyEmail
        );
    }


    const resendButton =
        document.getElementById(
            "resendVerificationButton"
        );

    if (resendButton) {

        resendButton.addEventListener(
            "click",
            resendVerification
        );

    }


    setupCodeInputs();

    startVerificationTimer();

}


/* =========================================================
   VERIFY EMAIL
========================================================= */

async function verifyEmail(event) {

    event.preventDefault();


    const email =
        verifyState.email ||
        document
            .getElementById("verificationEmail")
            ?.value
            .trim()
            .toLowerCase();


    const code =
        getVerificationCode();


    if (!email) {

        showVerifyError(
            "Verification email is missing."
        );

        return;

    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        showVerifyError(
            "Please enter a valid email address."
        );

        return;

    }


    if (!/^\d{6}$/.test(code)) {

        showVerifyError(
            "Please enter the 6-digit verification code."
        );

        return;

    }


    const button =
        document.getElementById(
            "verifyEmailButton"
        );


    setButtonLoading(
        button,
        true,
        "Verifying..."
    );


    const result =
        await API.post(
            "/api/auth/verify-email",
            {
                email: email,
                code: code
            }
        );


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        showVerifyError(
            getResponseMessage(
                result,
                "Invalid or expired verification code."
            )
        );

        return;

    }


    sessionStorage.removeItem(
        "verificationEmail"
    );


    showVerifySuccess(
        "Email verified successfully!"
    );


    setTimeout(() => {

        window.location.href =
            "/login";

    }, 1200);

}


/* =========================================================
   RESEND
========================================================= */

async function resendVerification() {

    const email =
        verifyState.email ||
        document
            .getElementById("verificationEmail")
            ?.value
            .trim()
            .toLowerCase();


    if (!email) {

        showVerifyError(
            "Email address is missing."
        );

        return;

    }


    const button =
        document.getElementById(
            "resendVerificationButton"
        );


    if (button?.disabled) {
        return;
    }


    setButtonLoading(
        button,
        true,
        "Sending..."
    );


    const result =
        await API.post(
            "/api/auth/resend-verification",
            {
                email: email
            }
        );


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        showVerifyError(
            getResponseMessage(
                result,
                "Unable to resend verification code."
            )
        );

        return;

    }


    showVerifySuccess(
        "A new verification code has been sent to your email."
    );


    startVerificationTimer();

}


/* =========================================================
   CODE INPUTS
========================================================= */

function setupCodeInputs() {

    const inputs =
        document.querySelectorAll(
            ".verification-code-input"
        );


    if (!inputs.length) {
        return;
    }


    inputs.forEach((input, index) => {

        input.maxLength = 1;

        input.inputMode = "numeric";

        input.autocomplete =
            index === 0
                ? "one-time-code"
                : "off";


        input.addEventListener(
            "input",
            () => {

                input.value =
                    input.value
                        .replace(/\D/g, "")
                        .slice(0, 1);


                if (
                    input.value &&
                    index <
                    inputs.length - 1
                ) {

                    inputs[
                        index + 1
                    ].focus();

                }

            }
        );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Backspace" &&
                    !input.value &&
                    index > 0
                ) {

                    inputs[
                        index - 1
                    ].focus();

                }


                if (
                    event.key === "ArrowLeft" &&
                    index > 0
                ) {

                    inputs[
                        index - 1
                    ].focus();

                }


                if (
                    event.key === "ArrowRight" &&
                    index <
                    inputs.length - 1
                ) {

                    inputs[
                        index + 1
                    ].focus();

                }

            }
        );


        input.addEventListener(
            "paste",
            event => {

                event.preventDefault();


                const pasted =
                    (
                        event.clipboardData ||
                        window.clipboardData
                    )
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(
                        0,
                        inputs.length
                    );


                pasted
                    .split("")
                    .forEach(
                        (digit, digitIndex) => {

                            if (
                                inputs[digitIndex]
                            ) {

                                inputs[
                                    digitIndex
                                ].value =
                                    digit;

                            }

                        }
                    );


                const focusIndex =
                    Math.min(
                        pasted.length,
                        inputs.length - 1
                    );


                inputs[
                    focusIndex
                ]?.focus();

            }
        );

    });

}


/* =========================================================
   GET CODE
========================================================= */

function getVerificationCode() {

    const inputs =
        document.querySelectorAll(
            ".verification-code-input"
        );


    if (inputs.length) {

        return Array
            .from(inputs)
            .map(
                input =>
                    input.value
            )
            .join("");

    }


    return (
        document
            .getElementById(
                "verificationCode"
            )
            ?.value
            .replace(/\D/g, "")
        || ""
    );

}


/* =========================================================
   COUNTDOWN
========================================================= */

function startVerificationTimer() {

    clearInterval(
        verifyState.timer
    );


    let seconds = 60;


    const button =
        document.getElementById(
            "resendVerificationButton"
        );


    const counter =
        document.getElementById(
            "verificationCountdown"
        );


    if (button) {
        button.disabled = true;
    }


    function update() {

        if (counter) {

            counter.textContent =
                seconds > 0
                    ? `Resend code in ${seconds}s`
                    : "You can resend the code";

        }


        if (seconds <= 0) {

            clearInterval(
                verifyState.timer
            );


            if (button) {
                button.disabled = false;
            }


            return;

        }


        seconds--;

    }


    update();


    verifyState.timer =
        setInterval(
            update,
            1000
        );

}


/* =========================================================
   ERROR
========================================================= */

function showVerifyError(message) {

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

        error.textContent = message;

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

function showVerifySuccess(message) {

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

        success.textContent = message;

        return;

    }


    showToast(
        message,
        "success"
    );

}
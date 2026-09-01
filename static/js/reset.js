"use strict";

/* =========================================================
   RESET PASSWORD
========================================================= */

const resetState = {

    email:
        sessionStorage.getItem(
            "resetEmail"
        ) || "",

    timer: null

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const page =
            document.getElementById(
                "resetPasswordPage"
            );


        if (!page) {
            return;
        }


        initializeResetPassword();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeResetPassword() {

    const emailInput =
        document.getElementById(
            "resetEmail"
        );


    const emailDisplay =
        document.getElementById(
            "resetEmailDisplay"
        );


    if (
        emailInput &&
        resetState.email
    ) {

        emailInput.value =
            resetState.email;

    }


    if (
        emailDisplay
    ) {

        emailDisplay.textContent =
            resetState.email;

    }


    const form =
        document.getElementById(
            "resetPasswordForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            resetPassword
        );

    }


    const resend =
        document.getElementById(
            "resendResetButton"
        );


    if (resend) {

        resend.addEventListener(
            "click",
            resendResetCode
        );

    }


    setupResetCodeInputs();


    document
        .getElementById(
            "resetPassword"
        )
        ?.addEventListener(
            "input",
            updateResetPasswordStrength
        );


    document
        .getElementById(
            "resetConfirmPassword"
        )
        ?.addEventListener(
            "input",
            validateResetPasswords
        );


    startResetTimer();

}


/* =========================================================
   RESET PASSWORD
========================================================= */

async function resetPassword(event) {

    event.preventDefault();


    const email =
        resetState.email ||
        document
            .getElementById(
                "resetEmail"
            )
            ?.value
            .trim()
            .toLowerCase();


    const code =
        getResetCode();


    const password =
        document
            .getElementById(
                "resetPassword"
            )
            ?.value;


    const confirmPassword =
        document
            .getElementById(
                "resetConfirmPassword"
            )
            ?.value;


    if (!email) {

        showResetError(
            "Reset email is missing."
        );

        return;

    }


    if (!/^\d{6}$/.test(code)) {

        showResetError(
            "Please enter the 6-digit reset code."
        );

        return;

    }


    if (!isStrongPassword(password)) {

        showResetError(

            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."

        );

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        showResetError(
            "Passwords do not match."
        );

        return;

    }


    const button =
        document.getElementById(
            "resetPasswordButton"
        );


    setButtonLoading(
        button,
        true,
        "Resetting..."
    );


    const result =
        await API.post(
            "/api/auth/reset-password",
            {

                email: email,

                code: code,

                new_password:
                    password

            }
        );


    setButtonLoading(
        button,
        false
    );


    if (!result.ok) {

        showResetError(
            getResponseMessage(
                result,
                "Invalid or expired reset code."
            )
        );

        return;

    }


    sessionStorage.removeItem(
        "resetEmail"
    );


    showResetSuccess(
        "Password reset successfully!"
    );


    setTimeout(() => {

        window.location.href =
            "/login";

    }, 1200);

}


/* =========================================================
   RESEND RESET CODE
========================================================= */

async function resendResetCode() {

    const email =
        resetState.email ||
        document
            .getElementById(
                "resetEmail"
            )
            ?.value
            .trim()
            .toLowerCase();


    if (!email) {

        showResetError(
            "Email address is missing."
        );

        return;

    }


    const button =
        document.getElementById(
            "resendResetButton"
        );


    if (
        button?.disabled
    ) {

        return;

    }


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

        showResetError(
            getResponseMessage(
                result,
                "Unable to send reset code."
            )
        );

        return;

    }


    showResetSuccess(
        "A new password reset code has been sent."
    );


    startResetTimer();

}


/* =========================================================
   CODE INPUTS
========================================================= */

function setupResetCodeInputs() {

    const inputs =
        document.querySelectorAll(
            ".reset-code-input"
        );


    if (!inputs.length) {
        return;
    }


    inputs.forEach(
        (
            input,
            index
        ) => {

            input.maxLength = 1;

            input.inputMode = "numeric";


            input.addEventListener(
                "input",
                () => {

                    input.value =
                        input.value
                            .replace(
                                /\D/g,
                                ""
                            )
                            .slice(
                                0,
                                1
                            );


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
                        event.key ===
                        "Backspace" &&
                        !input.value &&
                        index > 0
                    ) {

                        inputs[
                            index - 1
                        ].focus();

                    }


                    if (
                        event.key ===
                        "ArrowLeft" &&
                        index > 0
                    ) {

                        inputs[
                            index - 1
                        ].focus();

                    }


                    if (
                        event.key ===
                        "ArrowRight" &&
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
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            inputs.length
                        );


                    pasted
                        .split("")
                        .forEach(
                            (
                                digit,
                                digitIndex
                            ) => {

                                if (
                                    inputs[
                                        digitIndex
                                    ]
                                ) {

                                    inputs[
                                        digitIndex
                                    ].value =
                                        digit;

                                }

                            }
                        );


                    const next =
                        Math.min(
                            pasted.length,
                            inputs.length - 1
                        );


                    inputs[
                        next
                    ]?.focus();

                }
            );

        }
    );

}


/* =========================================================
   GET RESET CODE
========================================================= */

function getResetCode() {

    const inputs =
        document.querySelectorAll(
            ".reset-code-input"
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
                "resetCode"
            )
            ?.value
            .replace(
                /\D/g,
                ""
            ) ||
        ""
    );

}


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

function updateResetPasswordStrength(
    event
) {

    const password =
        event.target.value;


    const element =
        document.getElementById(
            "resetPasswordStrength"
        );


    if (!element) {
        return;
    }


    if (!password) {

        element.textContent =
            "";

        return;

    }


    let score = 0;


    if (
        password.length >= 8
    ) {
        score++;
    }


    if (
        /[A-Z]/.test(password)
    ) {
        score++;
    }


    if (
        /[a-z]/.test(password)
    ) {
        score++;
    }


    if (
        /[0-9]/.test(password)
    ) {
        score++;
    }


    if (
        /[^A-Za-z0-9]/.test(password)
    ) {
        score++;
    }


    if (score <= 2) {

        element.textContent =
            "Weak";

        element.className =
            "password-strength weak";

    }

    else if (score === 3) {

        element.textContent =
            "Good";

        element.className =
            "password-strength good";

    }

    else {

        element.textContent =
            "Strong";

        element.className =
            "password-strength strong";

    }

}


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function isStrongPassword(
    password
) {

    return (

        typeof password ===
        "string"

        &&

        password.length >=
        8

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
   PASSWORD MATCH
========================================================= */

function validateResetPasswords() {

    const password =
        document
            .getElementById(
                "resetPassword"
            )
            ?.value;


    const confirm =
        document
            .getElementById(
                "resetConfirmPassword"
            );


    if (!confirm) {
        return;
    }


    if (
        confirm.value &&
        confirm.value !==
        password
    ) {

        confirm.setCustomValidity(
            "Passwords do not match."
        );

    }

    else {

        confirm.setCustomValidity(
            ""
        );

    }

}


/* =========================================================
   RESET TIMER
========================================================= */

function startResetTimer() {

    clearInterval(
        resetState.timer
    );


    let seconds = 60;


    const button =
        document.getElementById(
            "resendResetButton"
        );


    const counter =
        document.getElementById(
            "resetCountdown"
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
                resetState.timer
            );


            if (button) {
                button.disabled = false;
            }


            return;

        }


        seconds--;

    }


    update();


    resetState.timer =
        setInterval(
            update,
            1000
        );

}


/* =========================================================
   ERROR
========================================================= */

function showResetError(
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

function showResetSuccess(
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
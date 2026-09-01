"use strict";

/* =========================================================
   AUTHENTICATION
   Signup + Login
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeSignup();

    initializeLogin();

});


/* =========================================================
   SIGNUP
========================================================= */

function initializeSignup() {

    const form =
        document.getElementById("signupForm");

    if (!form) {
        return;
    }

    console.log("Signup form initialized");


    form.addEventListener(
        "submit",
        handleSignup
    );

}


/* =========================================================
   HANDLE SIGNUP
========================================================= */

async function handleSignup(event) {

    /*
     * THIS IS CRITICAL.
     *
     * It prevents:
     *
     * GET /signup?name=...&password=...
     */

    event.preventDefault();

    event.stopPropagation();


    console.log("Signup form submitted");


    const name =
        document
            .getElementById("name")
            ?.value
            .trim();


    const username =
        document
            .getElementById("username")
            ?.value
            .trim();


    const email =
        document
            .getElementById("email")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("password")
            ?.value;


    const confirmPassword =
        document
            .getElementById("confirmPassword")
            ?.value;


    const terms =
        document
            .getElementById("terms")
            ?.checked;


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name) {

        showAuthError(
            "Please enter your full name."
        );

        return;

    }


    if (!username) {

        showAuthError(
            "Please enter a username."
        );

        return;

    }


    if (!/^[A-Za-z0-9_.]{3,30}$/.test(username)) {

        showAuthError(
            "Username must contain 3-30 letters, numbers, underscores or dots."
        );

        return;

    }


    if (
        !email ||
        !isValidEmail(email)
    ) {

        showAuthError(
            "Please enter a valid email address."
        );

        return;

    }


    if (!isStrongPassword(password)) {

        showAuthError(
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number."
        );

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        showAuthError(
            "Passwords do not match."
        );

        return;

    }


    if (!terms) {

        showAuthError(
            "Please accept the Terms and Privacy Policy."
        );

        return;

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    const button =
        document.getElementById(
            "signupButton"
        );


    setButtonLoading(
        button,
        true,
        "Creating Account..."
    );


    /* =====================================================
       API REQUEST
    ===================================================== */

    console.log(
        "Sending signup request..."
    );


    const result =
        await API.post(
            "/api/auth/signup",
            {

                name: name,

                username: username,

                email: email,

                password: password,

                confirmPassword:
                    confirmPassword,

                terms: true

            }
        );


    setButtonLoading(
        button,
        false
    );


    console.log(
        "Signup response:",
        result
    );


    /* =====================================================
       ERROR
    ===================================================== */

    if (!result.ok) {

        showAuthError(
            getResponseMessage(
                result,
                "Unable to create your account."
            )
        );

        return;

    }


    /* =====================================================
       SAVE EMAIL FOR VERIFICATION
    ===================================================== */

    sessionStorage.setItem(
        "verificationEmail",
        email
    );


    /* =====================================================
       SUCCESS
    ===================================================== */

    showAuthSuccess(
        "Account created successfully. Check your email for the verification code."
    );


    /* =====================================================
       REDIRECT
    ===================================================== */

    setTimeout(
        () => {

            window.location.href =
                "/verify-email";

        },
        1000
    );

}


/* =========================================================
   LOGIN
========================================================= */

function initializeLogin() {

    const form = document.getElementById("loginForm");

    if (!form) {
        console.log("Login form not found");
        return;
    }

    console.log("Login form initialized");

    form.addEventListener("submit", handleLogin);
}


async function handleLogin(event) {

    event.preventDefault();
    event.stopPropagation();

    console.log("LOGIN BUTTON CLICKED");

    const loginInput =
        document.getElementById("login");

    const passwordInput =
        document.getElementById("password");

    const rememberInput =
        document.getElementById("remember");

    if (!loginInput || !passwordInput) {

        console.error(
            "Login inputs not found."
        );

        return;
    }

    const login =
        loginInput.value.trim();

    const password =
        passwordInput.value;

    const remember =
        rememberInput
            ? rememberInput.checked
            : false;


    if (!login) {

        showAuthError(
            "Please enter your email or username."
        );

        return;
    }


    if (!password) {

        showAuthError(
            "Please enter your password."
        );

        return;
    }


    const button =
        document.getElementById("loginButton");


    if (button) {
        button.disabled = true;
    }


    try {

        console.log(
            "Sending login request..."
        );


        /*
         * Your current Flask API expects email.
         *
         * If the user entered an email,
         * send it directly.
         */

        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({

                    email:
                        login.toLowerCase(),

                    password:
                        password,

                    remember:
                        remember

                })
            }
        );


        console.log(
            "HTTP status:",
            response.status
        );


        const result =
            await response.json();


        console.log(
            "Login response:",
            result
        );


        if (!response.ok || !result.ok) {

            showAuthError(
                result.message ||
                "Login failed."
            );


            if (
                result.requires_verification ||
                result.email_not_verified
            ) {

                sessionStorage.setItem(
                    "verificationEmail",
                    login.toLowerCase()
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "/verify-email";

                    },
                    1200
                );

            }


            return;
        }


        console.log(
            "LOGIN SUCCESS"
        );


        window.location.href =
            result.redirect ||
            "/dashboard";


    }
    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showAuthError(
            "Unable to connect to the server."
        );

    }
    finally {

        if (button) {
            button.disabled = false;
        }

    }
}
/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthError(message) {

    const element =
        document.getElementById("authMessage");

    if (!element) {
        console.error("authMessage element not found:", message);
        return;
    }

    element.textContent = message;

    element.className =
        "auth-message error-message";

    element.hidden = false;

    element.style.display = "block";
}


/* =========================================================
   AUTH SUCCESS
========================================================= */

function showAuthSuccess(message) {

    const element =
        document.getElementById("authMessage");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;

    element.className =
        "auth-message success-message";

    element.hidden = false;

    element.style.display = "block";
}
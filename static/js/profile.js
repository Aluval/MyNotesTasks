/* =========================================================
   MyNotes & Tasks
   PROFILE JAVASCRIPT
   =========================================================

   Handles:
   - Load current user
   - Display profile
   - Update profile
   - Workspace statistics
   - Email verification status
   - Change password
   - Profile photo preview/upload/remove
   - Password visibility
   - Logout
   - Mobile sidebar
   - Toast messages
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const profileState = {

    user: null,

    stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalNotes: 0
    },

    selectedPhoto: null

};


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const profilePage =
            document.getElementById("profilePage");

        /*
         * If this page doesn't contain profilePage,
         * don't run profile JavaScript.
         *
         * If your HTML does not have profilePage,
         * we still continue because this is the profile page.
         */

        initializeSidebar();

        initializeProfileForm();

        initializePasswordModal();

        initializeLogout();

        initializePasswordToggles();

        initializeProfilePhoto();

        initializeBioCounter();

        initializeGoogleCalendar();

        await loadProfile();

        await loadGoogleCalendarStatus();

    }
);

// ============================================================
// GOOGLE CALENDAR STATUS
// ============================================================

async function loadGoogleCalendarStatus() {

    const statusText =
        document.getElementById(
            "googleCalendarStatusText"
        );

    const connectButton =
        document.getElementById(
            "googleCalendarConnectButton"
        );

    const disconnectButton =
        document.getElementById(
            "googleCalendarDisconnectButton"
        );


    if (
        !statusText ||
        !connectButton ||
        !disconnectButton
    ) {

        console.error(
            "Google Calendar UI elements not found."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/api/google/status",
                {
                    method: "GET",
                    credentials: "same-origin"
                }
            );


        const data =
            await response.json();


        console.log(
            "GOOGLE CALENDAR STATUS:",
            data
        );


        if (
            data.ok === true &&
            data.connected === true
        ) {

            // --------------------------------------------
            // CONNECTED
            // --------------------------------------------

            statusText.textContent =
                "Connected ✓";


            // Hide Connect

            connectButton.classList.add(
                "hidden"
            );


            // Show Disconnect

            disconnectButton.classList.remove(
                "hidden"
            );


        } else {

            // --------------------------------------------
            // NOT CONNECTED
            // --------------------------------------------

            statusText.textContent =
                "Not connected";


            connectButton.classList.remove(
                "hidden"
            );


            disconnectButton.classList.add(
                "hidden"
            );

        }


    } catch (error) {

        console.error(
            "GOOGLE CALENDAR STATUS ERROR:",
            error
        );

        statusText.textContent =
            "Unable to check connection.";

    }

}

function initializeGoogleCalendar() {

    const connectButton =
        document.getElementById(
            "googleCalendarConnectButton"
        );

    const disconnectButton =
        document.getElementById(
            "googleCalendarDisconnectButton"
        );

    connectButton?.addEventListener(
        "click",
        () => {

            console.log(
                "Google Calendar Connect clicked"
            );

            window.location.href =
                "/api/google/connect";

        }
    );

    disconnectButton?.addEventListener(
        "click",
        async () => {

            try {

                const response =
                    await apiRequest(
                        "/api/google/disconnect",
                        {
                            method: "POST"
                        }
                    );


                if (
                    response &&
                    response.ok
                ) {

                    showToast(
                        "Google Calendar disconnected.",
                        "success"
                    );

                    await loadGoogleCalendarStatus();

                }

            } catch (error) {

                console.error(
                    "Google Calendar disconnect error:",
                    error
                );

            }

        }
    );

}

/* =========================================================
   SIDEBAR
========================================================= */

function initializeSidebar() {

    const sidebar =
        document.getElementById("appSidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const openButton =
        document.getElementById("openSidebar");

    const closeButton =
        document.getElementById("closeSidebar");


    if (openButton) {

        openButton.addEventListener(
            "click",
            function () {

                sidebar?.classList.add("open");

                overlay?.classList.add("active");

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSidebar
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    function closeSidebar() {

        sidebar?.classList.remove("open");

        overlay?.classList.remove("active");

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    console.log(
        "Loading current user profile..."
    );


    try {

        const result =
            await API.get(
                "/api/auth/me"
            );


        console.log(
            "Profile API response:",
            result
        );


        if (!result.ok) {

            showProfileMessage(
                getResponseMessage(
                    result,
                    "Unable to load your profile."
                ),
                "error"
            );

            /*
             * If session expired, return to login.
             */

            if (
                result.status === 401 ||
                result.status === 403
            ) {

                setTimeout(
                    function () {

                        window.location.href =
                            "/login";

                    },
                    1200
                );

            }

            return;

        }


        /*
         * Support both:
         *
         * {
         *   user: {...}
         * }
         *
         * and:
         *
         * {...}
         */


        profileState.user =
            result.user ||
            result.data?.user ||
            result.data ||
            {};


        console.log(
            "Current user:",
            profileState.user
        );


        renderUserProfile(
            profileState.user
        );


        await loadProfileStats();

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showProfileMessage(
            "Unable to connect to the server.",
            "error"
        );

    }

}


/* =========================================================
   RENDER USER PROFILE
========================================================= */

function renderUserProfile(
    user
) {

    if (!user) {
        return;
    }


    const name =
        user.name ||
        user.username ||
        "User";


    const username =
        user.username ||
        "";


    const email =
        user.email ||
        "";


    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    setText(
        "profileDisplayName",
        name
    );


    setText(
        "profileDisplayUsername",
        username
            ? `@${username}`
            : "@username"
    );


    setText(
        "profileEmail",
        email
    );


    setText(
        "memberSince",
        user.created_at
            ? `Member since ${formatDate(user.created_at)}`
            : "Member since —"
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
       FORM
    ----------------------------------------------------- */

    setInputValue(
        "profileName",
        name
    );


    setInputValue(
        "profileUsername",
        username
    );


    setInputValue(
        "profileEmailInput",
        email
    );


    setInputValue(
        "profilePhone",
        user.phone || ""
    );


    setInputValue(
        "profileBio",
        user.bio || ""
    );


    setInputValue(
        "profileTimezone",
        user.timezone ||
        Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone
    );


    setInputValue(
        "profileDateFormat",
        user.date_format ||
        "DD/MM/YYYY"
    );


    setInputValue(
        "profileTheme",
        user.theme ||
        "system"
    );


    /* -----------------------------------------------------
       EMAIL VERIFICATION
    ----------------------------------------------------- */

    const verified =
        Boolean(
            user.email_verified
        );


    updateVerificationUI(
        verified,
        email
    );


    /* -----------------------------------------------------
       PROFILE PHOTO
    ----------------------------------------------------- */

    const photo =
        user.profile_photo ||
        user.avatar ||
        null;


    if (photo) {

        setProfilePhoto(
            photo
        );

    }
    else {

        generateProfileInitials(
            user
        );

    }


    updateSidebarAvatar(
        user
    );

}


/* =========================================================
   VERIFICATION UI
========================================================= */

function updateVerificationUI(
    verified,
    email
) {

    const verifiedBadge =
        document.getElementById(
            "emailVerifiedBadge"
        );


    const unverifiedBadge =
        document.getElementById(
            "emailUnverifiedBadge"
        );


    const inputStatus =
        document.getElementById(
            "profileEmailInputStatus"
        );


    const securityText =
        document.getElementById(
            "securityEmailText"
        );


    const verifyLink =
        document.getElementById(
            "resendVerificationLink"
        );


    const securityBadge =
        document.getElementById(
            "verifiedSecurityBadge"
        );


    if (verified) {

        verifiedBadge?.classList.remove(
            "hidden"
        );


        unverifiedBadge?.classList.add(
            "hidden"
        );


        if (inputStatus) {

            inputStatus.textContent =
                "Verified";

        }


        if (securityText) {

            securityText.textContent =
                "Your email address is verified.";

        }


        verifyLink?.classList.add(
            "hidden"
        );


        securityBadge?.classList.remove(
            "hidden"
        );

    }
    else {

        verifiedBadge?.classList.add(
            "hidden"
        );


        unverifiedBadge?.classList.remove(
            "hidden"
        );


        if (inputStatus) {

            inputStatus.textContent =
                "Not Verified";

        }


        if (securityText) {

            securityText.textContent =
                "Your email address is not verified.";

        }


        if (verifyLink) {

            verifyLink.classList.remove(
                "hidden"
            );


            /*
             * Keep email available for verify page.
             */

            verifyLink.addEventListener(
                "click",
                function () {

                    if (email) {

                        sessionStorage.setItem(
                            "verificationEmail",
                            email
                        );

                    }

                }
            );

        }


        securityBadge?.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   PROFILE FORM
========================================================= */

function initializeProfileForm() {

    const form =
        document.getElementById(
            "profileForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        updateProfile
    );

}


/* =========================================================
   UPDATE PROFILE
========================================================= */

async function updateProfile(
    event
) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "profileName"
            )
            ?.value
            .trim();


    const phone =
        document
            .getElementById(
                "profilePhone"
            )
            ?.value
            .trim();


    const bio =
        document
            .getElementById(
                "profileBio"
            )
            ?.value
            .trim();


    const timezone =
        document
            .getElementById(
                "profileTimezone"
            )
            ?.value
            .trim();


    const dateFormat =
        document
            .getElementById(
                "profileDateFormat"
            )
            ?.value;


    const theme =
        document
            .getElementById(
                "profileTheme"
            )
            ?.value;


    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!name) {

        showProfileMessage(
            "Please enter your full name.",
            "error"
        );

        return;

    }


    if (name.length > 80) {

        showProfileMessage(
            "Full name cannot exceed 80 characters.",
            "error"
        );

        return;

    }


    if (
        phone &&
        !isValidPhone(phone)
    ) {

        showProfileMessage(
            "Please enter a valid phone number.",
            "error"
        );

        return;

    }


    if (bio.length > 500) {

        showProfileMessage(
            "Bio cannot exceed 500 characters.",
            "error"
        );

        return;

    }


    const payload = {

        name: name,

        phone: phone,

        bio: bio,

        timezone: timezone,

        date_format: dateFormat,

        theme: theme

    };


    const button =
        document.getElementById(
            "saveProfileButton"
        );


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const result =
            await API.put(
                "/api/profile",
                payload
            );


        console.log(
            "Update profile response:",
            result
        );


        if (!result.ok) {

            showProfileMessage(
                getResponseMessage(
                    result,
                    "Unable to update profile."
                ),
                "error"
            );

            return;

        }


        profileState.user =
            result.user ||
            result.data?.user ||
            {
                ...profileState.user,
                ...payload
            };


        renderUserProfile(
            profileState.user
        );


        showProfileMessage(
            "Profile updated successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Update profile error:",
            error
        );


        showProfileMessage(
            "Unable to connect to the server.",
            "error"
        );

    }

    finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =========================================================
   LOAD STATISTICS
========================================================= */

async function loadProfileStats() {

    try {

        const result =
            await API.get(
                "/api/dashboard/stats"
            );


        console.log(
            "Statistics response:",
            result
        );


        if (!result.ok) {

            console.warn(
                "Unable to load statistics."
            );

            return;

        }


        const stats =
            result.stats ||
            result.data?.stats ||
            result.data ||
            {};


        profileState.stats = {

            totalTasks:
                Number(
                    stats.total_tasks ??
                    stats.totalTasks ??
                    0
                ),

            completedTasks:
                Number(
                    stats.completed_tasks ??
                    stats.completedTasks ??
                    0
                ),

            pendingTasks:
                Number(
                    stats.pending_tasks ??
                    stats.pendingTasks ??
                    0
                ),

            totalNotes:
                Number(
                    stats.total_notes ??
                    stats.totalNotes ??
                    0
                )

        };


        renderProfileStats();

    }

    catch (error) {

        console.error(
            "Statistics error:",
            error
        );

    }

}


/* =========================================================
   RENDER STATISTICS
========================================================= */

function renderProfileStats() {

    const stats =
        profileState.stats;


    /*
     * These IDs match your current profile.html.
     */

    updateCounter(
        "profileNotesCount",
        stats.totalNotes
    );


    updateCounter(
        "profileTasksCount",
        stats.totalTasks
    );


    updateCounter(
        "profileCompletedCount",
        stats.completedTasks
    );


    updateCounter(
        "profilePendingCount",
        stats.pendingTasks
    );

}


/* =========================================================
   CHANGE PASSWORD MODAL
========================================================= */

function initializePasswordModal() {

    const openButton =
        document.getElementById(
            "changePasswordButton"
        );


    const modal =
        document.getElementById(
            "changePasswordModal"
        );


    const closeButton =
        document.getElementById(
            "closePasswordModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelPasswordChange"
        );


    const form =
        document.getElementById(
            "changePasswordForm"
        );


    openButton?.addEventListener(
        "click",
        function () {

            modal?.classList.remove(
                "hidden"
            );

        }
    );


    closeButton?.addEventListener(
        "click",
        closePasswordModal
    );


    cancelButton?.addEventListener(
        "click",
        closePasswordModal
    );


    modal?.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closePasswordModal();

            }

        }
    );


    form?.addEventListener(
        "submit",
        changePassword
    );


    function closePasswordModal() {

        modal?.classList.add(
            "hidden"
        );

        form?.reset();

        const message =
            document.getElementById(
                "passwordMessage"
            );

        if (message) {

            message.textContent =
                "";

            message.className =
                "auth-message";

        }

    }

}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

async function changePassword(
    event
) {

    event.preventDefault();


    const currentPassword =
        document
            .getElementById(
                "currentPassword"
            )
            ?.value;


    const newPassword =
        document
            .getElementById(
                "newPassword"
            )
            ?.value;


    const confirmPassword =
        document
            .getElementById(
                "confirmNewPassword"
            )
            ?.value;


    if (!currentPassword) {

        showPasswordMessage(
            "Enter your current password.",
            "error"
        );

        return;

    }


    if (!isStrongPassword(newPassword)) {

        showPasswordMessage(
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
            "error"
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showPasswordMessage(
            "New passwords do not match.",
            "error"
        );

        return;

    }


    if (
        currentPassword ===
        newPassword
    ) {

        showPasswordMessage(
            "New password must be different from your current password.",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "savePasswordButton"
        );


    setButtonLoading(
        button,
        true,
        "Changing..."
    );


    try {

        const result =
            await API.post(
                "/api/auth/change-password",
                {
                    current_password:
                        currentPassword,

                    new_password:
                        newPassword
                }
            );


        console.log(
            "Change password response:",
            result
        );


        if (!result.ok) {

            showPasswordMessage(
                getResponseMessage(
                    result,
                    "Unable to change password."
                ),
                "error"
            );

            return;

        }


        showPasswordMessage(
            "Password changed successfully.",
            "success"
        );


        document
            .getElementById(
                "changePasswordForm"
            )
            ?.reset();


        setTimeout(
            function () {

                document
                    .getElementById(
                        "changePasswordModal"
                    )
                    ?.classList.add(
                        "hidden"
                    );

            },
            1000
        );

    }

    catch (error) {

        console.error(
            "Change password error:",
            error
        );


        showPasswordMessage(
            "Unable to connect to the server.",
            "error"
        );

    }

    finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function initializePasswordToggles() {

    document
        .querySelectorAll(
            ".password-toggle"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const targetId =
                            button.dataset.target ||
                            button.dataset.passwordToggle;


                        if (!targetId) {
                            return;
                        }


                        const input =
                            document.getElementById(
                                targetId
                            );


                        if (!input) {
                            return;
                        }


                        if (
                            input.type ===
                            "password"
                        ) {

                            input.type =
                                "text";

                            button.textContent =
                                "Hide";

                        }
                        else {

                            input.type =
                                "password";

                            button.textContent =
                                "Show";

                        }

                    }
                );

            }
        );

}


/* =========================================================
   PROFILE PHOTO
========================================================= */

function initializeProfilePhoto() {

    const input =
        document.getElementById(
            "profilePhotoInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        handleProfilePhoto
    );

}


/* =========================================================
   HANDLE PHOTO
========================================================= */

function handleProfilePhoto(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showToast(
            "Profile photo must be smaller than 5 MB.",
            "error"
        );

        event.target.value =
            "";

        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showToast(
            "Please select an image file.",
            "error"
        );

        event.target.value =
            "";

        return;

    }


    profileState.selectedPhoto =
        file;


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            setProfilePhoto(
                event.target.result
            );

        };


    reader.readAsDataURL(
        file
    );


    uploadProfilePhoto(
        file
    );

}


/* =========================================================
   UPLOAD PHOTO
========================================================= */

async function uploadProfilePhoto(
    file
) {

    const formData =
        new FormData();


    formData.append(
        "photo",
        file
    );


    try {

        const result =
            await API.postFormData(
                "/api/profile/photo",
                formData
            );


        console.log(
            "Photo upload response:",
            result
        );


        if (!result.ok) {

            showToast(
                getResponseMessage(
                    result,
                    "Unable to upload profile photo."
                ),
                "error"
            );

            return;

        }


        const photo =
            result.data?.profile_photo ||
            result.data?.avatar;


        if (photo) {

            setProfilePhoto(
                photo
            );

        }


        showToast(
            "Profile photo updated.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Photo upload error:",
            error
        );


        showToast(
            "Unable to upload profile photo.",
            "error"
        );

    }

}


/* =========================================================
   SET PROFILE PHOTO
========================================================= */

function setProfilePhoto(
    src
) {

    if (!src) {
        return;
    }


    /*
     * Large profile avatar
     */

    const largeAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (largeAvatar) {

        largeAvatar.innerHTML = `
            <img
                src="${escapeHTML(src)}"
                alt="Profile photo"
            >
        `;

    }


    /*
     * Sidebar avatar
     */

    const sidebarAvatar =
        document.getElementById(
            "sidebarAvatar"
        );


    if (sidebarAvatar) {

        sidebarAvatar.innerHTML = `
            <img
                src="${escapeHTML(src)}"
                alt="Profile photo"
            >
        `;

    }

}


/* =========================================================
   GENERATE INITIALS
========================================================= */

function generateProfileInitials(
    user
) {

    const name =
        user?.name ||
        user?.username ||
        "User";


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    let initials = "U";


    if (
        words.length >= 2
    ) {

        initials =
            words[0].charAt(0) +
            words[1].charAt(0);

    }
    else if (
        words.length === 1
    ) {

        initials =
            words[0]
                .substring(
                    0,
                    2
                );

    }


    initials =
        initials.toUpperCase();


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (profileAvatar) {

        profileAvatar.textContent =
            initials;

    }


    updateSidebarAvatar(
        user
    );

}


/* =========================================================
   SIDEBAR AVATAR
========================================================= */

function updateSidebarAvatar(
    user
) {

    const avatar =
        document.getElementById(
            "sidebarAvatar"
        );


    if (!avatar) {
        return;
    }


    const name =
        user?.name ||
        user?.username ||
        "User";


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    let initials = "U";


    if (
        words.length >= 2
    ) {

        initials =
            words[0].charAt(0) +
            words[1].charAt(0);

    }
    else if (
        words.length === 1
    ) {

        initials =
            words[0].substring(
                0,
                2
            );

    }


    avatar.textContent =
        initials.toUpperCase();

}


/* =========================================================
   REMOVE PHOTO
========================================================= */

async function removeProfilePhoto() {

    const confirmed =
        window.confirm(
            "Remove your profile photo?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await API.delete(
                "/api/profile/photo"
            );


        if (!result.ok) {

            showToast(
                getResponseMessage(
                    result,
                    "Unable to remove profile photo."
                ),
                "error"
            );

            return;

        }


        profileState.selectedPhoto =
            null;


        generateProfileInitials(
            profileState.user
        );


        const input =
            document.getElementById(
                "profilePhotoInput"
            );


        if (input) {

            input.value =
                "";

        }


        showToast(
            "Profile photo removed.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Remove photo error:",
            error
        );


        showToast(
            "Unable to remove profile photo.",
            "error"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

    /*
     * Your HTML currently has BOTH:
     *
     * logoutButton
     * profileLogoutButton
     *
     * Support both.
     */

    const buttons = [

        document.getElementById(
            "logoutButton"
        ),

        document.getElementById(
            "profileLogoutButton"
        )

    ].filter(Boolean);


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                logout
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout from your account?"
        );


    if (!confirmed) {
        return;
    }


    const buttons = [

        document.getElementById(
            "logoutButton"
        ),

        document.getElementById(
            "profileLogoutButton"
        )

    ].filter(Boolean);


    buttons.forEach(
        function (button) {

            button.disabled =
                true;

        }
    );


    try {

        const result =
            await API.post(
                "/api/auth/logout"
            );


        console.log(
            "Logout response:",
            result
        );


        /*
         * Redirect even if session already expired.
         */

        if (
            result.ok ||
            result.status === 401 ||
            result.status === 403
        ) {

            window.location.href =
                "/login";

            return;

        }


        showToast(
            getResponseMessage(
                result,
                "Unable to logout."
            ),
            "error"
        );

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );


        /*
         * If server connection fails,
         * still return user to login.
         */

        window.location.href =
            "/login";

    }

    finally {

        buttons.forEach(
            function (button) {

                button.disabled =
                    false;

            }
        );

    }

}


/* =========================================================
   BIO COUNTER
========================================================= */

function initializeBioCounter() {

    const bio =
        document.getElementById(
            "profileBio"
        );


    const counter =
        document.getElementById(
            "profileBioCount"
        );


    if (!bio || !counter) {
        return;
    }


    function update() {

        counter.textContent =
            `${bio.value.length}/500`;

    }


    bio.addEventListener(
        "input",
        update
    );


    update();

}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

}


/* ---------------------------------------------------------
   INPUT VALUE
--------------------------------------------------------- */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.value =
        value ?? "";

}


/* ---------------------------------------------------------
   COUNTER
--------------------------------------------------------- */

function updateCounter(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        Number(value || 0);

}


/* ---------------------------------------------------------
   DATE
--------------------------------------------------------- */

function formatDate(
    value
) {

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
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ---------------------------------------------------------
   PHONE
--------------------------------------------------------- */

function isValidPhone(
    phone
) {

    return /^[+]?[0-9\s()-]{7,20}$/
        .test(phone);

}


/* ---------------------------------------------------------
   PASSWORD
--------------------------------------------------------- */

function isStrongPassword(
    password
) {

    if (
        !password ||
        password.length < 8
    ) {

        return false;

    }


    return (
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
    );

}


/* ---------------------------------------------------------
   BUTTON LOADING
--------------------------------------------------------- */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    const text =
        button.querySelector(
            "span"
        );


    if (
        loading &&
        loadingText &&
        text
    ) {

        text.textContent =
            loadingText;

    }

}


/* ---------------------------------------------------------
   PROFILE MESSAGE
--------------------------------------------------------- */

function showProfileMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "profileMessage"
        );


    if (!element) {

        showToast(
            message,
            type
        );

        return;

    }


    element.textContent =
        message;


    element.className =
        `auth-message ${
            type === "success"
                ? "success-message"
                : "error-message"
        }`;

}


/* ---------------------------------------------------------
   PASSWORD MESSAGE
--------------------------------------------------------- */

function showPasswordMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "passwordMessage"
        );


    if (!element) {

        showToast(
            message,
            type
        );

        return;

    }


    element.textContent =
        message;


    element.className =
        `auth-message ${
            type === "success"
                ? "success-message"
                : "error-message"
        }`;

}


/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */

function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        function () {

            toast.classList.add(
                "toast-hide"
            );

            setTimeout(
                function () {

                    toast.remove();

                },
                300
            );

        },
        3000
    );

}


/* ---------------------------------------------------------
   RESPONSE MESSAGE
--------------------------------------------------------- */

function getResponseMessage(
    result,
    fallback
) {

    return (
        result?.message ||
        result?.data?.message ||
        result?.error ||
        fallback
    );

}


/* ---------------------------------------------------------
   ESCAPE HTML
--------------------------------------------------------- */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value ?? "");


    return div.innerHTML;

}
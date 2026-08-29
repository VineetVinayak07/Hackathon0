/* =========================================================
   SPOTFIX — PROFILE.JS

   Handles:
   - Logged-in user information
   - Profile photo
   - Report statistics
   - Edit profile
   - Notifications / privacy / support placeholders
   - Sign out
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const SESSION_KEY = "spotFixSession";
const ACCOUNT_KEY = "spotFixAccounts";
const REPORTS_KEY = "spotFixReports";
const AVATAR_KEY = "spotFixAvatar";


/* =========================================================
   SESSION
========================================================= */

function getSession() {

    try {

        return JSON.parse(
            localStorage.getItem(SESSION_KEY)
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   ACCOUNT STORAGE
========================================================= */

function getAccounts() {

    try {

        const accounts =
            JSON.parse(
                localStorage.getItem(
                    ACCOUNT_KEY
                )
            );

        return Array.isArray(accounts)
            ? accounts
            : [];

    } catch (error) {

        return [];

    }

}


function saveAccounts(accounts) {

    localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify(accounts)
    );

}


/* =========================================================
   REPORT STORAGE
========================================================= */

function getReports() {

    try {

        const reports =
            JSON.parse(
                localStorage.getItem(
                    REPORTS_KEY
                )
            );

        return Array.isArray(reports)
            ? reports
            : [];

    } catch (error) {

        return [];

    }

}


/* =========================================================
   GET MY REPORTS
========================================================= */

function getMyReports() {

    const session =
        getSession();


    if (!session) {

        return [];

    }


    return getReports().filter(
        function(report) {

            return (
                report.reporterEmail ===
                session.email
            );

        }
    );

}


/* =========================================================
   LOAD PROFILE DATA
========================================================= */

function loadProfile() {

    const session =
        getSession();


    /*
       No logged-in user?
       Return to login.
    */

    if (!session) {

        window.location.href =
            "login.html";

        return;

    }


    /*
       Name
    */

    const name =
        document.getElementById(
            "profileName"
        );


    if (name) {

        name.textContent =
            session.name || "Citizen User";

    }


    /*
       Email
    */

    const email =
        document.getElementById(
            "profileEmail"
        );


    if (email) {

        email.textContent =
            session.email || "";

    }


    /*
       Initials
    */

    const initials =
        document.getElementById(
            "avatarInitials"
        );


    if (initials) {

        initials.textContent =
            getInitials(
                session.name ||
                "Citizen User"
            );

    }


    /*
       Reports
    */

    updateStatistics();

    /*
       Saved avatar
    */

    loadSavedAvatar();

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        parts.length === 0
    ) {

        return "C";

    }


    if (
        parts.length === 1
    ) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    return (
        parts[0].charAt(0) +
        parts[
            parts.length - 1
        ].charAt(0)
    ).toUpperCase();

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const reports =
        getMyReports();


    const total =
        reports.length;


    const resolved =
        reports.filter(
            function(report) {

                return (
                    report.status ===
                    "resolved"
                );

            }
        ).length;


    /*
       Simple demo points system.

       Each submitted report:
       +10 points

       Each resolved report:
       +20 bonus points
    */

    const points =
        (total * 10) +
        (resolved * 20);


    const reportsCount =
        document.getElementById(
            "reportsCount"
        );


    const resolvedCount =
        document.getElementById(
            "resolvedCount"
        );


    const pointsCount =
        document.getElementById(
            "pointsCount"
        );


    if (reportsCount) {

        reportsCount.textContent =
            total;

    }


    if (resolvedCount) {

        resolvedCount.textContent =
            resolved;

    }


    if (pointsCount) {

        pointsCount.textContent =
            points;

    }

}


/* =========================================================
   AVATAR
========================================================= */

function loadSavedAvatar() {

    const avatar =
        localStorage.getItem(
            AVATAR_KEY
        );


    if (
        avatar
    ) {

        setAvatarImage(
            avatar
        );

    }

}


function setupAvatar() {

    const editButton =
        document.getElementById(
            "avatarEditButton"
        );


    const input =
        document.getElementById(
            "avatarInput"
        );


    if (
        !editButton ||
        !input
    ) {

        return;

    }


    editButton.addEventListener(
        "click",
        function() {

            input.click();

        }
    );


    input.addEventListener(
        "change",
        handleAvatarChange
    );

}


function handleAvatarChange(
    event
) {

    const file =
        event.target.files?.[0];


    if (
        !file
    ) {

        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showInfo(
            "Profile photo",
            `
            <div class="info-item">
                Please choose an image file.
            </div>
            `
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function() {

            const dataUrl =
                reader.result;


            localStorage.setItem(
                AVATAR_KEY,
                dataUrl
            );


            setAvatarImage(
                dataUrl
            );

        };


    reader.readAsDataURL(
        file
    );

}


function setAvatarImage(
    dataUrl
) {

    const avatar =
        document.getElementById(
            "avatarPreview"
        );


    if (!avatar) {

        return;

    }


    avatar.style.backgroundImage =
        `url("${dataUrl}")`;


    avatar.classList.add(
        "has-image"
    );

}


/* =========================================================
   EDIT PROFILE
========================================================= */

function openEditProfile() {

    const session =
        getSession();


    if (!session) {

        return;

    }


    document.getElementById(
        "editName"
    ).value =
        session.name || "";


    document.getElementById(
        "editEmail"
    ).value =
        session.email || "";


    document.getElementById(
        "editProfileModal"
    ).hidden =
        false;

}


function closeEditProfile() {

    document.getElementById(
        "editProfileModal"
    ).hidden =
        true;

}


function saveProfileChanges() {

    const session =
        getSession();


    if (!session) {

        return;

    }


    const newName =
        document.getElementById(
            "editName"
        ).value.trim();


    const newEmail =
        document.getElementById(
            "editEmail"
        ).value.trim().toLowerCase();


    if (
        newName.length < 2
    ) {

        showInfo(
            "Invalid name",
            `
            <div class="info-item">
                Please enter a valid name.
            </div>
            `
        );

        return;

    }


    if (
        !newEmail
    ) {

        showInfo(
            "Invalid email",
            `
            <div class="info-item">
                Please enter a valid email address.
            </div>
            `
        );

        return;

    }


    /*
       Find current account.
    */

    const accounts =
        getAccounts();


    const currentAccount =
        accounts.find(
            function(account) {

                return (
                    account.email ===
                    session.email
                );

            }
        );


    if (!currentAccount) {

        return;

    }


    /*
       Prevent duplicate email.
    */

    const emailTaken =
        accounts.some(
            function(account) {

                return (
                    account.email ===
                    newEmail &&
                    account.email !==
                    session.email
                );

            }
        );


    if (emailTaken) {

        showInfo(
            "Email already in use",
            `
            <div class="info-item">
                Another SpotFix account is already using that email.
            </div>
            `
        );

        return;

    }


    /*
       Update account.
    */

    currentAccount.name =
        newName;


    currentAccount.email =
        newEmail;


    saveAccounts(
        accounts
    );


    /*
       Update all of this user's
       stored reports if the email
       changes.
    */

    const reports =
        getReports();


    reports.forEach(
        function(report) {

            if (
                report.reporterEmail ===
                session.email
            ) {

                report.reporterEmail =
                    newEmail;

            }

        }
    );


    localStorage.setItem(
        REPORTS_KEY,
        JSON.stringify(
            reports
        )
    );


    /*
       Save updated session.
    */

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
            name: newName,
            email: newEmail
        })
    );


    /*
       Refresh page data.
    */

    loadProfile();

    closeEditProfile();


    showInfo(
        "Profile updated",
        `
        <div class="info-item">
            Your profile information has been updated.
        </div>
        `
    );

}


/* =========================================================
   INFORMATION OPTIONS
========================================================= */

function setupInformationButtons() {

    /*
       Settings
    */

    document.getElementById(
        "settingsButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Settings",
                `
                <div class="info-item">
                    ⚙️ Settings are available as a demo placeholder.
                </div>

                <div class="info-item">
                    More account preferences will be connected in the backend version.
                </div>
                `
            );

        }
    );


    /*
       Notifications
    */

    document.getElementById(
        "notificationsButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Notifications",
                `
                <div class="info-item">
                    🔔 Report status updates
                </div>

                <div class="info-item">
                    ⏰ Weekly reminders for reports that remain Pending
                </div>

                <div class="info-item">
                    👍 Community activity on your reports
                </div>
                `
            );

        }
    );


    /*
       Privacy
    */

    document.getElementById(
        "privacyButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Privacy & Permissions",
                `
                <div class="info-item">
                    📍 Location access is used to attach your report location and show nearby issues.
                </div>

                <div class="info-item">
                    💾 This demo stores account and report information locally in your browser.
                </div>
                `
            );

        }
    );


    /*
       Help
    */

    document.getElementById(
        "helpButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Help & Support",
                `
                <div class="info-item">
                    Need help? This is a demo support area for the first-round presentation.
                </div>

                <div class="info-item">
                    Report submission, status updates and map features are available from Home.
                </div>
                `
            );

        }
    );


    /*
       About
    */

    document.getElementById(
        "aboutButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "About SpotFix",
                `
                <div class="info-item">
                    <strong>SpotFix</strong><br>
                    Spot it. Fix it.
                </div>

                <div class="info-item">
                    A community-focused civic issue reporting platform.
                </div>

                <div class="info-item">
                    Demo version for hackathon presentation.
                </div>
                `
            );

        }
    );


    /*
       Edit profile
    */

    document.getElementById(
        "editProfileButton"
    ).addEventListener(
        "click",
        openEditProfile
    );

}


/* =========================================================
   SIGN OUT
========================================================= */

function setupSignOut() {

    const button =
        document.getElementById(
            "signOutButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function() {

            const confirmed =
                window.confirm(
                    "Sign out of SpotFix?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                SESSION_KEY
            );


            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   MODAL CONTROLS
========================================================= */

function setupModalControls() {

    /*
       Info modal
    */

    document.getElementById(
        "closeInfo"
    ).addEventListener(
        "click",
        closeInfo
    );


    document.getElementById(
        "infoBackdrop"
    ).addEventListener(
        "click",
        closeInfo
    );


    /*
       Edit modal
    */

    document.getElementById(
        "closeEditProfile"
    ).addEventListener(
        "click",
        closeEditProfile
    );


    document.getElementById(
        "editBackdrop"
    ).addEventListener(
        "click",
        closeEditProfile
    );


    document.getElementById(
        "saveProfileButton"
    ).addEventListener(
        "click",
        saveProfileChanges
    );


    /*
       Escape closes modals.
    */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeInfo();

                closeEditProfile();

            }

        }
    );

}


/* =========================================================
   INFO MODAL
========================================================= */

function showInfo(
    title,
    content
) {

    document.getElementById(
        "infoTitle"
    ).textContent =
        title;


    document.getElementById(
        "infoContent"
    ).innerHTML =
        content;


    document.getElementById(
        "infoModal"
    ).hidden =
        false;

}


function closeInfo() {

    document.getElementById(
        "infoModal"
    ).hidden =
        true;

}


/* =========================================================
   START
========================================================= */

function startProfile() {

    if (
        !getSession()
    ) {

        window.location.href =
            "login.html";

        return;

    }


    loadProfile();

    setupAvatar();

    setupInformationButtons();

    setupSignOut();

    setupModalControls();

}


document.addEventListener(
    "DOMContentLoaded",
    startProfile
);
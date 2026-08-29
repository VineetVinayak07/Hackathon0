/* =========================================================
   SPOTFIX — REPORTS.JS

   Handles:
   - My Reports
   - Report status
   - Weekly pending reminder
   - Delete own reports
   - Report details
   - Report summary
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const REPORTS_KEY = "spotFixReports";
const SESSION_KEY = "spotFixSession";


/* =========================================================
   STATE
========================================================= */

let reportToDelete = null;


/* =========================================================
   SESSION
========================================================= */

function getSession() {

    try {

        return JSON.parse(
            localStorage.getItem(
                SESSION_KEY
            )
        );

    } catch (error) {

        return null;

    }

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


function saveReports(
    reports
) {

    localStorage.setItem(
        REPORTS_KEY,
        JSON.stringify(reports)
    );

}


/* =========================================================
   CURRENT USER'S REPORTS
========================================================= */

function getMyReports() {

    const session =
        getSession();


    if (!session) {

        return [];

    }


    return getReports()
        .filter(
            function(report) {

                /*
                   Only show reports created
                   by the currently logged-in user.

                   Demo reports without a
                   reporterEmail remain community
                   reports, not "My Reports".
                */

                return (
                    report.reporterEmail ===
                    session.email
                );

            }
        )
        .sort(
            function(a, b) {

                return (
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
                );

            }
        );

}


/* =========================================================
   STATUS HELPERS
========================================================= */

function getStatusLabel(
    status
) {

    if (
        status === "progress" ||
        status === "in-progress"
    ) {

        return "In Progress";

    }


    if (
        status === "resolved"
    ) {

        return "Resolved";

    }


    return "Pending";

}


function getStatusClass(
    status
) {

    if (
        status === "progress" ||
        status === "in-progress"
    ) {

        return "progress";

    }


    if (
        status === "resolved"
    ) {

        return "resolved";

    }


    return "pending";

}


/* =========================================================
   TIME
========================================================= */

function timeAgo(
    isoDate
) {

    const date =
        new Date(
            isoDate
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown time";

    }


    const difference =
        Math.max(
            0,
            Date.now() -
            date.getTime()
        );


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (
        minutes < 1
    ) {

        return "Just now";

    }


    if (
        minutes < 60
    ) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours < 24
    ) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    return `${days}d ago`;

}


/* =========================================================
   CATEGORY ICON
========================================================= */

function getCategoryIcon(
    type
) {

    const icons = {

        Pothole:
            "🕳️",

        Garbage:
            "🗑️",

        Streetlight:
            "💡",

        Other:
            "✦"

    };


    return (
        icons[type] ||
        icons.Other
    );

}


/* =========================================================
   REPORT IMAGE
========================================================= */

function getReportImage(
    report
) {

    if (
        report.image
    ) {

        return `
            <img
                src="${report.image}"
                alt="${escapeHTML(
                    report.type
                )} report"
            >
        `;

    }


    return `
        <span>
            ${getCategoryIcon(
                report.type
            )}
        </span>
    `;

}


/* =========================================================
   WEEKLY PENDING REMINDER
========================================================= */

function reportNeedsReminder(
    report
) {

    if (
        getStatusClass(
            report.status
        ) !== "pending"
    ) {

        return false;

    }


    const created =
        new Date(
            report.createdAt
        );


    if (
        Number.isNaN(
            created.getTime()
        )
    ) {

        return false;

    }


    const age =
        Date.now() -
        created.getTime();


    const oneWeek =
        7 *
        24 *
        60 *
        60 *
        1000;


    return age >= oneWeek;

}


function checkPendingReminder(
    reports
) {

    const reminder =
        document.getElementById(
            "pendingReminder"
        );


    if (!reminder) {

        return;

    }


    const pendingReport =
        reports.find(
            reportNeedsReminder
        );


    /*
       Show reminder when at least one
       pending report has reached a week.
    */

    reminder.hidden =
        !pendingReport;


    if (
        pendingReport
    ) {

        reminder.dataset.reportId =
            pendingReport.id;

    }

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary(
    reports
) {

    const total =
        reports.length;


    const pending =
        reports.filter(
            function(report) {

                return (
                    getStatusClass(
                        report.status
                    ) === "pending"
                );

            }
        ).length;


    const resolved =
        reports.filter(
            function(report) {

                return (
                    getStatusClass(
                        report.status
                    ) === "resolved"
                );

            }
        ).length;


    document.getElementById(
        "totalReports"
    ).textContent =
        total;


    document.getElementById(
        "pendingReports"
    ).textContent =
        pending;


    document.getElementById(
        "resolvedReports"
    ).textContent =
        resolved;

}


/* =========================================================
   REPORT CARD
========================================================= */

function buildReportCard(
    report
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "report-card";


    card.dataset.reportId =
        report.id;


    const statusClass =
        getStatusClass(
            report.status
        );


    const statusLabel =
        getStatusLabel(
            report.status
        );


    card.innerHTML = `

        <div class="report-thumb">
            ${getReportImage(
                report
            )}
        </div>


        <div class="report-content">

            <div class="report-title-row">

                <div class="report-title">
                    ${escapeHTML(
                        report.title ||
                        `${report.type} Report`
                    )}
                </div>

                <span class="status ${statusClass}">
                    ${statusLabel}
                </span>

            </div>


            <div class="report-description">
                ${escapeHTML(
                    report.description ||
                    "No description provided."
                )}
            </div>


            <div class="report-meta">
                ${report.lat && report.lng
                    ? "📍 Location attached · "
                    : ""}
                ${timeAgo(
                    report.createdAt
                )}
            </div>


            <div class="report-actions">

                <button
                    type="button"
                    class="report-action view-report"
                    data-id="${report.id}">
                    View
                </button>


                <button
                    type="button"
                    class="report-action update-status"
                    data-id="${report.id}">
                    Update status
                </button>


                <button
                    type="button"
                    class="report-action delete"
                    data-id="${report.id}">
                    Delete
                </button>

            </div>

        </div>

    `;


    return card;

}


/* =========================================================
   RENDER REPORT LIST
========================================================= */

function renderReports() {

    const reports =
        getMyReports();


    renderSummary(
        reports
    );


    checkPendingReminder(
        reports
    );


    const justSubmittedList =
        document.getElementById(
            "justSubmittedList"
        );


    const earlierReportsList =
        document.getElementById(
            "earlierReportsList"
        );


    const emptyState =
        document.getElementById(
            "justSubmittedEmpty"
        );


    justSubmittedList.innerHTML =
        "";


    earlierReportsList.innerHTML =
        "";


    /*
       No reports
    */

    if (
        reports.length === 0
    ) {

        emptyState.hidden =
            false;

        /*
           Nothing needs to be shown in
           the Earlier Reports section.
        */

        return;

    }


    emptyState.hidden =
        true;


    /*
       First 2 reports are "Just Submitted".
       Older reports go underneath.
    */

    const recentReports =
        reports.slice(
            0,
            2
        );


    const earlierReports =
        reports.slice(
            2
        );


    recentReports.forEach(
        function(report) {

            justSubmittedList.appendChild(
                buildReportCard(
                    report
                )
            );

        }
    );


    earlierReports.forEach(
        function(report) {

            earlierReportsList.appendChild(
                buildReportCard(
                    report
                )
            );

        }
    );


    /*
       If there are no older reports,
       show a small message.
    */

    if (
        earlierReports.length === 0
    ) {

        earlierReportsList.innerHTML = `
            <div class="empty-state">
                <strong>No earlier reports</strong>
                Your older submissions will appear here.
            </div>
        `;

    }


    setupReportCardButtons();

}


/* =========================================================
   VIEW REPORT
========================================================= */

function viewReport(
    reportId
) {

    const report =
        getMyReports().find(
            function(item) {

                return (
                    String(item.id) ===
                    String(reportId)
                );

            }
        );


    if (!report) {

        return;

    }


    const image =
        report.image
            ? `
                <img
                    class="detail-image"
                    src="${report.image}"
                    alt="${escapeHTML(
                        report.type
                    )} report"
                >
            `
            : "";


    document.getElementById(
        "detailTitle"
    ).textContent =
        report.title ||
        `${report.type} Report`;


    document.getElementById(
        "detailContent"
    ).innerHTML = `

        ${image}


        <div class="detail-item">

            <strong>
                Status
            </strong>

            <br>

            ${getStatusLabel(
                report.status
            )}

        </div>


        <div class="detail-item">

            <strong>
                Description
            </strong>

            <br>

            ${escapeHTML(
                report.description ||
                "No description provided."
            )}

        </div>


        <div class="detail-item">

            <strong>
                Submitted
            </strong>

            <br>

            ${timeAgo(
                report.createdAt
            )}

        </div>


        <div class="detail-item">

            <strong>
                Location
            </strong>

            <br>

            ${
                report.lat &&
                report.lng
                    ? `${Number(report.lat).toFixed(5)},
                       ${Number(report.lng).toFixed(5)}`
                    : "Location unavailable"
            }

        </div>

    `;


    document.getElementById(
        "reportDetailModal"
    ).hidden =
        false;

}


/* =========================================================
   UPDATE STATUS
========================================================= */

function updateReportStatus(
    reportId
) {

    const reports =
        getReports();


    const report =
        reports.find(
            function(item) {

                return (
                    String(item.id) ===
                    String(reportId)
                );

            }
        );


    if (!report) {

        return;

    }


    /*
       Safety:
       users can only update their own report.
    */

    const session =
        getSession();


    if (
        !session ||
        report.reporterEmail !==
            session.email
    ) {

        return;

    }


    const currentStatus =
        getStatusClass(
            report.status
        );


    /*
       Cycle:
       Pending → In Progress → Resolved
       Resolved → Pending

       The last transition is useful
       for the demo: if an issue reappears,
       the user can reopen it.
    */

    let newStatus;


    if (
        currentStatus === "pending"
    ) {

        newStatus =
            "progress";

    }

    else if (
        currentStatus === "progress"
    ) {

        newStatus =
            "resolved";

    }

    else {

        newStatus =
            "pending";

    }


    report.status =
        newStatus;


    /*
       Save
    */

    saveReports(
        reports
    );


    /*
       Refresh
    */

    renderReports();


    /*
       Explain what happened
    */

    showInfo(
        "Status updated",
        `
        <div class="detail-item">

            Your report is now
            <strong>
                ${getStatusLabel(
                    newStatus
                )}
            </strong>.

            ${
                newStatus === "pending"
                    ? "<br><br>The report is back in Pending because the issue still needs attention."
                    : ""
            }

        </div>
        `
    );

}


/* =========================================================
   DELETE REPORT
========================================================= */

function askToDelete(
    reportId
) {

    const reports =
        getMyReports();


    const report =
        reports.find(
            function(item) {

                return (
                    String(item.id) ===
                    String(reportId)
                );

            }
        );


    if (!report) {

        return;

    }


    reportToDelete =
        report.id;


    document.getElementById(
        "deleteModal"
    ).hidden =
        false;

}


function deleteReport() {

    if (
        reportToDelete === null
    ) {

        return;

    }


    const session =
        getSession();


    if (!session) {

        return;

    }


    const reports =
        getReports();


    const index =
        reports.findIndex(
            function(report) {

                return (
                    String(report.id) ===
                        String(reportToDelete) &&
                    report.reporterEmail ===
                        session.email
                );

            }
        );


    if (
        index === -1
    ) {

        closeDeleteModal();

        reportToDelete =
            null;

        return;

    }


    reports.splice(
        index,
        1
    );


    saveReports(
        reports
    );


    reportToDelete =
        null;


    closeDeleteModal();


    renderReports();


    showInfo(
        "Report deleted",
        `
        <div class="detail-item">
            The report has been removed from your My Reports history.
        </div>
        `
    );

}


/* =========================================================
   MODAL CLOSE FUNCTIONS
========================================================= */

function closeDetailModal() {

    document.getElementById(
        "reportDetailModal"
    ).hidden =
        true;

}


function closeDeleteModal() {

    document.getElementById(
        "deleteModal"
    ).hidden =
        true;

}


/* =========================================================
   CARD BUTTONS
========================================================= */

function setupReportCardButtons() {

    document
        .querySelectorAll(
            ".view-report"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        viewReport(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".update-status"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        updateReportStatus(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".delete"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        askToDelete(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   REMINDER BUTTON
========================================================= */

function setupReminder() {

    const reminder =
        document.getElementById(
            "pendingReminder"
        );


    if (!reminder) {

        return;

    }


    reminder.addEventListener(
        "click",
        function() {

            const reportId =
                reminder.dataset.reportId;


            if (
                reportId
            ) {

                viewReport(
                    reportId
                );

            }

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    const button =
        document.getElementById(
            "reportsNotificationButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function() {

            showInfo(
                "Notifications",
                `
                <div class="detail-item">
                    📍 Your pending reports are checked regularly.
                </div>

                <div class="detail-item">
                    ✅ Status updates will appear here in the full backend version.
                </div>

                <div class="detail-item">
                    ⏰ A weekly check-in appears when a report remains pending.
                </div>
                `
            );

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
        "detailTitle"
    ).textContent =
        title;


    document.getElementById(
        "detailContent"
    ).innerHTML =
        content;


    document.getElementById(
        "reportDetailModal"
    ).hidden =
        false;

}


/* =========================================================
   CLOSE / DELETE BUTTONS
========================================================= */

function setupModalButtons() {

    document.getElementById(
        "closeDetail"
    ).addEventListener(
        "click",
        closeDetailModal
    );


    document.getElementById(
        "reportDetailBackdrop"
    ).addEventListener(
        "click",
        closeDetailModal
    );


    document.getElementById(
        "cancelDelete"
    ).addEventListener(
        "click",
        function() {

            reportToDelete =
                null;

            closeDeleteModal();

        }
    );


    document.getElementById(
        "deleteBackdrop"
    ).addEventListener(
        "click",
        function() {

            reportToDelete =
                null;

            closeDeleteModal();

        }
    );


    document.getElementById(
        "confirmDelete"
    ).addEventListener(
        "click",
        deleteReport
    );


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeDetailModal();

                closeDeleteModal();

                reportToDelete =
                    null;

            }

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   AUTH CHECK
========================================================= */

function checkLogin() {

    const session =
        getSession();


    if (
        !session
    ) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


/* =========================================================
   START
========================================================= */

function startReportsPage() {

    if (
        !checkLogin()
    ) {

        return;

    }


    renderReports();

    setupReminder();

    setupNotifications();

    setupModalButtons();


    /*
       Re-check the reminder periodically.
       This is a frontend simulation of the
       weekly notification concept.
    */

    setInterval(
        function() {

            renderReports();

        },
        60000
    );

}


document.addEventListener(
    "DOMContentLoaded",
    startReportsPage
);
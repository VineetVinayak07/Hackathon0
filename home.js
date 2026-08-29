/* =========================================================
   SPOTFIX — HOME.JS

   Handles:
   - Map
   - GPS
   - Range selection
   - Issue filtering
   - Reporting
   - Photo upload
   - Upvote / downvote
   - Basic navigation
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const REPORTS_KEY = "spotFixReports";
const SESSION_KEY = "spotFixSession";


/* =========================================================
   DEFAULT LOCATION
   Used until GPS location is available.
========================================================= */

const DEFAULT_LOCATION = {
    lat: 28.6139,
    lng: 77.2090
};


/* =========================================================
   APP STATE
========================================================= */

let map = null;

let userMarker = null;

let radiusCircle = null;

let issueMarkers = [];

let userLatitude = DEFAULT_LOCATION.lat;

let userLongitude = DEFAULT_LOCATION.lng;

let selectedRadius = 10000;

let selectedPhoto = "";


/* =========================================================
   DEMO REPORTS
========================================================= */

const DEMO_REPORTS = [
    {
        id: "demo-1",
        type: "Pothole",
        title: "Pothole on MG Road",
        description: "Large pothole affecting traffic.",
        lat: 28.6255,
        lng: 77.2099,
        status: "pending",
        createdAt: new Date(
            Date.now() - 2 * 60 * 60 * 1000
        ).toISOString(),
        image: "",
        upvotes: 12,
        downvotes: 1,
        voters: {}
    },

    {
        id: "demo-2",
        type: "Garbage",
        title: "Garbage Overflow",
        description: "Public bin is overflowing.",
        lat: 28.6079,
        lng: 77.2147,
        status: "progress",
        createdAt: new Date(
            Date.now() - 4 * 60 * 60 * 1000
        ).toISOString(),
        image: "",
        upvotes: 8,
        downvotes: 0,
        voters: {}
    },

    {
        id: "demo-3",
        type: "Streetlight",
        title: "Streetlight Not Working",
        description:
            "Streetlight is not turning on at night.",
        lat: 28.6182,
        lng: 77.1938,
        status: "resolved",
        createdAt: new Date(
            Date.now() - 24 * 60 * 60 * 1000
        ).toISOString(),
        image: "",
        upvotes: 19,
        downvotes: 2,
        voters: {}
    }
];


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
   REPORT STORAGE
========================================================= */

function getReports() {

    try {

        const savedReports =
            JSON.parse(
                localStorage.getItem(REPORTS_KEY)
            );


        if (
            Array.isArray(savedReports) &&
            savedReports.length > 0
        ) {

            return savedReports;

        }

    } catch (error) {

        console.log(
            "Could not load reports."
        );

    }


    localStorage.setItem(
        REPORTS_KEY,
        JSON.stringify(DEMO_REPORTS)
    );


    return [...DEMO_REPORTS];

}


function saveReports(reports) {

    localStorage.setItem(
        REPORTS_KEY,
        JSON.stringify(reports)
    );

}


/* =========================================================
   DISTANCE
========================================================= */

function calculateDistanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const earthRadius = 6371;


    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;


    const dLng =
        (lng2 - lng1) *
        Math.PI /
        180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 *
            Math.PI /
            180
        ) *

        Math.cos(
            lat2 *
            Math.PI /
            180
        ) *

        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


/* =========================================================
   TIME
========================================================= */

function timeAgo(isoDate) {

    const milliseconds =
        Date.now() -
        new Date(isoDate).getTime();


    const minutes =
        Math.floor(
            milliseconds /
            60000
        );


    if (minutes < 1) {

        return "Just now";

    }


    if (minutes < 60) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `${days}d ago`;

}


/* =========================================================
   DISTANCE DISPLAY
========================================================= */

function formatDistance(distanceKm) {

    if (distanceKm < 1) {

        return `${Math.round(
            distanceKm * 1000
        )} m`;

    }


    return `${distanceKm.toFixed(
        1
    )} km`;

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    if (
        status === "progress"
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
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {

    if (
        status === "progress"
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


/* =========================================================
   MAP INITIALIZATION
========================================================= */

function initializeMap() {

    if (
        typeof L === "undefined"
    ) {

        console.error(
            "Leaflet failed to load."
        );

        return;

    }


    map =
        L.map(
            "map"
        ).setView(
            [
                userLatitude,
                userLongitude
            ],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "© OpenStreetMap contributors"
        }
    ).addTo(map);


    /* -------------------------
       User marker
    ------------------------- */

    userMarker =
        L.marker(
            [
                userLatitude,
                userLongitude
            ]
        ).addTo(map);


    userMarker.bindPopup(
        "<strong>Your location</strong>"
    );


    /* -------------------------
       Radius circle
    ------------------------- */

    radiusCircle =
        L.circle(
            [
                userLatitude,
                userLongitude
            ],
            {
                radius:
                    selectedRadius,

                color:
                    "#2855ff",

                fillColor:
                    "#2855ff",

                fillOpacity:
                    0.08,

                weight:
                    2
            }
        ).addTo(map);


    /*
       Initial issue rendering
    */

    refreshIssues();


    /*
       Give Leaflet time to calculate
       its container size.
    */

    setTimeout(
        function() {

            map.invalidateSize();

        },
        250
    );

}


/* =========================================================
   GET REPORTS WITH DISTANCE
========================================================= */

function getVisibleReports() {

    const reports =
        getReports();


    return reports
        .map(
            function(report) {

                const distance =
                    calculateDistanceKm(
                        userLatitude,
                        userLongitude,
                        Number(report.lat),
                        Number(report.lng)
                    );


                return {
                    ...report,
                    distance
                };

            }
        )
        .filter(
            function(report) {

                return (
                    report.distance <=
                    selectedRadius / 1000
                );

            }
        )
        .sort(
            function(a, b) {

                return (
                    a.distance -
                    b.distance
                );

            }
        );

}


/* =========================================================
   CLEAR MAP ISSUE MARKERS
========================================================= */

function clearIssueMarkers() {

    issueMarkers.forEach(
        function(marker) {

            map.removeLayer(
                marker
            );

        }
    );


    issueMarkers = [];

}


/* =========================================================
   REFRESH MAP
========================================================= */

function refreshIssues() {

    if (
        !map
    ) {

        return;

    }


    const reports =
        getVisibleReports();


    clearIssueMarkers();


    /*
       Add marker for every
       issue inside selected range.
    */

    reports.forEach(
        function(report) {

            const marker =
                L.marker(
                    [
                        report.lat,
                        report.lng
                    ]
                ).addTo(map);


            marker.bindPopup(`
                <strong>
                    ${escapeHTML(
                        report.title
                    )}
                </strong>

                <br>

                ${escapeHTML(
                    report.type
                )}

                <br>

                ${formatDistance(
                    report.distance
                )}
                away

                <br>

                ${getStatusLabel(
                    report.status
                )}
            `);


            issueMarkers.push(
                marker
            );

        }
    );


    renderIssues(
        reports
    );


    updateRangeText();

}


/* =========================================================
   RANGE CONTROLS
========================================================= */

function setupRangeButtons() {

    const buttons =
        document.querySelectorAll(
            ".range-option"
        );


    buttons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    selectedRadius =
                        Number(
                            button.dataset.radius
                        );


                    /*
                       Active button
                    */

                    buttons.forEach(
                        function(item) {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        }
                    );


                    /*
                       Update circle
                    */

                    radiusCircle.setRadius(
                        selectedRadius
                    );


                    /*
                       Refresh list
                    */

                    refreshIssues();


                    /*
                       Show full selected area
                    */

                    map.fitBounds(
                        radiusCircle.getBounds(),
                        {
                            padding: [
                                10,
                                10
                            ],

                            maxZoom:
                                selectedRadius <= 5000
                                    ? 13
                                    : 12
                        }
                    );

                }
            );

        }
    );

}


/* =========================================================
   RANGE TEXT
========================================================= */

function updateRangeText() {

    const kilometers =
        selectedRadius /
        1000;


    document.getElementById(
        "rangeLabel"
    ).textContent =
        `${kilometers} km`;


    document.getElementById(
        "issuesTitle"
    ).textContent =
        `Issues within ${kilometers} km`;

}


/* =========================================================
   ISSUE LIST
========================================================= */

function renderIssues(
    reports
) {

    const list =
        document.getElementById(
            "issueList"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    list.innerHTML = "";


    if (
        reports.length === 0
    ) {

        list.hidden = true;

        emptyState.hidden = false;

        return;

    }


    list.hidden = false;

    emptyState.hidden = true;


    reports.forEach(
        function(report) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "issue-card";


            card.dataset.issueId =
                report.id;


            /*
               Image
            */

            let imageHTML;


            if (
                report.image
            ) {

                imageHTML = `
                    <img
                        class="issue-image"
                        src="${report.image}"
                        alt="${escapeHTML(
                            report.type
                        )} issue"
                    >
                `;

            }

            else {

                let symbol =
                    "✦";


                if (
                    report.type ===
                    "Pothole"
                ) {

                    symbol =
                        "🕳️";

                }

                else if (
                    report.type ===
                    "Garbage"
                ) {

                    symbol =
                        "🗑️";

                }

                else if (
                    report.type ===
                    "Streetlight"
                ) {

                    symbol =
                        "💡";

                }


                imageHTML = `
                    <div
                        class="issue-image issue-image-fallback"
                    >
                        ${symbol}
                    </div>
                `;

            }


            /*
               Build card
            */

            card.innerHTML = `

                ${imageHTML}


                <div class="issue-details">

                    <div class="issue-title-row">

                        <div class="issue-title">
                            ${escapeHTML(
                                report.title
                            )}
                        </div>


                        <span
                            class="status ${getStatusClass(
                                report.status
                            )}"
                        >
                            ${getStatusLabel(
                                report.status
                            )}
                        </span>

                    </div>


                    <div class="issue-type">
                        ${escapeHTML(
                            report.type
                        )}
                    </div>


                    <div class="issue-meta">
                        📍
                        ${formatDistance(
                            report.distance
                        )}
                        away
                        ·
                        ${timeAgo(
                            report.createdAt
                        )}
                    </div>


                    <div class="vote-row">

                        <button
                            type="button"
                            class="vote-button upvote"
                            data-vote="up"
                            data-id="${report.id}"
                        >
                            ▲
                            <span>
                                ${Number(
                                    report.upvotes || 0
                                )}
                            </span>
                        </button>


                        <button
                            type="button"
                            class="vote-button downvote"
                            data-vote="down"
                            data-id="${report.id}"
                        >
                            ▼
                            <span>
                                ${Number(
                                    report.downvotes || 0
                                )}
                            </span>
                        </button>

                    </div>

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );


    setupVoteButtons();

}


/* =========================================================
   VOTING
========================================================= */

function setupVoteButtons() {

    document
        .querySelectorAll(
            ".vote-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        const reportId =
                            button.dataset.id;


                        const vote =
                            button.dataset.vote;


                        voteOnReport(
                            reportId,
                            vote
                        );

                    }
                );

            }
        );

}


function voteOnReport(
    reportId,
    vote
) {

    const session =
        getSession();


    /*
       A login is required so that
       one person cannot vote endlessly.
    */

    if (!session) {

        showInfo(
            "Login required",
            `
            <div class="info-item">
                Please log in before voting on a report.
            </div>
            `
        );

        return;

    }


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
       Make sure voters exists.
    */

    if (
        typeof report.voters !==
        "object" ||
        report.voters === null
    ) {

        report.voters = {};

    }


    const voterId =
        session.email;


    const previousVote =
        report.voters[voterId];


    /*
       Clicking the same vote again
       removes the vote.
    */

    if (
        previousVote ===
        vote
    ) {

        if (
            vote === "up"
        ) {

            report.upvotes =
                Math.max(
                    0,
                    Number(
                        report.upvotes || 0
                    ) - 1
                );

        }

        else {

            report.downvotes =
                Math.max(
                    0,
                    Number(
                        report.downvotes || 0
                    ) - 1
                );

        }


        delete report.voters[
            voterId
        ];

    }


    /*
       Change vote
    */

    else {

        if (
            previousVote ===
            "up"
        ) {

            report.upvotes =
                Math.max(
                    0,
                    Number(
                        report.upvotes || 0
                    ) - 1
                );

        }


        if (
            previousVote ===
            "down"
        ) {

            report.downvotes =
                Math.max(
                    0,
                    Number(
                        report.downvotes || 0
                    ) - 1
                );

        }


        if (
            vote === "up"
        ) {

            report.upvotes =
                Number(
                    report.upvotes || 0
                ) + 1;

        }

        else {

            report.downvotes =
                Number(
                    report.downvotes || 0
                ) + 1;

        }


        report.voters[
            voterId
        ] = vote;

    }


    saveReports(
        reports
    );


    refreshIssues();

}


/* =========================================================
   LOCATION
========================================================= */

function getUserLocation() {

    if (
        !navigator.geolocation
    ) {

        showInfo(
            "Location unavailable",
            `
            <div class="info-item">
                Your browser does not support location services.
            </div>
            `
        );

        return;

    }


    const button =
        document.getElementById(
            "locationButton"
        );


    button.textContent =
        "…";


    navigator.geolocation.getCurrentPosition(

        function(position) {

            userLatitude =
                position.coords.latitude;


            userLongitude =
                position.coords.longitude;


            /*
               Move user marker
            */

            userMarker.setLatLng(
                [
                    userLatitude,
                    userLongitude
                ]
            );


            /*
               Move radius circle
            */

            radiusCircle.setLatLng(
                [
                    userLatitude,
                    userLongitude
                ]
            );


            /*
               Center map
            */

            map.setView(
                [
                    userLatitude,
                    userLongitude
                ],
                13
            );


            /*
               Recalculate issue distances
            */

            refreshIssues();


            button.textContent =
                "◎";

        },


        function(error) {

            console.log(
                "Location error:",
                error
            );


            button.textContent =
                "◎";


            showInfo(
                "Location",
                `
                <div class="info-item">
                    Location permission was unavailable.
                    The demo location is being used instead.
                </div>
                `
            );

        },


        {
            enableHighAccuracy:
                true,

            timeout:
                10000,

            maximumAge:
                60000
        }

    );

}


/* =========================================================
   REPORT MODAL
========================================================= */

function openReport(
    type = "Other"
) {

    document.getElementById(
        "issueType"
    ).value =
        type;


    document.getElementById(
        "description"
    ).value =
        "";


    document.getElementById(
        "issuePhoto"
    ).value =
        "";


    document.getElementById(
        "photoPreview"
    ).innerHTML =
        "";


    document.getElementById(
        "photoPreview"
    ).hidden =
        true;


    selectedPhoto =
        "";


    /*
       Current location
    */

    document.getElementById(
        "locationTitle"
    ).textContent =
        "Use my current location";


    document.getElementById(
        "locationSubtitle"
    ).textContent =
        `${userLatitude.toFixed(4)}, ${userLongitude.toFixed(4)} selected`;


    document.getElementById(
        "reportModal"
    ).hidden =
        false;

}


/* =========================================================
   CLOSE REPORT
========================================================= */

function closeReport() {

    document.getElementById(
        "reportModal"
    ).hidden =
        true;

}


/* =========================================================
   REPORT SETUP
========================================================= */

function setupReport() {

    /*
       General report button
    */

    document.getElementById(
        "mapReportButton"
    ).addEventListener(
        "click",
        function() {

            openReport();

        }
    );


    /*
       Quick category reports
    */

    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        openReport(
                            button.dataset.type
                        );

                    }
                );

            }
        );


    /*
       Close
    */

    document.getElementById(
        "closeReport"
    ).addEventListener(
        "click",
        closeReport
    );


    /*
       Backdrop
    */

    document.getElementById(
        "modalBackdrop"
    ).addEventListener(
        "click",
        closeReport
    );


    /*
       Location
    */

    document.getElementById(
        "reportLocationButton"
    ).addEventListener(
        "click",
        function() {

            getUserLocation();

        }
    );


    /*
       Submit
    */

    document.getElementById(
        "submitReport"
    ).addEventListener(
        "click",
        submitReport
    );

}


/* =========================================================
   PHOTO UPLOAD
========================================================= */

function setupPhotoUpload() {

    document.getElementById(
        "issuePhoto"
    ).addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files?.[0];


            if (!file) {

                selectedPhoto =
                    "";

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showInfo(
                    "Photo",
                    `
                    <div class="info-item">
                        Please choose an image file.
                    </div>
                    `
                );


                event.target.value =
                    "";


                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function() {

                    selectedPhoto =
                        reader.result;


                    document.getElementById(
                        "photoPreview"
                    ).innerHTML = `
                        <img
                            src="${selectedPhoto}"
                            alt="Selected report photo"
                        >
                    `;


                    document.getElementById(
                        "photoPreview"
                    ).hidden =
                        false;

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   SUBMIT REPORT
========================================================= */

function submitReport() {

    const session =
        getSession();


    const type =
        document.getElementById(
            "issueType"
        ).value;


    const description =
        document.getElementById(
            "description"
        ).value
        .trim();


    if (!description) {

        showInfo(
            "Missing description",
            `
            <div class="info-item">
                Please describe the issue before submitting.
            </div>
            `
        );

        return;

    }


    const newReport = {

        id:
            `report-${Date.now()}`,

        type:
            type,

        title:
            `${type} reported`,

        description:
            description,

        lat:
            userLatitude,

        lng:
            userLongitude,

        status:
            "pending",

        createdAt:
            new Date().toISOString(),

        image:
            selectedPhoto,

        reporterEmail:
            session?.email || "",

        upvotes:
            0,

        downvotes:
            0,

        voters:
            {}

    };


    const reports =
        getReports();


    reports.unshift(
        newReport
    );


    saveReports(
        reports
    );


    closeReport();


    refreshIssues();


    showInfo(
        "Report submitted",
        `
        <div class="info-item">

            Your report has been added
            to SpotFix with a
            <strong>Pending</strong> status.

        </div>
        `
    );


    /*
       Reset
    */

    document.getElementById(
        "description"
    ).value =
        "";


    document.getElementById(
        "issuePhoto"
    ).value =
        "";


    selectedPhoto =
        "";

}


/* =========================================================
   INFORMATION MODAL
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
   MENU + NOTIFICATIONS + OTHER BUTTONS
========================================================= */

function setupInfoButtons() {

    /*
       Menu
    */

    document.getElementById(
        "menuButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Menu",
                `
                <div class="info-list">

                    <div class="info-item">
                        🏠 Home
                    </div>

                    <div class="info-item">
                        🗺️ Explore the map
                    </div>

                    <div class="info-item">
                        📊 My Reports
                    </div>

                    <div class="info-item">
                        👤 Profile
                    </div>

                </div>
                `
            );

        }
    );


    /*
       Notifications
    */

    document.getElementById(
        "notificationButton"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Notifications",
                `
                <div class="info-list">

                    <div class="info-item">
                        ✅ A sample report has been resolved.
                    </div>

                    <div class="info-item">
                        📍 New issues are available in your selected range.
                    </div>

                    <div class="info-item">
                        🤝 Thanks for helping your community.
                    </div>

                </div>
                `
            );

        }
    );


    /*
       Close information modal
    */

    document.getElementById(
        "closeInfo"
    ).addEventListener(
        "click",
        closeInfo
    );


    document
        .querySelector(
            "[data-close-info]"
        )
        .addEventListener(
            "click",
            closeInfo
        );


    /*
       View all categories
    */

    document.getElementById(
        "viewAllCategories"
    ).addEventListener(
        "click",
        function() {

            showInfo(
                "Issue categories",
                `
                <div class="info-list">

                    <div class="info-item">
                        🕳️ Pothole
                    </div>

                    <div class="info-item">
                        🗑️ Garbage
                    </div>

                    <div class="info-item">
                        💡 Streetlight
                    </div>

                    <div class="info-item">
                        💧 Water leakage
                    </div>

                    <div class="info-item">
                        🛣️ Broken road
                    </div>

                    <div class="info-item">
                        🚦 Traffic signal
                    </div>

                    <div class="info-item">
                        ✦ Other
                    </div>

                </div>
                `
            );

        }
    );


    /*
       View all issues
    */

    document.getElementById(
        "viewAllIssues"
    ).addEventListener(
        "click",
        function() {

            const count =
                document.querySelectorAll(
                    ".issue-card"
                ).length;


            showInfo(
                "Issues in this range",
                `
                <div class="info-item">

                    ${count}
                    issue${count === 1 ? "" : "s"}
                    currently visible within
                    ${selectedRadius / 1000}
                    km.

                </div>
                `
            );

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function(event) {

                        /*
                           Keep normal links working.
                           We only manually handle the
                           map link here.
                        */

                        const destination =
                            button.dataset.nav;


                        if (
                            destination ===
                            "map"
                        ) {

                            event.preventDefault();


                            document
                                .querySelector(
                                    "#mapSection"
                                )
                                .scrollIntoView(
                                    {
                                        behavior:
                                            "smooth"
                                    }
                                );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

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
   KEYBOARD
========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeReport();

            closeInfo();

        }
    );

}


/* =========================================================
   START
========================================================= */

function startHome() {

    const session =
        getSession();


    /*
       Login is required.
    */

    if (!session) {

        window.location.href =
            "login.html";

        return;

    }


    /*
       User name
    */

    document.getElementById(
        "userName"
    ).textContent =
        session.name
            .split(" ")[0];


    /*
       Start home page
    */

    initializeMap();

    setupRangeButtons();

    setupReport();

    setupPhotoUpload();

    setupInfoButtons();

    setupNavigation();

    setupKeyboard();

}


document.addEventListener(
    "DOMContentLoaded",
    startHome
);
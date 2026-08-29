/* =========================================================
   SPOTFIX AUTH.JS
   Handles:
   - Create account
   - Login
   - Password show/hide
   - Demo session using localStorage
========================================================= */

const ACCOUNT_KEY = "spotFixAccounts";
const SESSION_KEY = "spotFixSession";


/* =========================================================
   ACCOUNT STORAGE
========================================================= */

function getAccounts() {

    try {

        const accounts = JSON.parse(
            localStorage.getItem(ACCOUNT_KEY)
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
   SESSION
========================================================= */

function saveSession(account) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
            name: account.name,
            email: account.email
        })
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text, success = false) {

    const message =
        document.getElementById("message");

    if (!message) {
        return;
    }

    message.textContent = text;

    message.classList.toggle(
        "success",
        success
    );

}


/* =========================================================
   SHOW / HIDE PASSWORD
========================================================= */

function setupPasswordButtons() {

    const buttons =
        document.querySelectorAll(".show-password");


    buttons.forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const input =
                    document.getElementById(
                        button.dataset.target
                    );


                if (!input) {
                    return;
                }


                if (input.type === "password") {

                    input.type = "text";

                    button.textContent = "Hide";

                } else {

                    input.type = "password";

                    button.textContent = "Show";

                }

            }
        );

    });

}


/* =========================================================
   SIGNUP
========================================================= */

function setupSignup() {

    const form =
        document.getElementById("signupForm");


    /* Only run on signup.html */

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            /* -------------------------
               Validate name
            ------------------------- */

            if (name.length < 2) {

                showMessage(
                    "Please enter your full name."
                );

                return;

            }


            /* -------------------------
               Validate password
            ------------------------- */

            if (password.length < 6) {

                showMessage(
                    "Password must contain at least 6 characters."
                );

                return;

            }


            /* -------------------------
               Confirm password
            ------------------------- */

            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match."
                );

                return;

            }


            /* -------------------------
               Load accounts
            ------------------------- */

            const accounts =
                getAccounts();


            /* -------------------------
               Check duplicate email
            ------------------------- */

            const existingAccount =
                accounts.find(
                    function(account) {

                        return (
                            account.email === email
                        );

                    }
                );


            if (existingAccount) {

                showMessage(
                    "An account with this email already exists."
                );

                return;

            }


            /* -------------------------
               Create account
            ------------------------- */

            const newAccount = {

                name: name,

                email: email,

                password: password

            };


            accounts.push(newAccount);

            saveAccounts(accounts);


            /* -------------------------
               Success
            ------------------------- */

            showMessage(
                "Account created successfully!",
                true
            );


            /*
               Send user to login page.
               The email is passed through
               the URL so the login form
               can fill it automatically.
            */

            setTimeout(
                function() {

                    window.location.href =
                        "login.html?email=" +
                        encodeURIComponent(email);

                },
                700
            );

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    const form =
        document.getElementById("loginForm");


    /* Only run on login.html */

    if (!form) {
        return;
    }


    /* -------------------------
       Read email from URL
    ------------------------- */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const emailFromSignup =
        params.get("email");


    if (emailFromSignup) {

        document
            .getElementById("email")
            .value =
                emailFromSignup;

    }


    /* -------------------------
       Login
    ------------------------- */

    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById("password")
                    .value;


            const accounts =
                getAccounts();


            const account =
                accounts.find(
                    function(user) {

                        return (
                            user.email === email &&
                            user.password === password
                        );

                    }
                );


            /* -------------------------
               Incorrect login
            ------------------------- */

            if (!account) {

                showMessage(
                    "Incorrect email or password."
                );

                return;

            }


            /* -------------------------
               Successful login
            ------------------------- */

            saveSession(account);


            /*
               THIS is the connection
               to the main application.
            */

            window.location.href =
                "home.html";

        }
    );


    /* -------------------------
       Forgot password
    ------------------------- */

    const forgotButton =
        document.getElementById(
            "forgotPassword"
        );


    if (forgotButton) {

        forgotButton.addEventListener(
            "click",
            function() {

                showMessage(
                    "Password recovery will be added in the backend version."
                );

            }
        );

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupPasswordButtons();

        setupSignup();

        setupLogin();

    }
);
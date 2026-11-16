// ---------------------------------------------------------
// KCET EMPLOYEE LOGIN — Validation & Authentication
// ---------------------------------------------------------
(function () {
    'use strict';

    // -------------------------------------------------------
    // REGISTERED EMPLOYEE DATABASE
    // Passwords stored as SHA-256 hashes (hex).
    //
    // Demo credentials:
    //   vimalkumar.s@kcet.com  /  Vimal@2024
    //   saravanan.k@kcet.com   /  Sara@2024
    //   admin@kcet.com         /  Admin@2024
    //   employee@kcet.com      /  Employee@1
    // -------------------------------------------------------
    var EMPLOYEES = [
        {
            email: 'vimalkumar.s@kcet.com',
            hash: 'cd906d550efaa201fed4d18ebc0c72cde7f925c786f5795a126da2ef83ca2f7f',
            name: 'Vimalkumar S',
            empCode: '7001089'
        },
        {
            email: 'saravanan.k@kcet.com',
            hash: '0c4abf4208294889106a2f20be264eb7110ac24c40abef9663beb6cf5e1113b0',
            name: 'Saravanan K',
            empCode: '7001090'
        },
        {
            email: 'admin@kcet.com',
            hash: 'd3fc50c8f714cebd16d6c827826df01205bf519529f9d34775293cf9b70a420e',
            name: 'Admin User',
            empCode: '7000001'
        },
        {
            email: 'employee@kcet.com',
            hash: '7bf1ed397dc568f4b5b2a41f45019b2595db00621f06499549e27e2f16ec174a',
            name: 'Demo Employee',
            empCode: '7001000'
        }
    ];

    // -------------------------------------------------------
    // SHA-256 via Web Crypto API
    // -------------------------------------------------------
    async function sha256(str) {
        var buf = new TextEncoder().encode(str);
        var hashBuf = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf))
            .map(function (b) { return b.toString(16).padStart(2, '0'); })
            .join('');
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------
    function isValidEmailFormat(email) {
        // Simple, reliable email format check
        var parts = email.split('@');
        if (parts.length !== 2) return false;
        var local = parts[0];
        var domain = parts[1];
        if (!local || !domain) return false;
        if (domain.indexOf('.') === -1) return false;
        return true;
    }

    function isKcetEmail(email) {
        return email.toLowerCase().trim().endsWith('@kcet.com');
    }

    function findEmployee(email) {
        var lower = email.toLowerCase().trim();
        for (var i = 0; i < EMPLOYEES.length; i++) {
            if (EMPLOYEES[i].email === lower) return EMPLOYEES[i];
        }
        return null;
    }

    // -------------------------------------------------------
    // UI helpers
    // -------------------------------------------------------
    function showFieldError(groupEl, errorEl, textEl, msg) {
        if (!groupEl || !errorEl) return;
        groupEl.classList.remove('success');
        groupEl.classList.add('error');
        if (textEl) textEl.textContent = msg;
        errorEl.style.display = 'flex';
    }

    function clearFieldError(groupEl, errorEl) {
        if (!groupEl || !errorEl) return;
        groupEl.classList.remove('error');
        groupEl.classList.add('success');
        errorEl.style.display = 'none';
    }

    function resetField(groupEl, errorEl) {
        if (!groupEl || !errorEl) return;
        groupEl.classList.remove('error', 'success');
        errorEl.style.display = 'none';
    }

    function showBanner(bannerEl, textEl, msg) {
        if (!bannerEl) return;
        if (textEl) textEl.textContent = msg;
        bannerEl.style.display = 'flex';
    }

    function hideBanner(bannerEl) {
        if (!bannerEl) return;
        bannerEl.style.display = 'none';
    }

    function setBtnLoading(btn, loading) {
        if (!btn) return;
        btn.disabled = loading;
        var t = document.getElementById('login-btn-text');
        var ic = document.getElementById('login-btn-icon');
        var sp = document.getElementById('login-spinner');
        if (t)  t.textContent   = loading ? 'Signing In...' : 'Sign In';
        if (ic) ic.style.display = loading ? 'none' : 'inline';
        if (sp) sp.style.display = loading ? 'inline' : 'none';
    }

    // -------------------------------------------------------
    // Session & Remember Me
    // -------------------------------------------------------
    function saveSession(emp) {
        try {
            sessionStorage.setItem('kcet_logged_in', '1');
            sessionStorage.setItem('kcet_user', JSON.stringify({
                name: emp.name, email: emp.email, empCode: emp.empCode
            }));
        } catch (e) { /* ignore */ }
    }

    function rememberEmail(email, shouldRemember) {
        try {
            if (shouldRemember) {
                localStorage.setItem('kcet_remember', email);
            } else {
                localStorage.removeItem('kcet_remember');
            }
        } catch (e) { /* ignore */ }
    }

    function getRememberedEmail() {
        try { return localStorage.getItem('kcet_remember') || ''; }
        catch (e) { return ''; }
    }

    // -------------------------------------------------------
    // Boot
    // -------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        var form       = document.getElementById('loginForm');
        if (!form) return;

        var emailInput  = document.getElementById('username');
        var pwdInput    = document.getElementById('password');
        var emailGroup  = document.getElementById('username-group');
        var pwdGroup    = document.getElementById('password-group');
        var emailErr    = document.getElementById('email-error');
        var emailErrTxt = document.getElementById('email-error-text');
        var pwdErr      = document.getElementById('password-error');
        var pwdErrTxt   = document.getElementById('password-error-text');
        var banner      = document.getElementById('general-error');
        var bannerTxt   = document.getElementById('general-error-text');
        var submitBtn   = document.getElementById('login-submit-btn');
        var rememberChk = form.querySelector('input[type="checkbox"]');
        var toggleBtn   = form.querySelector('.toggle-password');
        var forgotLink  = form.querySelector('.forgot-link');

        // Pre-fill remembered email
        var remembered = getRememberedEmail();
        if (remembered && emailInput) {
            emailInput.value = remembered;
            if (rememberChk) rememberChk.checked = true;
        }

        // Show/Hide password
        if (toggleBtn && pwdInput) {
            toggleBtn.addEventListener('click', function () {
                var isHidden = pwdInput.type === 'password';
                pwdInput.type = isHidden ? 'text' : 'password';
                var icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye', !isHidden);
                    icon.classList.toggle('fa-eye-slash', isHidden);
                }
            });
        }

        // Forgot password
        if (forgotLink) {
            forgotLink.addEventListener('click', function (e) {
                e.preventDefault();
                alert('Please contact your HR administrator at hr@kcet.com to reset your password.');
            });
        }

        // Clear errors on input
        if (emailInput) {
            emailInput.addEventListener('input', function () {
                resetField(emailGroup, emailErr);
                hideBanner(banner);
            });
        }
        if (pwdInput) {
            pwdInput.addEventListener('input', function () {
                resetField(pwdGroup, pwdErr);
                hideBanner(banner);
            });
        }

        // ---- FORM SUBMIT ----
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            hideBanner(banner);

            var email    = emailInput ? emailInput.value.trim() : '';
            var password = pwdInput   ? pwdInput.value          : '';
            var valid    = true;

            // --- Email validation ---
            if (email === '') {
                showFieldError(emailGroup, emailErr, emailErrTxt, 'Please fill in all required fields.');
                valid = false;
            } else if (!isValidEmailFormat(email)) {
                showFieldError(emailGroup, emailErr, emailErrTxt, 'Invalid Email Address. Please enter a valid email format.');
                valid = false;
            } else if (!isKcetEmail(email)) {
                showFieldError(emailGroup, emailErr, emailErrTxt, 'Please enter a valid KCET email address (e.g. employee@kcet.com).');
                valid = false;
            } else {
                clearFieldError(emailGroup, emailErr);
            }

            // --- Password validation ---
            if (password === '') {
                showFieldError(pwdGroup, pwdErr, pwdErrTxt, 'Please fill in all required fields.');
                valid = false;
            } else {
                clearFieldError(pwdGroup, pwdErr);
            }

            if (!valid) return;

            // --- Authenticate ---
            setBtnLoading(submitBtn, true);

            sha256(password).then(function (enteredHash) {

                var emp = findEmployee(email);

                if (!emp) {
                    showFieldError(emailGroup, emailErr, emailErrTxt, 'Please enter a valid KCET email address.');
                    showBanner(banner, bannerTxt, 'This email is not registered. Please contact HR.');
                    setBtnLoading(submitBtn, false);
                    return;
                }

                if (enteredHash !== emp.hash) {
                    showFieldError(pwdGroup, pwdErr, pwdErrTxt, 'Incorrect password. Please try again.');
                    showBanner(banner, bannerTxt, 'Incorrect password. Please try again.');
                    if (pwdInput) pwdInput.value = '';
                    setBtnLoading(submitBtn, false);
                    return;
                }

                // ✅ Login successful
                saveSession(emp);
                rememberEmail(email, rememberChk ? rememberChk.checked : false);

                // Success button feedback
                if (submitBtn) submitBtn.style.background = '#22c55e';
                var t  = document.getElementById('login-btn-text');
                var ic = document.getElementById('login-btn-icon');
                var sp = document.getElementById('login-spinner');
                if (t)  t.textContent   = 'Success! Redirecting...';
                if (ic) { ic.className  = 'fa-solid fa-check'; ic.style.display = 'inline'; }
                if (sp) sp.style.display = 'none';

                setTimeout(function () {
                    var loginView = document.getElementById('app-login-view');
                    var dashView  = document.getElementById('app-dashboard-view');
                    if (loginView && dashView) {
                        loginView.style.display = 'none';
                        dashView.style.display  = 'block';
                        document.body.classList.remove('login-body');
                        window.scrollTo(0, 0);
                    } else {
                        window.location.reload();
                    }
                }, 1000);

            }).catch(function (err) {
                console.error('Auth error:', err);
                showBanner(banner, bannerTxt, 'An unexpected error occurred. Please try again.');
                setBtnLoading(submitBtn, false);
            });
        });
    });

})();

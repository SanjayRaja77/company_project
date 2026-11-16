// ==========================================================
// UNIVERSAL PROFILE LOADER
// Runs on EVERY page — syncs profile photo, name, code etc.
// from localStorage so the sidebar is always up to date.
// ==========================================================
(function () {
    var DEFAULTS = {
        name: 'Vimalkumar S',
        code: '7001089',
        designation: 'Team Leader',
        phone: '8012616806',
        email: 'Vimalkumar.S@kcet.com',
        experience: '07.08 years',
        completeness: '89',
        image: 'default-avatar.svg'
    };

    // Safe getter — treats 'undefined'/'null' strings as missing
    function val(v, def) {
        if (!v || v === 'undefined' || v === 'null') return def;
        return v;
    }

    // Fix corrupted localStorage on every page load
    (function cleanStorage() {
        try {
            var stored = localStorage.getItem('userProfile');
            if (stored) {
                var p = JSON.parse(stored);
                if (!p.code || p.code === 'undefined' || !p.completeness || p.completeness === 'undefined') {
                    localStorage.removeItem('userProfile');
                }
            }
        } catch (e) { localStorage.removeItem('userProfile'); }
    })();

    function getProfile() {
        try {
            var stored = localStorage.getItem('userProfile');
            var imgStored = localStorage.getItem('kcet_profile_image'); // profile-sync.js key
            if (stored) {
                var p = JSON.parse(stored);
                return {
                    name: val(p.name, DEFAULTS.name),
                    code: val(p.code, DEFAULTS.code),
                    designation: val(p.designation, DEFAULTS.designation),
                    phone: val(p.phone, DEFAULTS.phone),
                    email: val(p.email, DEFAULTS.email),
                    experience: val(p.experience, DEFAULTS.experience),
                    completeness: val(p.completeness, DEFAULTS.completeness),
                    // prefer dedicated image key, then profile obj image, then default
                    image: val(imgStored, null) || val(p.image, null) || DEFAULTS.image
                };
            }
        } catch (e) { }
        return Object.assign({}, DEFAULTS);
    }

    function applyProfile(p) {
        // Profile photo — always prefer kcet_profile_image (global sync key)
        var _bestImg = (function() {
            try {
                var s = localStorage.getItem('kcet_profile_image');
                if (s && s !== 'null' && s !== 'undefined') return s;
            } catch(e) {}
            return p.image || 'default-avatar.svg';
        })();
        document.querySelectorAll('#profile-img').forEach(function (el) {
            el.src = _bestImg;
            el.onerror = function() { this.src = 'default-avatar.svg'; };
        });
        // Name
        document.querySelectorAll('#sidebar-name').forEach(function (el) {
            el.textContent = p.name + ' Profile';
        });
        // Code
        document.querySelectorAll('#sidebar-code').forEach(function (el) {
            el.textContent = 'Employee Code: ' + p.code;
        });
        // Designation
        document.querySelectorAll('#sidebar-designation').forEach(function (el) {
            el.textContent = p.designation;
        });
        // Phone
        document.querySelectorAll('#sidebar-phone').forEach(function (el) {
            el.innerHTML = '<i class="fa-solid fa-phone"></i> ' + p.phone;
        });
        // Email
        document.querySelectorAll('#sidebar-email').forEach(function (el) {
            el.innerHTML = '<i class="fa-solid fa-envelope"></i> ' + p.email;
        });
        // Experience
        document.querySelectorAll('#sidebar-exp-years').forEach(function (el) {
            el.textContent = p.experience;
        });
        // Completeness
        var pct = p.completeness;
        document.querySelectorAll('#sidebar-completeness-text').forEach(function (el) {
            el.textContent = 'Profile completeness: ' + pct + '%';
        });
        document.querySelectorAll('#sidebar-progress-bar').forEach(function (el) {
            el.style.width = pct + '%';
        });
    }

    // Apply immediately when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        applyProfile(getProfile());

        // Profile photo change — only on index page (edit-photo-btn exists)
        var editBtn = document.getElementById('edit-photo-btn');
        var uploadInput = document.getElementById('profile-upload');
        if (editBtn && uploadInput) {
            // Remove any old click listeners by cloning
            var newEditBtn = editBtn.cloneNode(true);
            editBtn.parentNode.replaceChild(newEditBtn, editBtn);
            newEditBtn.addEventListener('click', function () { uploadInput.click(); });

            uploadInput.addEventListener('change', function () {
                var file = this.files && this.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (e) {
                    // Save new image to localStorage
                    var profile = getProfile();
                    profile.image = e.target.result;
                    try { localStorage.setItem('userProfile', JSON.stringify(profile)); } catch (err) { }
                    // Apply immediately on this page
                    applyProfile(profile);
                };
                reader.readAsDataURL(file);
            });
        }
    });
})();
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');

            // Only switch if there's a real target defined
            if (target) {
                // Remove active class from all tabs
                tabBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked tab
                btn.classList.add('active');

                // Switch Content Panels
                const allPanels = document.querySelectorAll('.content-panel.tab-content');
                allPanels.forEach(panel => {
                    if (panel.id === target) {
                        panel.style.display = 'block';
                        panel.classList.add('active'); // helpful if using CSS transitions
                    } else {
                        panel.style.display = 'none';
                        panel.classList.remove('active');
                    }
                });
            } else {
                // For demo purposes, if clicked on placeholder tabs
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Hide all main panels to show it's "empty" or just do nothing?
                // For now, let's keep the user on the current view visually or alert?
                // Better: Do nothing if no target, OR if user clicks "Personal Info" (no target yet)
                // maybe show Basic Info or stick to current?
                // Let's just log it. The user only asked for Org Info content.
                console.log('Tab clicked without content target');
            }
        });
    });

    // Sync Basic Info to Profile Sidebar
    const inputEmpCode = document.getElementById('input-emp-code');
    const inputFirstName = document.getElementById('input-first-name');
    const inputLastName = document.getElementById('input-last-name');
    const inputEmail = document.getElementById('input-email');
    const inputMobile = document.getElementById('input-mobile');

    const sidebarCode = document.getElementById('sidebar-code');
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarEmail = document.getElementById('sidebar-email');
    const sidebarPhone = document.getElementById('sidebar-phone');

    function updateProfile() {
        if (sidebarCode && inputEmpCode) {
            sidebarCode.textContent = 'Employee Code: ' + inputEmpCode.value;
        }
        if (sidebarName && inputFirstName && inputLastName) {
            // Check if values exist to avoid awkward spacing
            const fullName = [inputFirstName.value, inputLastName.value].filter(Boolean).join(' ');
            sidebarName.textContent = fullName + (fullName ? ' Profile' : 'Profile');
        }
        if (sidebarEmail && inputEmail) {
            // Preserve the icon
            sidebarEmail.innerHTML = '<i class="fa-solid fa-envelope"></i> ' + inputEmail.value;
        }
        if (sidebarPhone && inputMobile) {
            // Preserve the icon
            sidebarPhone.innerHTML = '<i class="fa-solid fa-phone"></i> ' + inputMobile.value;
        }
    }

    const inputs = [inputEmpCode, inputFirstName, inputLastName, inputEmail, inputMobile];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updateProfile);
        }
    });

    // Edit/Save Toggle Logic
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const formInputs = document.querySelectorAll('.info-grid input');

    if (editBtn && saveBtn) {
        editBtn.addEventListener('click', () => {
            // Switch to Edit Mode
            formInputs.forEach(input => {
                // Ensure we don't enable readonly fields that SHOULD stay readonly (like auto-calculated ones if any)
                // For now, we assume all inputs in this form are editable except maybe those specifically marked constant in a real app
                // But specifically for this request, we enable all or specific ones. 
                // Let's enable all inputs that were made readonly.
                input.removeAttribute('readonly');
            });
            editBtn.style.display = 'none';
            saveBtn.style.display = 'flex';

            // Focus on the first input
            if (formInputs.length > 0) formInputs[0].focus();
        });

        saveBtn.addEventListener('click', () => {
            // Switch back to View Mode (Save)
            formInputs.forEach(input => {
                input.setAttribute('readonly', true);
            });
            saveBtn.style.display = 'none';
            editBtn.style.display = 'flex';

            // Optional: Show a simple alert or notification
            // alert('Changes saved successfully!'); 
        });
    }

    // Profile photo upload is handled by the Profile Modal (index.html inline script + profile-sync.js)



    // Payroll Page Logic
    const paySelectYear = document.getElementById('pay-year-select');
    const paySelectMonth = document.getElementById('pay-month-select');
    const showPayBtn = document.getElementById('show-pay-btn');
    const selectedPeriodDisplay = document.getElementById('selected-period-display');

    if (paySelectYear && paySelectMonth && showPayBtn && selectedPeriodDisplay) {
        // Populate Dropdowns
        const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Populate Years
        paySelectYear.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            paySelectYear.appendChild(option);
        });

        // Populate Months
        paySelectMonth.innerHTML = '';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            paySelectMonth.appendChild(option);
        });

        showPayBtn.addEventListener('click', () => {
            const year = paySelectYear.value;
            const month = paySelectMonth.value;

            if (year && month) {
                // Update the display text to "Month Year" format e.g. "April 2024"
                selectedPeriodDisplay.textContent = `${month} ${year}`;

                // Also update modal month if it exists
                const slipMonth = document.getElementById('slip-month');
                if (slipMonth) slipMonth.textContent = `${month} ${year}`;
            }
        });

        // Pay Edit/Save Logic
        const payEditBtn = document.getElementById('pay-edit-btn');
        const paySaveBtn = document.getElementById('pay-save-btn');
        const payInputs = document.querySelectorAll('.pay-input');

        // Items and Totals
        const earningItems = document.querySelectorAll('.earning-item');
        const deductionItems = document.querySelectorAll('.deduction-item');
        const totalEarningsInputs = document.querySelectorAll('.total-earnings'); // Might be multiple (header/row) wait, I only added class to row.
        const totalDeductionsInputs = document.querySelectorAll('.total-deductions');
        const netSalaryInputs = document.querySelectorAll('.net-salary');

        function parseAmount(str) {
            // Remove commas and convert to float
            return parseFloat(str.replace(/,/g, '')) || 0;
        }

        function formatAmount(num) {
            // Format with commas and 2 decimals
            return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function updatePayrollTotals() {
            let totalEarnings = 0;
            let totalDeductions = 0;

            earningItems.forEach(item => {
                totalEarnings += parseAmount(item.value);
            });

            deductionItems.forEach(item => {
                totalDeductions += parseAmount(item.value);
            });

            const netSalary = totalEarnings - totalDeductions;

            // Update DOM
            totalEarningsInputs.forEach(input => input.value = formatAmount(totalEarnings));
            totalDeductionsInputs.forEach(input => input.value = formatAmount(totalDeductions));
            netSalaryInputs.forEach(input => input.value = formatAmount(netSalary));

            // Also the one weird static text in footer if it exists
            const footerTotal = document.querySelector('td.amount.bold-text[style*="font-size: 14px;"]');
            if (footerTotal) {
                footerTotal.textContent = formatAmount(totalEarnings); // It seems this was earnings total in the image?
            }
        }

        if (payEditBtn && paySaveBtn) {
            payEditBtn.addEventListener('click', () => {
                // Enable only items, not totals
                earningItems.forEach(input => input.removeAttribute('readonly'));
                deductionItems.forEach(input => input.removeAttribute('readonly'));

                payEditBtn.style.display = 'none';
                paySaveBtn.style.display = 'flex';
            });

            paySaveBtn.addEventListener('click', () => {
                // Determine logic: lock everything back
                payInputs.forEach(input => input.setAttribute('readonly', true));

                paySaveBtn.style.display = 'none';
                payEditBtn.style.display = 'flex';
            });

            // Add listeners to items
            const allEditableItems = [...earningItems, ...deductionItems];
            allEditableItems.forEach(input => {
                input.addEventListener('input', updatePayrollTotals);
            });

            // Initial calculation to fix the "dummy data" inconsistencies from the image immediately?
            // User said "if user edit value it should also the correct value".
            // Let's run it once on load to be safe? Or only on edit?
            // If we run on load, we might change the visual values from the image immediately.
            // But the image values were wrong (50k total vs 65k sum).
            // Let's run it once to ensure consistency.
            updatePayrollTotals();
        }

        // View Payslip Logic
        const viewPayslipBtn = document.getElementById('view-payslip-btn');
        const modal = document.getElementById('payslip-modal');
        const closeModalSpan = document.querySelector('.close-modal');
        const closeBtn = document.getElementById('close-btn');
        const printBtn = document.getElementById('print-btn');
        const payslipBody = document.getElementById('payslip-body');
        const slipTotalEarnings = document.getElementById('slip-total-earnings');
        const slipTotalDeductions = document.getElementById('slip-total-deductions');
        const slipNetSalary = document.getElementById('slip-net-salary');
        const slipMonth = document.getElementById('slip-month');

        if (viewPayslipBtn && modal) {
            viewPayslipBtn.addEventListener('click', () => {
                // Populate Modal Data
                payslipBody.innerHTML = '';
                const earningItems = document.querySelectorAll('.earning-item');
                const deductionItems = document.querySelectorAll('.deduction-item'); // Assuming equal length roughly or max length
                const earningsNames = ["Basic Salary", "Conveyance Allowance", "Medical Allowance", "Lunch Allowance"];
                const deductionsNames = [null, "Provident Fund (PF)", "Professional Tax", "Income Tax"]; // First was header in original table

                const maxLength = Math.max(earningItems.length, deductionItems.length);

                for (let i = 0; i < maxLength; i++) {
                    const row = document.createElement('tr');

                    // Earning Side
                    const earnNameTd = document.createElement('td');
                    earnNameTd.textContent = earningsNames[i] || '';
                    const earnAmountTd = document.createElement('td');
                    earnAmountTd.textContent = earningItems[i] ? earningItems[i].value : '';

                    // Deduction Side
                    const dedNameTd = document.createElement('td');
                    dedNameTd.textContent = deductionsNames[i] || ''; // Handle nulls/gaps
                    const dedAmountTd = document.createElement('td');
                    dedAmountTd.textContent = deductionItems[i] ? deductionItems[i].value : '';

                    row.appendChild(earnNameTd);
                    row.appendChild(earnAmountTd);
                    row.appendChild(dedNameTd);
                    row.appendChild(dedAmountTd);

                    // Special case to skip the header row "Deductions | Amount" which was index 1 visually in table but loop logic cleaner like this
                    // Actually my logic above maps index 0 to Basic etc.
                    // Lets map strictly based on the HTML structure I added classes to.
                    // The classes .earning-item are on 4 inputs. .deduction-item on 3 inputs.
                    // My arrays: earningsNames has 4. deductionsNames has 4 (with null).
                    // Actually, let's just grab values.

                    // Correct mapping based on the row structure in HTML:
                    // Row 0: Basic (E) | PF is in Row 2? No.
                    // Let's rely on the DOM order of .earning-item vs .deduction-item.
                    // Earnings: [Basic, Conveyance, Medical, Lunch]
                    // Deductions: [PF, ProTax, IncomeTax] -> wait, PF is index 0 in DOM list?
                    // Let's check HTML. 
                    // PF is in row 2 (index 2 in dom query?) No, querySelectorAll returns in doc order.
                    // Row 0: Basic
                    // Row 1: Conveyance
                    // Row 2: Medical | PF
                    // Row 3: Lunch | ProTax
                    // Row 4: IncomeTax

                    // So deduction items list: [PF, ProTax, IncomeTax]. (Size 3)
                    // Earning items list: [Basic, Conv, Med, Lunch]. (Size 4)

                    // Let's overwrite the loop to be more robust.
                    payslipBody.appendChild(row);
                }

                // Re-build innerHTML explicitly for better control
                payslipBody.innerHTML = '';
                const earns = Array.from(document.querySelectorAll('.earning-item')).map(i => i.value);
                const deds = Array.from(document.querySelectorAll('.deduction-item')).map(i => i.value);

                const rowsData = [
                    { eName: "Basic Salary", eVal: earns[0], dName: "", dVal: "" },
                    { eName: "Conveyance Allowance", eVal: earns[1], dName: "", dVal: "" },
                    { eName: "Medical Allowance", eVal: earns[2], dName: "Provident Fund (PF)", dVal: deds[0] },
                    { eName: "Lunch Allowance", eVal: earns[3], dName: "Professional Tax", dVal: deds[1] },
                    { eName: "", eVal: "", dName: "Income Tax", dVal: deds[2] }
                ];

                rowsData.forEach(data => {
                    const row = `<tr>
                        <td>${data.eName}</td>
                        <td>${data.eVal}</td>
                        <td>${data.dName}</td>
                        <td>${data.dVal}</td>
                    </tr>`;
                    payslipBody.insertAdjacentHTML('beforeend', row);
                });

                // Update Totals
                slipTotalEarnings.textContent = document.querySelector('.total-earnings').value;
                slipTotalDeductions.textContent = document.querySelector('.total-deductions').value;
                slipNetSalary.textContent = document.querySelector('.net-salary').value;

                // Update Date
                slipMonth.textContent = document.getElementById('selected-period-display').innerText;

                modal.style.display = 'block';
            });

            const closeAction = () => modal.style.display = 'none';
            closeModalSpan.onclick = closeAction;
            closeBtn.onclick = closeAction;
            window.onclick = (event) => {
                if (event.target == modal) closeAction();
            };

            printBtn.onclick = () => {
                window.print();
            };
        }
    }
});

// ---------------------------------------------------------
// ANTIGRAVITY AGENT: Profile Data Synchronization Logic
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    // Safe getter
    function safeVal(v, def) {
        if (!v || v === 'undefined' || v === 'null') return def;
        return v;
    }

    // Default Profile Data (Matches initial HTML)
    const DEFAULT_PROFILE = {
        name: "Vimalkumar S",
        code: "7001089",
        designation: "Team Leader",
        phone: "8012616806",
        email: "Vimalkumar.S@kcet.com",
        experience: "07.08 years",
        completeness: "89",
        image: "default-avatar.svg"
    };

    // Load from LocalStorage � always merge with defaults to prevent undefined fields
    function loadProfile() {
        try {
            const stored = localStorage.getItem('userProfile');
            const imgStored2 = localStorage.getItem('kcet_profile_image');
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    name: safeVal(parsed.name, DEFAULT_PROFILE.name),
                    code: safeVal(parsed.code, DEFAULT_PROFILE.code),
                    designation: safeVal(parsed.designation, DEFAULT_PROFILE.designation),
                    phone: safeVal(parsed.phone, DEFAULT_PROFILE.phone),
                    email: safeVal(parsed.email, DEFAULT_PROFILE.email),
                    experience: safeVal(parsed.experience, DEFAULT_PROFILE.experience),
                    completeness: safeVal(parsed.completeness, DEFAULT_PROFILE.completeness),
                    image: safeVal(imgStored2, null) || safeVal(parsed.image, null) || DEFAULT_PROFILE.image
                };
            }
        } catch (e) { }
        return Object.assign({}, DEFAULT_PROFILE);
    }

    // Save to LocalStorage and Update UI
    function saveProfile(data) {
        localStorage.setItem('userProfile', JSON.stringify(data));
        updateSidebarUI(data);
    }

    // Update Sidebar Elements
    function updateSidebarUI(data) {
        // Name
        const nameParams = document.querySelectorAll('#sidebar-name');
        nameParams.forEach(el => el.textContent = data.name + " Profile");

        // Code
        const codeParams = document.querySelectorAll('#sidebar-code');
        codeParams.forEach(el => el.textContent = "Employee Code: " + data.code);

        // Designation
        const desParams = document.querySelectorAll('#sidebar-designation');
        desParams.forEach(el => el.textContent = data.designation);

        // Phone
        const phoneParams = document.querySelectorAll('#sidebar-phone');
        phoneParams.forEach(el => el.innerHTML = '<i class="fa-solid fa-phone"></i> ' + data.phone);

        // Email
        const emailParams = document.querySelectorAll('#sidebar-email');
        emailParams.forEach(el => el.innerHTML = '<i class="fa-solid fa-envelope"></i> ' + data.email);

        // Experience
        const expParams = document.querySelectorAll('#sidebar-exp-years');
        expParams.forEach(el => el.textContent = data.experience);

        // Completeness Text
        const compTextParams = document.querySelectorAll('#sidebar-completeness-text');
        compTextParams.forEach(el => el.textContent = "Profile completeness: " + data.completeness + "%");

        // Progress Bar
        const progParams = document.querySelectorAll('#sidebar-progress-bar');
        progParams.forEach(el => el.style.width = data.completeness + "%");

        // Image — always prefer the global kcet_profile_image (set by profile-sync.js)
        const imgParams = document.querySelectorAll('#profile-img');
        const _syncedImg = localStorage.getItem('kcet_profile_image');
        const _finalImg  = (_syncedImg && _syncedImg !== 'null' && _syncedImg !== 'undefined')
                            ? _syncedImg : (data.image || 'default-avatar.svg');
        imgParams.forEach(el => { el.src = _finalImg; el.onerror = function(){ this.src='default-avatar.svg'; }; });
    }

    // Initialize Profile Logic
    let currentProfile = loadProfile();
    updateSidebarUI(currentProfile);

    // ---- Real-time sync: Basic Info fields → Sidebar as you type ----
    function syncFormToSidebar() {
        const firstName = document.getElementById('input-first-name');
        const lastName = document.getElementById('input-last-name');
        const empCode = document.getElementById('input-emp-code');
        const emailFld = document.getElementById('input-email');
        const mobileFld = document.getElementById('input-mobile');

        const name = [firstName ? firstName.value : '', lastName ? lastName.value : ''].filter(Boolean).join(' ');
        const code = empCode ? empCode.value : '';
        const email = emailFld ? emailFld.value : '';
        const phone = mobileFld ? mobileFld.value : '';

        if (name) document.querySelectorAll('#sidebar-name').forEach(el => el.textContent = name + ' Profile');
        if (code) document.querySelectorAll('#sidebar-code').forEach(el => el.textContent = 'Employee Code: ' + code);
        if (email) document.querySelectorAll('#sidebar-email').forEach(el => el.innerHTML = '<i class="fa-solid fa-envelope"></i> ' + email);
        if (phone) document.querySelectorAll('#sidebar-phone').forEach(el => el.innerHTML = '<i class="fa-solid fa-phone"></i> ' + phone);
    }

    // Attach live-sync listeners to Basic Info fields
    ['input-first-name', 'input-last-name', 'input-emp-code', 'input-email', 'input-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', syncFormToSidebar);
    });

    // --- Save Button: persist all Basic Info fields to profile ---
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const firstNameInput = document.getElementById('input-first-name');
            const lastNameInput = document.getElementById('input-last-name');
            const empCodeInput = document.getElementById('input-emp-code');
            const mobileInput = document.getElementById('input-mobile');
            const emailInput = document.getElementById('input-email');

            if (firstNameInput && lastNameInput)
                currentProfile.name = [firstNameInput.value, lastNameInput.value].filter(Boolean).join(' ');
            if (empCodeInput) currentProfile.code = empCodeInput.value;
            if (mobileInput) currentProfile.phone = mobileInput.value;
            if (emailInput) currentProfile.email = emailInput.value;

            saveProfile(currentProfile);
        });
    }

    // Image Upload Logic
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    const profileUpload = document.getElementById('profile-upload');

    // Trigger file input when edit button is clicked
    if (editPhotoBtn && profileUpload) {
        editPhotoBtn.addEventListener('click', () => {
            profileUpload.click();
        });
    }

    // Handle File Selection
    if (profileUpload) {
        profileUpload.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    currentProfile.image = e.target.result; // Base64 string
                    saveProfile(currentProfile);
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});


// ---------------------------------------------------------
// ANTIGRAVITY AGENT: Leave Page Logic
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    console.log("Antigravity: Leave Page Logic Loaded");

    // 1. Tab Switching for Dashboard
    const dashTabs = document.querySelectorAll('.dash-tabs li');
    const tabContents = document.querySelectorAll('.tab-content');

    dashTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            // Toggle Active Tab
            dashTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Toggle Content Visibility
            tabContents.forEach(content => {
                if (content.id === `content-${target}`) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
            console.log(`Antigravity: Switched to tab ${target}`);
        });
    });

    // 2. Populate Selection Dropdowns (Year & Month)
    const yearSelect = document.getElementById('leave-year-select');
    const monthSelect = document.getElementById('leave-month-select');

    if (yearSelect && monthSelect) {
        const currentYear = new Date().getFullYear();
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Clear first
        yearSelect.innerHTML = '';
        monthSelect.innerHTML = '';

        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }

        months.forEach((m, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = m;
            if (index === new Date().getMonth()) option.selected = true;
            monthSelect.appendChild(option);
        });
        console.log("Antigravity: Dropdowns populated");
    }

    // 2. Edit functionality for Leave Panels
    function setupPanelEditing(editBtnId, saveBtnId, containerSelector) {
        const editBtn = document.getElementById(editBtnId);
        const saveBtn = document.getElementById(saveBtnId);

        if (!editBtn || !saveBtn) {
            console.warn(`Antigravity: Edit buttons not found: ${editBtnId}, ${saveBtnId}`);
            return;
        }

        const header = editBtn.closest('.panel-header-orange');
        const panel = header.closest('.content-panel');
        const list = panel.querySelector('.panel-list');

        // Allow clicking the text/numbers directly to edit? 
        // Let's stick to the button first but ensure it works.

        editBtn.addEventListener('click', () => {
            console.log(`Antigravity: Edit clicked for ${editBtnId}`);
            // Toggle Buttons
            editBtn.style.setProperty('display', 'none', 'important');
            saveBtn.style.setProperty('display', 'inline-block', 'important');

            // Editable Counts
            const counts = list.querySelectorAll('.count');
            counts.forEach(span => {
                const currentVal = span.textContent;
                const input = document.createElement('input');
                input.type = 'number';
                input.value = currentVal;
                input.className = 'edit-count-input';
                span.replaceWith(input);
            });

            // Editable Text Labels (e.g. "Earned Leave")
            const labels = list.querySelectorAll('.item-left span');
            labels.forEach(span => {
                const currentText = span.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = 'edit-text-input';
                span.replaceWith(input);
            });
        });

        saveBtn.addEventListener('click', () => {
            console.log(`Antigravity: Save clicked for ${saveBtnId}`);
            // Toggle Buttons
            saveBtn.style.setProperty('display', 'none', 'important');
            editBtn.style.setProperty('display', 'inline-block', 'important');

            // Save Counts
            const inputsCount = list.querySelectorAll('.edit-count-input');
            inputsCount.forEach(input => {
                const val = input.value;
                const span = document.createElement('span');
                span.className = 'count';
                span.textContent = val;
                input.replaceWith(span);
            });

            // Save Texts
            const inputsText = list.querySelectorAll('.edit-text-input');
            inputsText.forEach(input => {
                const val = input.value;
                const span = document.createElement('span');
                span.textContent = val;
                input.replaceWith(span);
            });
        });
    }

    setupPanelEditing('edit-balance-btn', 'save-balance-btn', '.content-panel');
    setupPanelEditing('edit-requests-btn', 'save-requests-btn', '.content-panel');

    // 3. New Leave Summary Editing
    const editSummaryBtn = document.getElementById('edit-summary-btn');
    const saveSummaryBtn = document.getElementById('save-summary-btn');

    if (editSummaryBtn && saveSummaryBtn) {
        editSummaryBtn.addEventListener('click', () => {
            editSummaryBtn.style.display = 'none';
            saveSummaryBtn.style.display = 'inline-block';

            document.querySelectorAll('.editable-val').forEach(span => {
                const val = span.textContent;
                const input = `<input type="number" class="edit-summary-input" value="${val}" style="width: 40px; border: 1px solid #ddd; border-radius: 4px; padding: 2px;">`;
                span.dataset.oldVal = val;
                span.innerHTML = input;
            });
        });

        saveSummaryBtn.addEventListener('click', () => {
            saveSummaryBtn.style.display = 'none';
            editSummaryBtn.style.display = 'inline-block';

            document.querySelectorAll('.editable-val').forEach(span => {
                const input = span.querySelector('input');
                if (input) {
                    span.textContent = input.value;
                }
            });
        });
    }

    // 4. Leave Type Cards Editing
    document.querySelectorAll('.type-card').forEach(card => {
        const editBtn = card.querySelector('.edit-type-btn');
        const saveBtn = card.querySelector('.save-type-btn');
        if (!editBtn || !saveBtn) return;

        editBtn.addEventListener('click', () => {
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';

            const countEl = card.querySelector('.type-count');
            const labelEl = card.querySelector('.type-label');

            if (countEl) {
                const val = countEl.textContent;
                countEl.innerHTML = `<input type="number" class="edit-type-input" value="${val}" style="width: 45px; border: 1px solid var(--primary-orange); border-radius: 3px; font-weight: 700;">`;
            }
            if (labelEl) {
                const txt = labelEl.textContent;
                labelEl.innerHTML = `<input type="text" class="edit-type-text" value="${txt}" style="width: 100%; border: 1px solid #ddd; border-radius: 3px; font-size: 13px;">`;
            }
        });

        saveBtn.addEventListener('click', () => {
            saveBtn.style.display = 'none';
            editBtn.style.display = 'inline-block';

            const countInput = card.querySelector('.edit-type-input');
            const labelInput = card.querySelector('.edit-type-text');
            const progress = card.querySelector('.type-progress');

            if (countInput) {
                const newVal = countInput.value;
                const countEl = card.querySelector('.type-count');
                countEl.textContent = newVal.padStart(2, '0');

                // Update progress bar (cap at 100%)
                if (progress) {
                    const percentage = Math.min(100, (parseInt(newVal) / 20) * 100);
                    progress.style.width = percentage + '%';
                }
            }
            if (labelInput) {
                const newText = labelInput.value;
                const labelEl = card.querySelector('.type-label');
                labelEl.textContent = newText;
            }
        });
    });
});

// ---------------------------------------------------------
// ANTIGRAVITY AGENT: Detailed Leave Sync & Persistence
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const leaveForm = document.getElementById('leave-form');
    const historyTable = document.getElementById('history-table-body');
    const balanceTable = document.getElementById('balance-table-body');

    if (leaveForm) {

        // 1. Initial State / Storage
        let leaveData = JSON.parse(localStorage.getItem('leaveData')) || {
            "Sick Leave": { used: 5, total: 10, availed: 5, entitled: 10, balance: 5 },
            "Earned Leave": { used: 3, total: 10, availed: 5, entitled: 24, cf: 10, balance: 29 },
            "Casual Leave": { used: 6, total: 10, availed: 6, entitled: 12, balance: 6 },
            "Maternity Leave": { used: 0, total: 180, availed: 0, entitled: 180, balance: 180 }
        };

        let historyData = JSON.parse(localStorage.getItem('historyData')) || [
            { type: "Sick", dates: "Apr 25", reason: "Flu recovery", submitted: "Apr 25", status: "Pending", assigned: "N/A" },
            { type: "Casual", dates: "Apr 15 - Apr 18", reason: "Home shifting", submitted: "Apr 07", status: "Approved", assigned: "Sarah M." },
            { type: "Sick", dates: "Jan 29", reason: "Family outing", submitted: "Feb 01", status: "Rejected", assigned: "Ali Zubairi" }
        ];

        // 2. Update Function
        function updateLeaveUI() {
            console.log("Antigravity: Synchronizing Leave Summary & Balance UI...");

            // Update Summary Cards
            const sickUsage = document.getElementById('sick-usage');
            if (sickUsage) sickUsage.innerHTML = `${leaveData["Sick Leave"].used} <span>/ ${leaveData["Sick Leave"].total} Days Used</span>`;
            if (document.getElementById('sick-progress')) document.getElementById('sick-progress').style.width = (leaveData["Sick Leave"].used / leaveData["Sick Leave"].total * 100) + '%';

            const vacUsage = document.getElementById('vacation-usage');
            if (vacUsage) vacUsage.innerHTML = `${leaveData["Earned Leave"].used} <span>/ ${leaveData["Earned Leave"].total} Days Used</span>`;
            if (document.getElementById('vacation-progress')) document.getElementById('vacation-progress').style.width = (leaveData["Earned Leave"].used / leaveData["Earned Leave"].total * 100) + '%';

            const casUsage = document.getElementById('casual-usage');
            if (casUsage) casUsage.innerHTML = `${leaveData["Casual Leave"].used} <span>/ ${leaveData["Casual Leave"].total} Days Used</span>`;
            if (document.getElementById('casual-progress')) document.getElementById('casual-progress').style.width = (leaveData["Casual Leave"].used / leaveData["Casual Leave"].total * 100) + '%';

            // Update Overall Balance Card
            const totalBalance = Object.values(leaveData).reduce((sum, item) => sum + item.balance, 0);
            const totalEntitled = Object.values(leaveData).reduce((sum, item) => sum + item.entitled, 0);
            const totalBalanceDisplay = document.getElementById('total-balance-usage');
            if (totalBalanceDisplay) {
                totalBalanceDisplay.innerHTML = `${totalBalance} <span>Days Available</span>`;
            }
            const totalBalanceProgress = document.getElementById('total-balance-progress');
            if (totalBalanceProgress) {
                const percentage = (totalBalance / totalEntitled) * 100;
                totalBalanceProgress.style.width = percentage + '%';
            }

            // Update Balance Table
            if (balanceTable) {
                const rows = balanceTable.querySelectorAll('tr[data-type]');
                rows.forEach(row => {
                    const type = row.getAttribute('data-type');
                    if (leaveData[type]) {
                        const tds = row.querySelectorAll('td');
                        if (tds.length >= 6) {
                            tds[2].textContent = leaveData[type].availed;
                            tds[5].textContent = leaveData[type].balance;
                        }
                    }
                });
            }

            // Update History Table (only if not dynamically controlled by backend engine)
            if (historyTable && !window.KCET_BACKEND_LEAVE) {
                historyTable.innerHTML = '';
                historyData.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>${item.type}</td>
                    <td>${item.dates}</td>
                    <td>${item.reason}</td>
                    <td>${item.submitted}</td>
                    <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                    <td>${item.assigned}</td>
                    <td><i class="fa-solid fa-ellipsis-vertical action-dots"></i></td>
                `;
                    historyTable.appendChild(row);
                });
            }

            // Save
            localStorage.setItem('leaveData', JSON.stringify(leaveData));
            if (!window.KCET_BACKEND_LEAVE) {
                localStorage.setItem('historyData', JSON.stringify(historyData));
            }
        }

        // 3. Form Submit (only if not handled by backend engine)
        if (!window.KCET_BACKEND_LEAVE) {
            leaveForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const typeSelect = document.getElementById('leave-type-select');
            const type = typeSelect.value;
            const durationSelect = document.getElementById('duration-select');
            const duration = parseFloat(durationSelect.value);
            const startDateVal = document.getElementById('start-date').value;
            const endDateVal = document.getElementById('end-date').value;
            const reasonVal = document.getElementById('leave-reason').value;

            if (!type || !startDateVal || !endDateVal) {
                alert("Please fill all required fields correctly.");
                return;
            }

            const startDate = new Date(startDateVal);
            const endDate = new Date(endDateVal);

            if (endDate < startDate) {
                alert("End date cannot be before start date.");
                return;
            }

            // Calculate days
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const totalDuration = diffDays * duration;

            // Check if enough balance
            if (!leaveData[type] || leaveData[type].balance < totalDuration) {
                alert(`Insufficient balance for ${type}. Available: ${leaveData[type] ? leaveData[type].balance : 0}`);
                return;
            }

            // Update Data
            leaveData[type].used += totalDuration;
            leaveData[type].availed += totalDuration;
            leaveData[type].balance -= totalDuration;

            // Add to history
            const dateStr = diffDays === 1 ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

            historyData.unshift({
                type: type.split(' ')[0], // "Sick" instead of "Sick Leave"
                dates: dateStr,
                reason: reasonVal,
                submitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                status: "Pending",
                assigned: "N/A"
            });

            // Clear form
            leaveForm.reset();

            // Sync UI
            updateLeaveUI();

            // Switch Tab back to summary
            const summaryTab = document.querySelector('[data-target="leave-summary"]');
            if (summaryTab) {
                summaryTab.click();
            }
        });
        }
    }

    // --- Dynamic Holiday List Logic ---
    const holidayYearSelect = document.getElementById('holiday-year-select');
    const holidayMonthSelect = document.getElementById('holiday-month-select');
    const holidayContainer = document.getElementById('holiday-list-render');

    const holidays = [
        // 2026 Holidays
        { date: '2026-01-01', name: "New Year's Day", type: 'General', day: 'Thursday' },
        { date: '2026-01-14', name: 'Pongal / Makar Sankranti', type: 'Festival', day: 'Wednesday' },
        { date: '2026-01-26', name: 'Republic Day', type: 'National Holiday', day: 'Monday' },
        { date: '2026-02-15', name: 'Dayanand Saraswati Jayanti', type: 'Religious', day: 'Sunday' },
        { date: '2026-02-18', name: 'Maha Shivaratri', type: 'Religious', day: 'Wednesday' },
        { date: '2026-03-03', name: 'Holi', type: 'Festival', day: 'Tuesday' },
        { date: '2026-03-20', name: 'Eid-ul-Fitr', type: 'Religious', day: 'Friday' },
        { date: '2026-03-27', name: 'Ram Navami', type: 'Religious', day: 'Friday' },
        { date: '2026-04-03', name: 'Good Friday', type: 'Religious', day: 'Friday' },
        { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', type: 'General', day: 'Tuesday' },
        { date: '2026-05-01', name: 'May Day', type: 'Holiday', day: 'Friday' },
        { date: '2026-05-27', name: 'Bakrid / Eid al-Adha', type: 'Religious', day: 'Wednesday' },
        { date: '2026-08-15', name: 'Independence Day', type: 'National Holiday', day: 'Saturday' },
        { date: '2026-08-27', name: 'Raksha Bandhan', type: 'Festival', day: 'Thursday' },
        { date: '2026-09-04', name: 'Janmashtami', type: 'Religious', day: 'Friday' },
        { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'Festival', day: 'Monday' },
        { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'National Holiday', day: 'Friday' },
        { date: '2026-10-20', name: 'Dussehra', type: 'Festival', day: 'Tuesday' },
        { date: '2026-11-08', name: 'Diwali', type: 'Festival', day: 'Sunday' },
        { date: '2026-12-25', name: 'Christmas Day', type: 'Festival', day: 'Friday' },

        // 2025 Holidays
        { date: '2025-01-01', name: "New Year's Day", type: 'General', day: 'Wednesday' },
        { date: '2025-01-14', name: 'Pongal', type: 'Festival', day: 'Tuesday' },
        { date: '2025-01-26', name: 'Republic Day', type: 'National Holiday', day: 'Sunday' },
        { date: '2025-02-26', name: 'Maha Shivaratri', type: 'Religious', day: 'Wednesday' },
        { date: '2025-03-14', name: 'Holi', type: 'Festival', day: 'Friday' },
        { date: '2025-03-31', name: 'Eid-ul-Fitr', type: 'Religious', day: 'Monday' },
        { date: '2025-04-10', name: 'Good Friday', type: 'Religious', day: 'Friday' },
        { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'General', day: 'Monday' },
        { date: '2025-05-01', name: 'May Day', type: 'Holiday', day: 'Thursday' },
        { date: '2025-08-15', name: 'Independence Day', type: 'National Holiday', day: 'Friday' },
        { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'National Holiday', day: 'Thursday' },
        { date: '2025-10-22', name: 'Dussehra', type: 'Festival', day: 'Wednesday' },
        { date: '2025-10-20', name: 'Diwali', type: 'Festival', day: 'Monday' },
        { date: '2025-12-25', name: 'Christmas Day', type: 'Festival', day: 'Thursday' },

        // 2024 Holidays
        { date: '2024-01-01', name: "New Year's Day", type: 'General', day: 'Monday' },
        { date: '2024-01-15', name: 'Pongal', type: 'Festival', day: 'Monday' },
        { date: '2024-01-26', name: 'Republic Day', type: 'National Holiday', day: 'Friday' },
        { date: '2024-03-25', name: 'Holi', type: 'Festival', day: 'Monday' },
        { date: '2024-03-29', name: 'Good Friday', type: 'Religious', day: 'Friday' },
        { date: '2024-04-11', name: 'Eid-ul-Fitr', type: 'Religious', day: 'Thursday' },
        { date: '2024-04-14', name: 'Ambedkar Jayanti', type: 'General', day: 'Sunday' },
        { date: '2024-05-01', name: 'May Day', type: 'Holiday', day: 'Wednesday' },
        { date: '2024-08-15', name: 'Independence Day', type: 'National Holiday', day: 'Thursday' },
        { date: '2024-10-02', name: 'Gandhi Jayanti', type: 'National Holiday', day: 'Wednesday' },
        { date: '2024-10-31', name: 'Diwali', type: 'Festival', day: 'Thursday' },
        { date: '2024-12-25', name: 'Christmas Day', type: 'Festival', day: 'Wednesday' }
    ];

    const monthsArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const yearsArr = [2026, 2025, 2024];

    if (holidayYearSelect && holidayMonthSelect && holidayContainer) {
        yearsArr.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            holidayYearSelect.appendChild(opt);
        });

        monthsArr.forEach((month, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = month;
            holidayMonthSelect.appendChild(opt);
        });

        function renderHolidays() {
            const selectedYear = holidayYearSelect.value;
            const selectedMonth = holidayMonthSelect.value;

            const filtered = holidays.filter(h => {
                const hDate = new Date(h.date);
                const yearMatch = hDate.getFullYear().toString() === selectedYear;
                const monthMatch = selectedMonth === 'all' || hDate.getMonth().toString() === selectedMonth;
                return yearMatch && monthMatch;
            });

            holidayContainer.innerHTML = '';

            if (filtered.length === 0) {
                holidayContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b; width: 100%;">No holidays found for the selected period.</div>';
                return;
            }

            let lastMonth = -1;
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(h => {
                const dateObj = new Date(h.date);
                const currentMonthIdx = dateObj.getMonth();

                if (selectedMonth === 'all' && currentMonthIdx !== lastMonth) {
                    const monthHeader = document.createElement('div');
                    monthHeader.className = 'month-divider';
                    monthHeader.style.cssText = "width: 100%; padding: 12px 20px; background: #f1f5f9; border-left: 5px solid var(--primary-orange); margin: 25px 0 15px 0; font-weight: 800; color: #1e293b; grid-column: 1 / -1; font-size: 16px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);";
                    monthHeader.textContent = monthsArr[currentMonthIdx];
                    holidayContainer.appendChild(monthHeader);
                    lastMonth = currentMonthIdx;
                }

                const day = dateObj.getDate();
                const monthName = monthsArr[currentMonthIdx].substring(0, 3);

                const card = document.createElement('div');
                card.className = 'holiday-card';
                card.innerHTML = `
                    <div class="holiday-date">${day} <span>${monthName}</span></div>
                    <div class="holiday-info">
                        <h4>${h.name}</h4>
                        <p>${h.day}</p>
                    </div>
                    <span class="holiday-type">${h.type}</span>
                `;
                holidayContainer.appendChild(card);
            });
        }

        holidayYearSelect.addEventListener('change', renderHolidays);
        holidayMonthSelect.addEventListener('change', renderHolidays);

        // Initial render
        renderHolidays();
    }

    // Initial sync
    if (leaveForm) updateLeaveUI();

    // --- Dynamic Tax Page Logic ---
    const taxTableBody = document.getElementById('tax-table-body');
    const taxModal = document.getElementById('tax-modal');
    const addTaxBtn = document.getElementById('add-tax-btn');
    const closeTaxModal = document.getElementById('close-tax-modal');
    const taxForm = document.getElementById('tax-form');
    const taxSummaryBtn = document.getElementById('tax-summary-btn');

    const defaultTaxData = [
        { section: "80C", type: "Provident Fund / ELLSS", declared: 150000, verified: 150000, status: "Verified" },
        { section: "80D", type: "Medical Insurance", declared: 25000, verified: 0, status: "Pending Proof" },
        { section: "HRA", type: "House Rent Allowance", declared: 180000, verified: 180000, status: "Verified" }
    ];

    let taxDeclarations = JSON.parse(localStorage.getItem('taxDeclarations')) || defaultTaxData;

    // Data normalizer (Migration)
    taxDeclarations = taxDeclarations.map(d => ({
        section: d.section || "N/A",
        type: d.type || "N/A",
        declared: Number(d.declared) || 0,
        verified: Number(d.verified) || 0,
        status: d.status || "Pending Proof"
    }));

    function updateTaxUI() {
        if (taxTableBody) {
            taxTableBody.innerHTML = '';
            let actualSaved = 0;
            let potentialSaved = 0;
            let totalDeclaredAmount = 0;
            let totalVerifiedAmount = 0;

            taxDeclarations.forEach((decl, index) => {
                const row = document.createElement('tr');
                const statusLower = decl.status.toLowerCase();
                const statusClass = statusLower.includes('verified') ? 'status-verified' :
                    (statusLower.includes('pending') ? 'status-pending' : 'status-action');

                row.innerHTML = `
                    <td><strong>${decl.section}</strong></td>
                    <td>${decl.type}</td>
                    <td>₹ ${decl.declared.toLocaleString()}</td>
                    <td>₹ ${decl.verified.toLocaleString()}</td>
                    <td><span class="status-badge ${statusClass}">${decl.status}</span></td>
                    <td><i class="fa-solid fa-trash-can" style="cursor: pointer; color: #ef4444;" data-index="${index}"></i></td>
                `;
                taxTableBody.appendChild(row);

                totalDeclaredAmount += decl.declared;
                totalVerifiedAmount += decl.verified;

                if (statusLower.includes('verified')) {
                    actualSaved += decl.verified * 0.2;
                } else {
                    potentialSaved += decl.declared * 0.2;
                }
            });

            const savedTaxVal = document.getElementById('saved-tax-val');
            if (savedTaxVal) {
                savedTaxVal.textContent = `₹ ${Math.round(actualSaved).toLocaleString()}`;
                const parent = savedTaxVal.parentElement;
                let potentialEl = parent.querySelector('.potential-saving');
                if (potentialSaved > 0) {
                    if (!potentialEl) {
                        potentialEl = document.createElement('div');
                        potentialEl.className = 'potential-saving';
                        potentialEl.style.cssText = "font-size: 11px; color: #64748b; margin-top: 5px;";
                        parent.appendChild(potentialEl);
                    }
                    potentialEl.textContent = `+ ₹${Math.round(potentialSaved).toLocaleString()} potential`;
                } else if (potentialEl) {
                    potentialEl.remove();
                }
            }

            const summaryDeclared = document.getElementById('summary-total-declared');
            const summaryVerified = document.getElementById('summary-total-verified');
            if (summaryDeclared) summaryDeclared.textContent = `₹ ${totalDeclaredAmount.toLocaleString()}`;
            if (summaryVerified) summaryVerified.textContent = `₹ ${totalVerifiedAmount.toLocaleString()}`;

            localStorage.setItem('taxDeclarations', JSON.stringify(taxDeclarations));

            taxTableBody.querySelectorAll('.fa-trash-can').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    taxDeclarations.splice(idx, 1);
                    updateTaxUI();
                });
            });
        }
    }

    if (addTaxBtn && taxModal) {
        addTaxBtn.onclick = () => {
            taxForm.reset();
            taxModal.style.display = 'block';
        };
        if (closeTaxModal) closeTaxModal.onclick = () => taxModal.style.display = 'none';
        window.onclick = (e) => { if (e.target == taxModal) taxModal.style.display = 'none'; };

        taxForm.onsubmit = (e) => {
            e.preventDefault();
            const section = document.getElementById('tax-section').value;
            const status = document.getElementById('tax-status').value;
            const typeValue = document.getElementById('tax-type').value;
            const amount = parseFloat(document.getElementById('tax-amount').value) || 0;
            const verifiedAmount = parseFloat(document.getElementById('tax-verified-amount').value) || 0;

            taxDeclarations.push({
                section: section,
                type: typeValue,
                declared: amount,
                verified: verifiedAmount,
                status: status
            });

            updateTaxUI();
            taxModal.style.display = 'none';
        };
    }

    if (taxSummaryBtn) {
        taxSummaryBtn.onclick = () => {
            const totalDeclared = taxDeclarations.reduce((sum, d) => sum + d.declared, 0);
            const totalVerified = taxDeclarations.reduce((sum, d) => sum + d.verified, 0);
            alert(`Tax Summary for Current FY:\n\nTotal Declarations: ${taxDeclarations.length}\nTotal Declared Amount: ₹ ${totalDeclared.toLocaleString()}\nTotal Verified Amount: ₹ ${totalVerified.toLocaleString()}\n\nFull declaration summary has been generated for review.`);
        };
    }

    updateTaxUI();

    // --- Dynamic Attendance Page Logic ---
    const liveClock = document.getElementById('live-clock');
    const liveDate = document.getElementById('live-date');
    const calendarGrid = document.getElementById('attendance-calendar-grid');
    const btnIn = document.getElementById('btn-in');
    const btnOut = document.getElementById('btn-out');

    // 1. Live Clock
    if (liveClock && liveDate) {
        setInterval(() => {
            const now = new Date();
            liveClock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
            liveDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }, 1000);
    }

    // 2. Punch Logic
    if (btnIn && btnOut) {
        const punchStatus = document.getElementById('punch-status');
        btnIn.onclick = () => {
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem('lastPunchIn', time);
            if (punchStatus) punchStatus.innerHTML = `Punched IN at <span style="font-weight: 600; color: #16a34a;">${time}</span>`;
            alert("Punched In Successfully!");
        };
        btnOut.onclick = () => {
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            if (punchStatus) punchStatus.innerHTML = `Punched OUT at <span style="font-weight: 600; color: #b91c1c;">${time}</span>`;
            alert("Punched Out Successfully!");
        };

        // Initialize display if exists
        const lastIn = localStorage.getItem('lastPunchIn');
        if (lastIn && punchStatus) punchStatus.innerHTML = `Last Punch: <span style="font-weight: 600; color: #1e293b;">${lastIn} (IN)</span>`;
    }

    // 3. Dynamic Attendance Calendar Logic
    if (calendarGrid) {
        const monthSelect = document.getElementById('cal-month-select');
        const yearSelect = document.getElementById('cal-year-select');
        const prevBtn = document.getElementById('prev-month-btn');
        const nextBtn = document.getElementById('next-month-btn');
        const todayBtn = document.getElementById('current-month-btn');
        const yearGrid = document.getElementById('year-calendar-grid');
        const monthViewEls = document.getElementById('month-view-elements');
        const yearViewEls = document.getElementById('year-view-elements');
        const headerTitle = document.querySelector('.header-left h3');

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let currentMonth = "all"; // Default to Year view
        let currentYear = 2024; // Start with 2024 as per image
        let isYearView = true;

        // Populate Selects
        const wholeYearOpt = document.createElement('option');
        wholeYearOpt.value = "all";
        wholeYearOpt.textContent = "Whole Year";
        monthSelect.appendChild(wholeYearOpt);

        months.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = m;
            monthSelect.appendChild(opt);
        });

        for (let y = currentYear - 2; y <= currentYear + 5; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }

        function renderCalendar(month, year) {
            if (month === "all") {
                renderYearCalendar(year);
                return;
            }

            isYearView = false;
            monthViewEls.style.display = 'block';
            yearViewEls.style.display = 'none';
            headerTitle.textContent = `Attendance Calendar - ${months[month]} ${year}`;

            calendarGrid.innerHTML = '';
            monthSelect.value = month;
            yearSelect.value = year;

            let firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...

            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let prevMonthLastDay = new Date(year, month, 0).getDate();
            for (let i = firstDay - 1; i >= 0; i--) {
                const day = prevMonthLastDay - i;
                const cell = document.createElement('div');
                cell.className = 'cal-cell other-month';
                cell.innerHTML = `<span class="cal-date">${day}</span>`;
                calendarGrid.appendChild(cell);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('div');
                cell.className = 'cal-cell';
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                if (isSunday) cell.classList.add('sunday');

                let tagHtml = '';
                if (isWeekend) tagHtml = '<span class="cell-tag tag-rest">Rest</span>';
                else if (day % 15 === 0) tagHtml = '<span class="cell-tag tag-holiday">Holiday</span>';
                else if (day % 18 === 0) tagHtml = '<span class="cell-tag tag-absent">Absent</span>';
                else if (day % 22 === 0) tagHtml = '<span class="cell-tag tag-leave">Leave</span>';
                else tagHtml = '<span class="cell-tag tag-present">Present</span>';

                cell.innerHTML = `
                    <span class="cal-date">${day}</span>
                    ${tagHtml}
                    ${!isWeekend && tagHtml.includes('tag-present') ? `
                        <div class="cal-info">
                            <div><span class="label">IN:</span> <span>09:30</span></div>
                            <div><span class="label">OUT:</span> <span>18:45</span></div>
                            <div class="total-hrs">TOTAL: 09:15</div>
                        </div>
                    ` : ''}
                `;

                cell.onclick = () => {
                    const dateStr = `${day} ${months[month]} ${year}`;
                    window.location.href = `attendance_details.html?date=${encodeURIComponent(dateStr)}`;
                };

                calendarGrid.appendChild(cell);
            }

            // Pad the end with next month's dates to reach 42 cells
            const totalCellsSoFar = firstDay + daysInMonth;
            const remaining = 42 - totalCellsSoFar;
            for (let i = 1; i <= remaining; i++) {
                const cell = document.createElement('div');
                cell.className = 'cal-cell other-month';
                cell.innerHTML = `<span class="cal-date">${i}</span>`;
                calendarGrid.appendChild(cell);
            }
        }

        function renderYearCalendar(year) {
            isYearView = true;
            monthViewEls.style.display = 'none';
            yearViewEls.style.display = 'block';
            headerTitle.textContent = `CALENDAR ${year}`;
            yearGrid.innerHTML = '';
            monthSelect.value = "all";
            yearSelect.value = year;

            months.forEach((m, mIdx) => {
                const monthCont = document.createElement('div');
                monthCont.className = 'small-month-container';

                let monthHtml = `
                    <div class="small-month-name">${m}</div>
                    <div class="small-weekdays">
                        <div class="sun">S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                    </div>
                    <div class="small-days-grid">
                `;

                let firstDay = new Date(year, mIdx, 1).getDay(); // 0 = Sunday

                const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

                let prevMonthLastDay = new Date(year, mIdx, 0).getDate();
                for (let i = firstDay - 1; i >= 0; i--) {
                    const dayNum = prevMonthLastDay - i;
                    monthHtml += `<div class="small-day other-month">${dayNum}</div>`;
                }

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, mIdx, day);
                    const dayOfWeek = date.getDay(); // 0 is Sun
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    const isWeekend = isSunday || isSaturday;

                    let statusClass = '';
                    if (isWeekend) statusClass = 'tag-rest';
                    else if (day % 15 === 0) statusClass = 'tag-holiday';
                    else if (day % 18 === 0) statusClass = 'tag-absent';
                    else if (day % 22 === 0) statusClass = 'tag-leave';
                    else statusClass = 'tag-present';

                    if (isSunday) statusClass += ' sunday';

                    monthHtml += `<div class="small-day ${statusClass} ${statusClass.includes('tag') && !statusClass.includes('tag-present') ? 'has-tag' : ''}">${day}</div>`;
                }

                // Pad the end for year view (42 cells total)
                const totalCellsSoFar = firstDay + daysInMonth;
                for (let i = 1; i <= (42 - totalCellsSoFar); i++) {
                    monthHtml += `<div class="small-day other-month">${i}</div>`;
                }

                monthHtml += `</div>`;
                monthCont.innerHTML = monthHtml;

                // Clicking a small month should go to that month view
                monthCont.style.cursor = 'pointer';
                monthCont.onclick = () => {
                    currentMonth = mIdx;
                    renderCalendar(currentMonth, currentYear);
                };

                yearGrid.appendChild(monthCont);
            });
        }

        // Event Listeners
        monthSelect.onchange = () => {
            const val = monthSelect.value;
            if (val === "all") {
                renderYearCalendar(currentYear);
            } else {
                currentMonth = parseInt(val);
                renderCalendar(currentMonth, currentYear);
            }
        };
        yearSelect.onchange = () => {
            currentYear = parseInt(yearSelect.value);
            if (monthSelect.value === "all") {
                renderYearCalendar(currentYear);
            } else {
                renderCalendar(currentMonth, currentYear);
            }
        };
        prevBtn.onclick = () => {
            if (monthSelect.value === "all") {
                currentYear--;
                renderYearCalendar(currentYear);
            } else {
                currentMonth--;
                if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                renderCalendar(currentMonth, currentYear);
            }
        };
        nextBtn.onclick = () => {
            if (monthSelect.value === "all") {
                currentYear++;
                renderYearCalendar(currentYear);
            } else {
                currentMonth++;
                if (currentMonth > 11) { currentMonth = 0; currentYear++; }
                renderCalendar(currentMonth, currentYear);
            }
        };
        todayBtn.onclick = () => {
            currentMonth = new Date().getMonth();
            currentYear = new Date().getFullYear();
            renderCalendar(currentMonth, currentYear);
        };

        // Initial Render
        renderCalendar(currentMonth, currentYear);
    }
});

// ---------------------------------------------------------
// ANTIGRAVITY AGENT: Recognize Page Form Logic
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const nominateForm = document.querySelector('.nominate-form');

    if (nominateForm) {
        nominateForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Inputs
            const colleagueInput = nominateForm.querySelector('input[type="text"]');
            const awardSelect = nominateForm.querySelector('select');
            const messageInput = nominateForm.querySelector('textarea');

            // Simple Validation
            if (!colleagueInput.value.trim() || awardSelect.value.includes('Select') || !messageInput.value.trim()) {
                alert('Please fill in all fields to send appreciation.');
                return;
            }

            // Success Action
            const colleagueName = colleagueInput.value;
            const awardType = awardSelect.value;

            // Reset Form
            nominateForm.reset();
        });
    }
});

// ---------------------------------------------------------
// ANTIGRAVITY AGENT: Exit Page Logic
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('exit-hero');
    const formPanel = document.getElementById('resignation-form-panel');
    const policyPanel = document.getElementById('policy-panel');

    const initBtn = document.getElementById('initiate-exit-btn');
    const policyBtn = document.getElementById('view-policy-btn');
    const backBtns = document.querySelectorAll('.back-to-exit-hero');

    if (hero && initBtn && policyBtn) {
        initBtn.addEventListener('click', () => {
            hero.style.display = 'none';
            formPanel.style.display = 'block';
            policyPanel.style.display = 'none';
        });

        policyBtn.addEventListener('click', () => {
            hero.style.display = 'none';
            formPanel.style.display = 'none';
            policyPanel.style.display = 'block';
        });

        backBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                hero.style.display = 'block';
                formPanel.style.display = 'none';
                policyPanel.style.display = 'none';
            });
        });
    }
});

/* --- Mobile Menu Toggle --- */
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');

            // Toggle icon
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (mainNav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
});


/* Force Override Sync Logic for all inputs */
document.addEventListener('DOMContentLoaded', () => {
    function forceSyncToHR() {
        const currentProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        const firstNameInput = document.getElementById('input-first-name');
        const lastNameInput = document.getElementById('input-last-name');
        const mobileInput = document.getElementById('input-mobile');
        const emailInput = document.getElementById('input-email');

        if (firstNameInput && lastNameInput) currentProfile.name = firstNameInput.value + ' ' + lastNameInput.value;
        if (mobileInput) currentProfile.phone = mobileInput.value;
        if (emailInput) currentProfile.email = emailInput.value;

        localStorage.setItem('userProfile', JSON.stringify(currentProfile));
    }

    const syncInputs = ['input-first-name', 'input-last-name', 'input-mobile', 'input-email'];
    syncInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', forceSyncToHR);
    });
});


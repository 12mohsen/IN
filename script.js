// إضافة التفاعلية للقائمة الجانبية في الأجهزة المحمولة
document.addEventListener('DOMContentLoaded', function() {
    // زر قائمة الجوال لفتح/إغلاق القائمة الجانبية
    const menuToggleBtn = document.getElementById('menuToggleBtn');

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            document.body.classList.toggle('sidebar-open');
        });
    }

    // دالة لإضافة منطق المفضلة (إضافة/إزالة) لبطاقة واحدة
    function attachFavoriteHandler(card, sourceLabel) {
        const addBtn = card.querySelector('[data-favorite-btn]');
        const removeBtn = card.querySelector('[data-remove-favorite-btn]');
        if (!addBtn && !removeBtn) return;

        function getCardInfo() {
            const titleEl = card.querySelector('.app-info h3');
            const descEl = card.querySelector('.app-description');
            const primaryLink = card.querySelector('.app-actions a.btn-primary');
            const statusSpan = card.querySelector('.app-meta .status');
            const imgEl = card.querySelector('img');

            const name = titleEl ? titleEl.textContent.trim() : '';
            const desc = descEl ? descEl.textContent.trim() : '';
            const url = primaryLink ? primaryLink.getAttribute('href') : '';
            const statusText = statusSpan ? statusSpan.textContent.trim() : 'جاهز';
            const statusClass = statusSpan ? (statusSpan.classList[1] || 'stable') : 'stable';
            const imageSrc = imgEl ? imgEl.getAttribute('src') : '';

            return { name, desc, url, statusText, statusClass, imageSrc };
        }

        function syncButtons() {
            const info = getCardInfo();
            if (!info.name || !info.url) return;
            const exists = favoriteApps.some(app => app.name === info.name && app.url === info.url);

            if (addBtn) addBtn.style.display = exists ? 'none' : '';
            if (removeBtn) removeBtn.style.display = exists ? '' : 'none';
        }

        if (addBtn) {
            addBtn.addEventListener('click', function () {
                const { name, desc, url, statusText, statusClass, imageSrc } = getCardInfo();

                if (!name || !url) {
                    alert('لا يمكن إضافة تطبيق بدون اسم أو رابط إلى المفضلة.');
                    return;
                }

                const exists = favoriteApps.some(app => app.name === name && app.url === url);
                if (exists) {
                    alert('هذا التطبيق موجود بالفعل في قائمة المفضلة.');
                    syncButtons();
                    return;
                }

                const favData = {
                    id: Date.now().toString() + Math.random().toString(16).slice(2),
                    name,
                    url,
                    desc,
                    statusText,
                    statusClass,
                    imageSrc,
                    sourceLabel
                };

                favoriteApps.push(favData);
                saveFavoriteApps();
                createFavoriteCardFromData(favData);
                updateSectionCounts();
                syncButtons();

                alert('تمت إضافة التطبيق إلى قائمة المفضلة.');
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                const { name, url } = getCardInfo();
                if (!name || !url) return;

                const beforeLength = favoriteApps.length;
                favoriteApps = favoriteApps.filter(app => !(app.name === name && app.url === url));
                if (favoriteApps.length === beforeLength) {
                    alert('هذا التطبيق غير موجود في قائمة المفضلة.');
                    syncButtons();
                    return;
                }

                saveFavoriteApps();

                // إزالة البطاقات المطابقة من تبويب المفضلة
                const favoriteGrid = document.getElementById('favoriteAppsGrid');
                if (favoriteGrid) {
                    const favCards = favoriteGrid.querySelectorAll('.app-card');
                    favCards.forEach(favCard => {
                        const favTitleEl = favCard.querySelector('.app-info h3');
                        const favPrimaryLink = favCard.querySelector('.app-actions a.btn-primary');
                        const favName = favTitleEl ? favTitleEl.textContent.trim() : '';
                        const favUrl = favPrimaryLink ? favPrimaryLink.getAttribute('href') : '';
                        if (favName === name && favUrl === url) {
                            favCard.remove();
                        }
                    });
                }

                updateSectionCounts();
                syncButtons();

                alert('تمت إزالة التطبيق من قائمة المفضلة.');
            });
        }

        // مزامنة حالة الأزرار عند التهيئة
        syncButtons();
    }

    // دالة مساعدة لاستخراج اسم الدومين من الرابط
    function getDomainLabel(url) {
        try {
            const u = new URL(url);
            return u.hostname.replace(/^www\./i, '');
        } catch (e) {
            return url;
        }
    }

    // التعامل مع نموذج إضافة تطبيق سوشيال ميديا جديد
    const addSocialAppForm = document.getElementById('addSocialAppForm');
    const socialAppNameInput = document.getElementById('socialAppNameInput');
    const socialAppUrlInput = document.getElementById('socialAppUrlInput');
    const socialAppDescriptionInput = document.getElementById('socialAppDescriptionInput');
    const socialAppStatusSelect = document.getElementById('socialAppStatusSelect');
    const socialAppsGrid = document.getElementById('socialAppsGrid');

    if (addSocialAppForm && socialAppNameInput && socialAppUrlInput && socialAppsGrid) {
        addSocialAppForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = socialAppNameInput.value.trim();
            const url = socialAppUrlInput.value.trim();
            let desc = socialAppDescriptionInput ? socialAppDescriptionInput.value.trim() : '';
            const statusValue = socialAppStatusSelect ? socialAppStatusSelect.value : 'important';

            if (!name || !url) {
                return;
            }

            const normalizedUrl = url.trim();
            // فحص الرابط في جميع الأقسام
            const duplicate = findUrlInAllSections(normalizedUrl);
            if (duplicate) {
                const goToExisting = confirm(`هذا الرابط مضاف مسبقاً في قسم: ${duplicate.sectionLabel}.\n\nاضغط موافق للانتقال إلى البطاقة الموجودة، أو إلغاء لإضافته مرة أخرى هنا في قسم السوشيال ميديا.`);
                if (goToExisting) {
                    highlightExistingCardById(duplicate.appId, duplicate.gridSelector);
                    return;
                }
            }

            // توليد وصف يعتمد على الدومين في كل الأحوال
            const domain = getDomainLabel(normalizedUrl);
            if (!desc) {
                // إذا لم يكتب المستخدم وصفًا، نستخدم الوصف التلقائي فقط
                desc = `حساب سوشيال ميديا على: ${domain}`;
            } else {
                // إذا كتب وصفًا، نضيف الوصف التلقائي بعده
                desc = `${desc} - حساب سوشيال ميديا على: ${domain}`;
            }

            // تحديد نص الحالة والكلاس حسب الاختيار (مهم / للمشاهدة لاحقاً / عادي)
            let statusText = 'مهم';
            let statusClass = 'update'; // برتقالي
            if (statusValue === 'later') {
                statusText = 'للمشاهدة لاحقاً';
                statusClass = 'review'; // أزرق
            } else if (statusValue === 'normal') {
                statusText = 'عادي';
                statusClass = 'stable'; // أخضر
            }

            const appData = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                name,
                url: normalizedUrl,
                desc,
                statusText,
                statusClass
            };

            socialApps.push(appData);
            saveSocialApps();

            createSocialCardFromData(appData);
            updateSectionCounts();

            // تفريغ الحقول بعد الإضافة
            socialAppNameInput.value = '';
            socialAppUrlInput.value = '';
            if (socialAppDescriptionInput) socialAppDescriptionInput.value = '';
            if (socialAppStatusSelect) socialAppStatusSelect.value = 'important';
        });
    }

    // تفعيل مربع البحث عن تطبيق أو إحصائية
    const searchInput = document.querySelector('.search-box input');

    function applySearchFilter(query) {
        const q = query.trim().toLowerCase();

        // تصفية بطاقات التطبيقات (ويب وAPK)
        const appCards = document.querySelectorAll('.apps-grid .app-card');
        appCards.forEach(card => {
            if (!q) {
                card.style.display = '';
                return;
            }

            const titleEl = card.querySelector('.app-info h3');
            const descEl = card.querySelector('.app-description');
            const statusEl = card.querySelector('.app-meta .status');

            const title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
            const desc = descEl ? descEl.textContent.trim().toLowerCase() : '';
            const status = statusEl ? statusEl.textContent.trim().toLowerCase() : '';

            const combined = `${title} ${desc} ${status}`;
            card.style.display = combined.includes(q) ? '' : 'none';
        });

        // تصفية بطاقات الإحصائيات
        const statCards = document.querySelectorAll('.stats-grid .stat-card');
        statCards.forEach(card => {
            if (!q) {
                card.style.display = '';
                return;
            }

            const titleEl = card.querySelector('.stat-header h3');
            const valueEl = card.querySelector('.stat-value');

            const title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
            const value = valueEl ? valueEl.textContent.trim().toLowerCase() : '';

            const combined = `${title} ${value}`;
            card.style.display = combined.includes(q) ? '' : 'none';
        });

        // بعد تغيير إظهار/إخفاء البطاقات، نحدّث عداد التطبيقات في كل قسم
        updateSectionCounts();
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applySearchFilter(this.value);
        });
    }

    // التعامل مع قائمة التطبيقات المنسدلة
    const appSelectorBtn = document.getElementById('appSelectorBtn');
    const appDropdown = document.getElementById('appDropdown');
    const appItems = document.querySelectorAll('.app-item');

    // فتح/إغلاق القائمة المنسدلة
    appSelectorBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        appDropdown.classList.toggle('active');
    });

    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!appDropdown.contains(e.target) && !appSelectorBtn.contains(e.target)) {
            appDropdown.classList.remove('active');
        }

        // إغلاق القائمة الجانبية عند النقر خارجها في الجوال
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && document.body.classList.contains('sidebar-open')) {
            const clickInsideSidebar = sidebar.contains(e.target);
            const clickOnMenuButton = menuToggleBtn && (e.target === menuToggleBtn || menuToggleBtn.contains(e.target));
            if (!clickInsideSidebar && !clickOnMenuButton) {
                document.body.classList.remove('sidebar-open');
            }
        }
    });

    // تحديث التطبيق المحدد عند النقر
    appItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة الحالة النشطة من جميع العناصر
            appItems.forEach(i => i.classList.remove('active'));
            
            // إضافة الحالة النشطة للعنصر المحدد
            this.classList.add('active');
            
            // تحديث نص الزر
            const appName = this.querySelector('.app-name').textContent;
            appSelectorBtn.querySelector('span').textContent = appName;
            
            // إغلاق القائمة المنسدلة
            appDropdown.classList.remove('active');
            
            // تحديث المحتوى الرئيسي (يمكن إضافة وظائف إضافية هنا)
            updateMainContent(appName);
        });
    });

    // عناصر قسم الإدارة (الأدمن)
    const adminNav = document.getElementById('adminNav');
    const adminSection = document.getElementById('adminSection');
    const adminUsersBody = document.getElementById('adminUsersBody');
    const adminUsersCountEl = document.getElementById('adminUsersCount');
    const adminUsersSearchInput = document.getElementById('adminUsersSearch');
    const adminAddUserForm = document.getElementById('adminAddUserForm');
    const adminNewUsernameInput = document.getElementById('adminNewUsername');
    const adminNewEmailInput = document.getElementById('adminNewEmail');
    const adminNewPasswordInput = document.getElementById('adminNewPassword');
    const currentUserDisplay = document.getElementById('currentUserDisplay');

    function clearAdminAddUserForm() {
        if (adminNewUsernameInput) adminNewUsernameInput.value = '';
        if (adminNewEmailInput) adminNewEmailInput.value = '';
        if (adminNewPasswordInput) adminNewPasswordInput.value = '';
    }

    function updateCurrentUserDisplay() {
        if (!currentUserDisplay) return;
        if (currentUser && currentUser.email) {
            const label = currentUser.username ? `${currentUser.username} (${currentUser.email})` : currentUser.email;
            currentUserDisplay.textContent = `المستخدم الحالي: ${label}`;
        } else {
            currentUserDisplay.textContent = '';
        }
    }

    // إعدادات الدعم الفني
    const SUPPORT_SETTINGS_KEY = 'dashboard_support_settings';
    const adminSupportSettingsForm = document.getElementById('adminSupportSettingsForm');
    const adminSupportEmailInput = document.getElementById('adminSupportEmail');
    const adminSupportNoteInput = document.getElementById('adminSupportNote');
    const adminSupportMethodInput = document.getElementById('adminSupportMethodInput');
    const addSupportMethodBtn = document.getElementById('addSupportMethodBtn');
    const adminSupportMethodsList = document.getElementById('adminSupportMethodsList');
    const supportEmailDisplay = document.getElementById('supportEmailDisplay');
    const supportNoteDisplay = document.getElementById('supportNoteDisplay');
    const supportMethodsDisplay = document.getElementById('supportMethodsDisplay');
    const supportSection = document.getElementById('supportSection');
    const supportNav = document.getElementById('supportNav');

    let supportMethods = [];

    function renderSupportMethods() {
        // عرض في قسم الدعم للمستخدمين
        if (supportMethodsDisplay) {
            const container = supportMethodsDisplay.closest('.form-group');
            supportMethodsDisplay.innerHTML = '';
            if (!supportMethods || supportMethods.length === 0) {
                // لا نعرض هذا القسم للمستخدمين إذا لم تكن هناك وسائل تواصل أخرى
                if (container) {
                    container.style.display = 'none';
                }
            } else {
                if (container) {
                    container.style.display = '';
                }
                supportMethods.forEach(method => {
                    const li = document.createElement('li');
                    // إذا كانت الوسيلة رابطاً كاملاً نجعلها كرابط قابل للنقر
                    if (typeof method === 'string' && (method.startsWith('http://') || method.startsWith('https://'))) {
                        const a = document.createElement('a');
                        a.href = method;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.textContent = method;
                        li.appendChild(a);
                    } else {
                        li.textContent = method;
                    }
                    supportMethodsDisplay.appendChild(li);
                });
            }
        }

        // عرض في قسم الإدارة (قائمة قابلة للحذف فقط من الواجهة، بدون حذف من التخزين حتى يحفظ الأدمن)
        if (adminSupportMethodsList) {
            adminSupportMethodsList.innerHTML = '';
            if (!supportMethods || supportMethods.length === 0) {
                const li = document.createElement('li');
                li.className = 'field-hint';
                li.textContent = 'لم تتم إضافة أي وسيلة تواصل أخرى بعد.';
                adminSupportMethodsList.appendChild(li);
            } else {
                supportMethods.forEach((method, index) => {
                    const li = document.createElement('li');
                    const span = document.createElement('span');
                    if (typeof method === 'string' && (method.startsWith('http://') || method.startsWith('https://'))) {
                        const a = document.createElement('a');
                        a.href = method;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.textContent = method;
                        span.appendChild(a);
                    } else {
                        span.textContent = method;
                    }

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'btn btn-secondary';
                    removeBtn.style.marginRight = '8px';
                    removeBtn.textContent = 'إزالة';
                    removeBtn.addEventListener('click', function () {
                        supportMethods.splice(index, 1);
                        renderSupportMethods();
                    });

                    li.appendChild(span);
                    li.appendChild(removeBtn);
                    adminSupportMethodsList.appendChild(li);
                });
            }
        }
    }

    function loadSupportSettings() {
        let settings = null;
        try {
            const raw = localStorage.getItem(SUPPORT_SETTINGS_KEY);
            if (raw) settings = JSON.parse(raw);
        } catch (e) {}

        if (!settings) {
            if (supportEmailDisplay) {
                supportEmailDisplay.textContent = 'لم يتم إعداد بريد الدعم بعد. يرجى التواصل مع الأدمن لإعداده.';
            }
            if (supportNoteDisplay) {
                supportNoteDisplay.textContent = 'لا توجد بيانات تواصل إضافية حتى الآن.';
            }
            supportMethods = [];
            renderSupportMethods();
            return;
        }

        if (supportEmailDisplay) {
            supportEmailDisplay.textContent = settings.email || 'لم يتم إعداد بريد الدعم بعد. يرجى التواصل مع الأدمن لإعداده.';
        }
        if (supportNoteDisplay) {
            supportNoteDisplay.textContent = settings.note || 'لا توجد بيانات تواصل إضافية حتى الآن.';
        }

        if (adminSupportEmailInput) {
            adminSupportEmailInput.value = settings.email || '';
        }
        if (adminSupportNoteInput) {
            adminSupportNoteInput.value = settings.note || '';
        }

        supportMethods = Array.isArray(settings.methods) ? settings.methods.slice() : [];
        renderSupportMethods();
    }

    function saveSupportSettings(email, note) {
        const settings = { email, note, methods: supportMethods || [] };
        try {
            localStorage.setItem(SUPPORT_SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {}
    }

    if (addSupportMethodBtn && adminSupportMethodInput) {
        addSupportMethodBtn.addEventListener('click', function () {
            if (!canCurrentUserManageSupport()) {
                alert('ليست لديك صلاحية تعديل إعدادات الدعم الفني. يرجى التواصل مع الأدمن.');
                return;
            }

            const value = adminSupportMethodInput.value.trim();
            if (!value) {
                alert('يرجى كتابة اسم وسيلة التواصل (مثل قناة تيليجرام أو حساب تويتر).');
                return;
            }

            if (!supportMethods) supportMethods = [];
            supportMethods.push(value);
            adminSupportMethodInput.value = '';
            renderSupportMethods();
        });
    }

    // حفظ إعدادات الدعم الفني من قسم الإدارة
    if (adminSupportSettingsForm && adminSupportEmailInput && adminSupportNoteInput) {
        adminSupportSettingsForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!canCurrentUserManageSupport()) {
                alert('ليست لديك صلاحية تعديل إعدادات الدعم الفني. يرجى التواصل مع الأدمن.');
                return;
            }

            const email = adminSupportEmailInput.value.trim();
            const note = adminSupportNoteInput.value.trim();

            if (!email && !note && (!supportMethods || supportMethods.length === 0)) {
                const confirmEmpty = confirm('لم تقم بإدخال بريد أو رسالة دعم أو أي وسيلة تواصل أخرى.\nسيتم اعتبار أن بيانات الدعم غير مهيأة.\n\nهل تريد المتابعة؟');
                if (!confirmEmpty) return;
            }

            saveSupportSettings(email, note);
            loadSupportSettings();
            alert('تم حفظ إعدادات الدعم الفني بنجاح.');
        });
    }

    function isCurrentUserAdmin() {
        return !!(currentUser && currentUser.isAdmin === true);
    }

    function getUserPermissions(user) {
        if (!user || typeof user !== 'object') return {};
        return user.permissions && typeof user.permissions === 'object'
            ? user.permissions
            : {};
    }

    function canCurrentUserChangeUsersPasswords() {
        if (!currentUser) return false;
        if (currentUser.isAdmin) return true;
        const perms = getUserPermissions(currentUser);
        return !!perms.canChangeUsersPasswords;
    }

    function canCurrentUserAddUsers() {
        if (!currentUser) return false;
        if (currentUser.isAdmin) return true;
        const perms = getUserPermissions(currentUser);
        return !!perms.canAddUsers;
    }

    function canCurrentUserManageSupport() {
        if (!currentUser) return false;
        if (currentUser.isAdmin) return true;
        const perms = getUserPermissions(currentUser);
        return !!perms.canManageSupport;
    }

    function canCurrentUserDeleteUsers() {
        if (!currentUser) return false;
        if (currentUser.isAdmin) return true;
        const perms = getUserPermissions(currentUser);
        return !!perms.canDeleteUsers;
    }

    function canCurrentUserAccessAdminSection() {
        if (!currentUser) return false;
        if (currentUser.isAdmin) return true;
        const perms = getUserPermissions(currentUser);
        return !!(
            perms.canChangeUsersPasswords ||
            perms.canAddUsers ||
            perms.canManageSupport ||
            perms.canDeleteUsers
        );
    }

    function renderAdminUsers() {
        if (!adminUsersBody) return;
        adminUsersBody.innerHTML = '';

        const searchTerm = adminUsersSearchInput ? adminUsersSearchInput.value.trim().toLowerCase() : '';

        const allUsers = Array.isArray(users) ? users : [];
        const filteredUsers = searchTerm
            ? allUsers.filter(u => {
                const name = (u.username || '').toLowerCase();
                const email = (u.email || '').toLowerCase();
                return name.includes(searchTerm) || email.includes(searchTerm);
            })
            : allUsers;

        const total = allUsers.length;
        if (adminUsersCountEl) {
            adminUsersCountEl.textContent = total > 0 ? `عدد المستخدمين: ${total}` : 'لا يوجد مستخدمون بعد';
        }

        if (filteredUsers.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'admin-user-row';
            empty.textContent = searchTerm
                ? 'لا توجد نتائج مطابقة لعملية البحث الحالية.'
                : 'لا يوجد أي مستخدمين مسجَّلين حالياً.';
            adminUsersBody.appendChild(empty);
            return;
        }

        filteredUsers.forEach(user => {
            const row = document.createElement('div');
            row.className = 'admin-user-row';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = user.username || 'بدون اسم';

            const emailSpan = document.createElement('span');
            emailSpan.textContent = user.email || '—';

            const roleSpan = document.createElement('span');
            roleSpan.textContent = user.isAdmin ? 'أدمن' : 'مستخدم عادي';

            const perms = getUserPermissions(user);
            const hasAnyPerm = !!(perms.canChangeUsersPasswords || perms.canAddUsers || perms.canManageSupport || perms.canDeleteUsers);
            if (hasAnyPerm && !user.isAdmin) {
                const br = document.createElement('br');
                const permsInfo = document.createElement('span');
                permsInfo.className = 'user-permissions-indicator';

                const labels = [];
                if (perms.canChangeUsersPasswords) labels.push('✓ كلمات السر');
                if (perms.canAddUsers) labels.push('✓ إضافة مستخدمين');
                if (perms.canManageSupport) labels.push('✓ دعم فني');
                if (perms.canDeleteUsers) labels.push('✓ حذف مستخدمين');

                permsInfo.textContent = 'صلاحيات: ' + labels.join('، ');
                roleSpan.appendChild(br);
                roleSpan.appendChild(permsInfo);
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'admin-user-actions';

            const permissionsBtn = document.createElement('button');
            permissionsBtn.type = 'button';
            permissionsBtn.className = 'btn btn-secondary';
            permissionsBtn.textContent = 'تعديل الصلاحيات';

            permissionsBtn.addEventListener('click', function () {
                if (!isCurrentUserAdmin()) {
                    alert('فقط الأدمن الرئيسي يمكنه تعديل صلاحيات المستخدمين.');
                    return;
                }

                const perms = getUserPermissions(user);

                permissionsEditingUserId = user.id;
                if (permissionsUserLabel) {
                    permissionsUserLabel.textContent = `المستخدم: ${user.username || user.email}`;
                }
                if (permChangePwdsCheckbox) {
                    permChangePwdsCheckbox.checked = !!perms.canChangeUsersPasswords;
                }
                if (permAddUsersCheckbox) {
                    permAddUsersCheckbox.checked = !!perms.canAddUsers;
                }
                if (permManageSupportCheckbox) {
                    permManageSupportCheckbox.checked = !!perms.canManageSupport;
                }
                if (permDeleteUsersCheckbox) {
                    permDeleteUsersCheckbox.checked = !!perms.canDeleteUsers;
                }

                if (permissionsModal) {
                    permissionsModal.style.display = 'block';
                }
            });

            const changePwdBtn = document.createElement('button');
            changePwdBtn.type = 'button';
            changePwdBtn.className = 'btn btn-secondary';
            changePwdBtn.textContent = 'تغيير كلمة المرور';

            changePwdBtn.addEventListener('click', function () {
                if (!canCurrentUserChangeUsersPasswords()) {
                    alert('ليست لديك صلاحية تغيير كلمات سر المستخدمين. يرجى التواصل مع الأدمن.');
                    return;
                }
                const newPwd = prompt(`اكتب كلمة مرور جديدة للمستخدم:\n${user.username || user.email}`);
                if (!newPwd) return;
                const confirmPwd = prompt('أعد إدخال كلمة المرور الجديدة للتأكيد:');
                if (newPwd !== confirmPwd) {
                    alert('كلمتا المرور غير متطابقتين. لم يتم التغيير.');
                    return;
                }

                const idx = users.findIndex(u => u.id === user.id);
                if (idx === -1) {
                    alert('لم يتم العثور على هذا المستخدم في السجل.');
                    return;
                }
                users[idx].password = newPwd;
                saveUsers();
                alert('تم تحديث كلمة المرور للمستخدم بنجاح.');
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn delete-btn';
            deleteBtn.textContent = 'حذف المستخدم';

            if (user.isAdmin) {
                deleteBtn.disabled = true;
                deleteBtn.title = 'لا يمكن حذف حساب الأدمن من قسم الإدارة.';
            } else {
                deleteBtn.addEventListener('click', function () {
                    if (!canCurrentUserDeleteUsers()) {
                        alert('ليست لديك صلاحية حذف المستخدمين. يرجى التواصل مع الأدمن.');
                        return;
                    }
                    const confirmDelete = confirm(`سيتم حذف هذا المستخدم نهائياً من النظام:\n${user.username || user.email}\n\nهل أنت متأكد من المتابعة؟`);
                    if (!confirmDelete) return;

                    const idx = users.findIndex(u => u.id === user.id);
                    if (idx === -1) {
                        alert('لم يتم العثور على هذا المستخدم في السجل.');
                        return;
                    }
                    users.splice(idx, 1);
                    saveUsers();
                    renderAdminUsers();
                });
            }

            actionsDiv.appendChild(permissionsBtn);
            actionsDiv.appendChild(changePwdBtn);
            actionsDiv.appendChild(deleteBtn);

            row.appendChild(nameSpan);
            row.appendChild(emailSpan);
            row.appendChild(roleSpan);
            row.appendChild(actionsDiv);

            adminUsersBody.appendChild(row);
        });
    }

    // تصفية المستخدمين أثناء الكتابة في مربع البحث
    if (adminUsersSearchInput) {
        adminUsersSearchInput.addEventListener('input', function () {
            renderAdminUsers();
        });
    }

    // إضافة مستخدم جديد من داخل قسم الإدارة (للأدمن فقط)
    if (adminAddUserForm && adminNewUsernameInput && adminNewEmailInput && adminNewPasswordInput) {
        adminAddUserForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!canCurrentUserAddUsers()) {
                alert('ليست لديك صلاحية إضافة مستخدمين جدد. يرجى التواصل مع الأدمن.');
                return;
            }

            const username = adminNewUsernameInput.value.trim();
            const email = adminNewEmailInput.value.trim().toLowerCase();
            const password = adminNewPasswordInput.value.trim();

            if (!username || !email || !password) {
                alert('يرجى تعبئة جميع الحقول لإضافة المستخدم.');
                return;
            }

            const exists = Array.isArray(users) && users.some(u => u.email === email);
            if (exists) {
                alert('يوجد مستخدم مسجّل بهذا البريد الإلكتروني بالفعل.');
                return;
            }

            const newUser = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                username: username,
                email: email,
                password: password,
                isAdmin: false
            };

            if (!Array.isArray(users)) {
                users = [];
            }
            users.push(newUser);
            saveUsers();

            clearAdminAddUserForm();

            renderAdminUsers();
            alert('تم إضافة المستخدم الجديد بنجاح. يمكنه الآن تسجيل الدخول من شاشة الدخول.');
        });
    }

    // إظهار رابط وقسم الإدارة إذا كان المستخدم الحالي أدمن
    function applyAdminVisibility() {
        if (!adminNav || !adminSection) return;

        if (canCurrentUserAccessAdminSection()) {
            adminNav.style.display = '';
        } else {
            adminNav.style.display = 'none';
            adminSection.style.display = 'none';
        }
    }

    if (adminNav && adminSection) {
        adminNav.addEventListener('click', function (e) {
            e.preventDefault();
            if (!canCurrentUserAccessAdminSection()) {
                alert('ليس لديك صلاحيات كافية للدخول إلى قسم الإدارة. يرجى التواصل مع الأدمن.');
                return;
            }
            adminSection.style.display = 'block';
            clearAdminAddUserForm();
            renderAdminUsers();
            adminSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // إخفاء قسم الإدارة عند الضغط على أي عنصر آخر في القائمة الجانبية
    const sidebarNavLinks = document.querySelectorAll('.sidebar nav a');
    if (sidebarNavLinks && adminSection) {
        sidebarNavLinks.forEach(link => {
            // نتجاهل رابط الإدارة نفسه
            if (link.id === 'adminNav') return;

            link.addEventListener('click', function () {
                adminSection.style.display = 'none';
            });
        });
    }

    // تمرير الصفحة إلى قسم الدعم الفني عند الضغط على رابط الدعم
    if (supportNav && supportSection) {
        supportNav.addEventListener('click', function (e) {
            e.preventDefault();
            supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // وظيفة لتحديث المحتوى الرئيسي
    function updateMainContent(appName) {
        const welcomeTitle = document.querySelector('.welcome-banner h2');
        welcomeTitle.textContent = `مرحباً بك في ${appName}`;
    }

    // التعامل مع زر الإشعارات
    const notificationBtn = document.querySelector('.notification-btn');
    notificationBtn.addEventListener('click', function() {
        alert('سيتم عرض الإشعارات هنا');
    });

    // عناصر نافذة إعدادات الملف الشخصي
    const profileBtn = document.querySelector('.profile-btn');
    const profileModal = document.getElementById('profileModal');
    const profileCloseBtn = document.getElementById('profileCloseBtn');
    const profileForm = document.getElementById('profileForm');
    const profileUsernameInput = document.getElementById('profileUsernameInput');
    const profileEmailInput = document.getElementById('profileEmailInput');
    const profilePermissionsInfo = document.getElementById('profilePermissionsInfo');
    const profileCurrentPasswordInput = document.getElementById('profileCurrentPassword');
    const profileNewPasswordInput = document.getElementById('profileNewPassword');
    const profileConfirmNewPasswordInput = document.getElementById('profileConfirmNewPassword');
    const profileDeleteBtn = document.getElementById('profileDeleteBtn');

    // عناصر نافذة صلاحيات المستخدم
    const permissionsModal = document.getElementById('permissionsModal');
    const permissionsForm = document.getElementById('permissionsForm');
    const permissionsUserLabel = document.getElementById('permissionsUserLabel');
    const permChangePwdsCheckbox = document.getElementById('permChangePwds');
    const permAddUsersCheckbox = document.getElementById('permAddUsers');
    const permManageSupportCheckbox = document.getElementById('permManageSupport');
    const permDeleteUsersCheckbox = document.getElementById('permDeleteUsers');
    const permissionsCloseBtn = document.getElementById('permissionsCloseBtn');
    let permissionsEditingUserId = null;

    // فتح نافذة إعدادات الملف الشخصي
    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', function() {
            if (!currentUser || !currentUser.email) {
                alert('لا يوجد مستخدم مسجّل حالياً. يرجى تسجيل الدخول أولاً.');
                return;
            }

            // نحاول دائماً استخدام أحدث نسخة من بيانات المستخدم من مصفوفة users
            let effectiveUser = currentUser;
            if (Array.isArray(users) && currentUser && currentUser.id) {
                const fresh = users.find(u => u && u.id === currentUser.id);
                if (fresh) {
                    effectiveUser = fresh;
                    currentUser = fresh;
                }
            }

            if (profileUsernameInput) {
                profileUsernameInput.value = effectiveUser.username || '';
                // المستخدم العادي لا يستطيع تعديل الاسم
                profileUsernameInput.readOnly = !isCurrentUserAdmin();
            }
            if (profileEmailInput) {
                profileEmailInput.value = effectiveUser.email || '';
                // المستخدم العادي لا يستطيع تعديل البريد
                profileEmailInput.readOnly = !isCurrentUserAdmin();
            }
            if (profilePermissionsInfo) {
                if (effectiveUser.isAdmin) {
                    profilePermissionsInfo.textContent = 'نوع الحساب: أدمن كامل الصلاحيات.';
                } else {
                    const perms = getUserPermissions(effectiveUser);
                    const labels = [];
                    if (perms.canChangeUsersPasswords) labels.push('تغيير كلمات سر المستخدمين');
                    if (perms.canAddUsers) labels.push('إضافة مستخدمين جدد');
                    if (perms.canManageSupport) labels.push('إدارة / الرد على الدعم الفني');
                    if (perms.canDeleteUsers) labels.push('حذف مستخدمين');

                    if (labels.length === 0) {
                        profilePermissionsInfo.textContent = 'نوع الحساب: مستخدم عادي بدون صلاحيات إدارية إضافية.';
                    } else {
                        profilePermissionsInfo.textContent = 'الصلاحيات الممنوحة لك: ' + labels.join('، ');
                    }
                }
            }
            if (profileCurrentPasswordInput) {
                profileCurrentPasswordInput.value = '';
            }
            if (profileNewPasswordInput) {
                profileNewPasswordInput.value = '';
            }
            if (profileConfirmNewPasswordInput) {
                profileConfirmNewPasswordInput.value = '';
            }

            // لا نسمح بحذف الحساب من هذه النافذة، لذلك نخفي زر الحذف إن وجد
            if (profileDeleteBtn) {
                profileDeleteBtn.style.display = 'none';
            }

            profileModal.style.display = 'flex';
        });
    }

    // حفظ التغييرات في إعدادات الحساب
    if (profileForm && profileUsernameInput && profileEmailInput && profileCurrentPasswordInput) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!currentUser || !currentUser.id) {
                alert('لا يوجد حساب مرتبط حالياً. يرجى تسجيل الدخول من جديد.');
                return;
            }

            const newUsername = profileUsernameInput.value.trim();
            const newEmail = profileEmailInput.value.trim().toLowerCase();
            const currentPassword = profileCurrentPasswordInput ? profileCurrentPasswordInput.value : '';
            const newPassword = profileNewPasswordInput ? profileNewPasswordInput.value : '';
            const confirmNewPassword = profileConfirmNewPasswordInput ? profileConfirmNewPasswordInput.value : '';

            if (!currentPassword) {
                alert('يرجى إدخال كلمة المرور الحالية لحفظ التغييرات.');
                return;
            }

            const index = users.findIndex(u => u.id === currentUser.id);
            if (index === -1) {
                alert('لم يتم العثور على هذا الحساب في السجل.');
                return;
            }

            if (users[index].password !== currentPassword) {
                alert('كلمة المرور الحالية غير صحيحة.');
                return;
            }

            // منطق خاص بالمستخدم العادي: يمكنه فقط تغيير كلمة المرور
            if (!isCurrentUserAdmin()) {
                if (!newPassword && !confirmNewPassword) {
                    alert('لا يوجد تغيير في كلمة المرور.');
                    return;
                }

                if (!newPassword || !confirmNewPassword) {
                    alert('يرجى إدخال كلمة المرور الجديدة وتأكيدها معاً.');
                    return;
                }

                if (newPassword !== confirmNewPassword) {
                    alert('كلمة المرور الجديدة وتأكيدها غير متطابقتين.');
                    return;
                }

                users[index].password = newPassword;
                saveUsers();

                alert('تم تحديث كلمة المرور بنجاح.');
                if (profileModal) {
                    profileModal.style.display = 'none';
                }
                return;
            }

            // منطق الأدمن: يمكنه تعديل الاسم والبريد وكلمة المرور
            if (!newUsername || !newEmail) {
                alert('الاسم والبريد الإلكتروني مطلوبان.');
                return;
            }

            // التحقق من عدم وجود حساب آخر بنفس البريد
            const duplicate = users.some(u => u.email === newEmail && u.id !== currentUser.id);
            if (duplicate) {
                alert('يوجد حساب آخر مسجّل بهذا البريد الإلكتروني.');
                return;
            }

            if (newPassword || confirmNewPassword) {
                if (!newPassword || !confirmNewPassword) {
                    alert('يرجى إدخال كلمة المرور الجديدة وتأكيدها معاً أو تركهما فارغين.');
                    return;
                }
                if (newPassword !== confirmNewPassword) {
                    alert('كلمة المرور الجديدة وتأكيدها غير متطابقتين.');
                    return;
                }
            }

            users[index].username = newUsername;
            users[index].email = newEmail;
            if (newPassword) {
                users[index].password = newPassword;
            }

            saveUsers();

            currentUser.username = newUsername;
            currentUser.email = newEmail;
            try {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
            } catch (e) {}

            alert('تم حفظ التغييرات بنجاح.');
            if (profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }

    // إغلاق نافذة صلاحيات المستخدم
    if (permissionsCloseBtn && permissionsModal) {
        permissionsCloseBtn.addEventListener('click', function () {
            permissionsModal.style.display = 'none';
            permissionsEditingUserId = null;
        });
    }

    // حفظ صلاحيات المستخدم من النافذة المنبثقة
    if (permissionsForm && permissionsModal) {
        permissionsForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!isCurrentUserAdmin()) {
                alert('فقط الأدمن الرئيسي يمكنه تعديل صلاحيات المستخدمين.');
                return;
            }

            if (!permissionsEditingUserId) {
                permissionsModal.style.display = 'none';
                return;
            }

            const idx = users.findIndex(u => u.id === permissionsEditingUserId);
            if (idx === -1) {
                alert('لم يتم العثور على هذا المستخدم في السجل لتحديث صلاحياته.');
                permissionsModal.style.display = 'none';
                permissionsEditingUserId = null;
                return;
            }

            const canChangeUsersPasswords = permChangePwdsCheckbox ? !!permChangePwdsCheckbox.checked : false;
            const canAddUsers = permAddUsersCheckbox ? !!permAddUsersCheckbox.checked : false;
            const canManageSupport = permManageSupportCheckbox ? !!permManageSupportCheckbox.checked : false;
            const canDeleteUsers = permDeleteUsersCheckbox ? !!permDeleteUsersCheckbox.checked : false;

            const newPermissions = {
                canChangeUsersPasswords,
                canAddUsers,
                canManageSupport,
                canDeleteUsers
            };

            users[idx].permissions = newPermissions;

            // إذا كان هذا هو المستخدم الحالي، نحدّث كائن currentUser والتخزين أيضاً
            if (currentUser && currentUser.id === users[idx].id) {
                currentUser.permissions = newPermissions;
                try {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
                } catch (e) {}

                // تحديث ظهور قسم الإدارة بناءً على الصلاحيات الجديدة
                if (typeof applyAdminVisibility === 'function') {
                    applyAdminVisibility();
                }
            }

            saveUsers();
            permissionsModal.style.display = 'none';
            permissionsEditingUserId = null;
            renderAdminUsers();
            alert('تم تحديث صلاحيات المستخدم بنجاح.');
        });
    }

    // تم إلغاء خيار حذف الحساب من نافذة إعدادات الملف الشخصي؛
    // الحذف يتم فقط من قسم "إدارة المستخدمين" بواسطة الأدمن.

    // إغلاق نافذة إعدادات الملف الشخصي
    if (profileCloseBtn && profileModal) {
        profileCloseBtn.addEventListener('click', function () {
            profileModal.style.display = 'none';
        });
    }

    // إغلاق عند الضغط خارج الصندوق
    if (profileModal) {
        profileModal.addEventListener('click', function (e) {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            // تأكيد قبل تسجيل الخروج للسماح بالتراجع عن العملية
            const confirmLogout = confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟');
            if (!confirmLogout) {
                return; // تراجع عن الخروج
            }

            // مسح المستخدم الحالي من الذاكرة والتخزين المحلي
            currentUser = null;
            try {
                localStorage.removeItem('dashboard_current_user');
            } catch (e) {}

            // إخفاء قسم الإدارة وتفريغ نموذج إضافة المستخدم عند الخروج
            if (adminSection) {
                adminSection.style.display = 'none';
            }
            if (typeof clearAdminAddUserForm === 'function') {
                clearAdminAddUserForm();
            }
            if (typeof updateCurrentUserDisplay === 'function') {
                updateCurrentUserDisplay();
            }

            // إعادة إظهار طبقة تسجيل الدخول إذا كان هناك مستخدمون مسجلون
            if (typeof applyAuthGuard === 'function') {
                applyAuthGuard();
            } else {
                const overlay = document.getElementById('authOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }
            }

            alert('تم تسجيل الخروج بنجاح.');
        });
    }

    // تحميل إعدادات الدعم الفني المخزَّنة عند فتح الصفحة
    if (typeof loadSupportSettings === 'function') {
        loadSupportSettings();
    }

    // تفعيل وضع إدارة التنزيلات من القائمة الجانبية
    const downloadsNav = document.getElementById('downloadsNav');
    if (downloadsNav) {
        downloadsNav.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('manage-mode');
        });
    }

    // التبويبات (تطبيقات الويب / تطبيقات أندرويد)
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-tab');

            // تبديل حالة الأزرار
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // تبديل حالة التبويبات
            tabPanes.forEach(pane => {
                if (pane.id === targetId) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });

    // دالة لإضافة تأثير التحويم على بطاقة تطبيق واحدة
    function attachCardHover(card) {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    }

    // دالة لإضافة منطق الحذف لبطاقة واحدة (مع تأكيد فقط)
    function attachDeleteHandler(card) {
        const deleteBtn = card.querySelector('.delete-btn');
        if (!deleteBtn) return;

        deleteBtn.addEventListener('click', function () {
            const confirmDelete = confirm('هل أنت متأكد من حذف هذا التطبيق؟ لا يمكن التراجع.');
            if (!confirmDelete) return;

            const appId = card.dataset.appId;
            const favoriteId = card.dataset.favoriteId;
            if (favoriteId) {
                // حذف من قسم المفضلة فقط
                favoriteApps = favoriteApps.filter(app => app.id !== favoriteId);
                saveFavoriteApps();
            } else if (appId) {
                // بطاقات مضافة ديناميكياً (ويب أو أندرويد أو سوشيال)
                const inWeb = card.closest('#webAppsGrid') !== null;
                const inApk = card.closest('#apkAppsGrid') !== null;
                const inSocial = card.closest('#socialAppsGrid') !== null;

                if (inWeb) {
                    webApps = webApps.filter(app => app.id !== appId);
                    saveWebApps();
                } else if (inApk) {
                    apkApps = apkApps.filter(app => app.id !== appId);
                    saveApkApps();
                } else if (inSocial) {
                    socialApps = socialApps.filter(app => app.id !== appId);
                    saveSocialApps();
                }
            } else {
                // بطاقة ثابتة من HTML: نحفظ اسمها ورابطها حتى لا تعود بعد التحديث
                const titleEl = card.querySelector('.app-info h3');
                const primaryLink = card.querySelector('.app-actions a.btn-primary');
                const name = titleEl ? titleEl.textContent.trim() : '';
                const url = primaryLink ? primaryLink.getAttribute('href') : '';

                if (name && url) {
                    const key = name + '|' + url;
                    if (!deletedStaticCardKeys.includes(key)) {
                        deletedStaticCardKeys.push(key);
                        saveDeletedStaticCards();
                    }
                }
            }

            card.remove();
            updateSectionCounts();
        });
    }

    // دالة لإضافة منطق تعديل تطبيقات الويب لبطاقة واحدة
    function attachEditHandler(card) {
        const editBtn = card.querySelector('.edit-btn');
        if (!editBtn) return;

        editBtn.addEventListener('click', function () {
            // منع فتح أكثر من نموذج تعديل لنفس البطاقة
            if (card.classList.contains('editing')) return;

            const titleEl = card.querySelector('.app-info h3');
            const descEl = card.querySelector('.app-description');
            const primaryLink = card.querySelector('.app-actions a.btn-primary');
            const secondaryLink = card.querySelector('.app-actions a.btn-secondary');
            const statusSpan = card.querySelector('.app-meta .status');

            const inWeb = card.closest('#webAppsGrid') !== null;
            const inApk = card.closest('#apkAppsGrid') !== null;
            const inSocial = card.closest('#socialAppsGrid') !== null;

            const currentName = titleEl ? titleEl.textContent.trim() : '';
            const currentDesc = descEl ? descEl.textContent.trim() : '';
            const currentUrl = primaryLink ? primaryLink.getAttribute('href') : '';
            const currentStatusText = statusSpan ? statusSpan.textContent.trim() : 'جاهز';
            const currentStatusClass = statusSpan ? statusSpan.classList[1] || 'stable' : 'stable';

            let currentStatusValue = 'ready';
            // خريطة الحالات حسب القسم
            if (inSocial) {
                if (currentStatusClass === 'update') currentStatusValue = 'important';
                else if (currentStatusClass === 'review') currentStatusValue = 'later';
                else currentStatusValue = 'normal';
            } else {
                if (currentStatusClass === 'review') currentStatusValue = 'review';
                else if (currentStatusClass === 'development') currentStatusValue = 'develop';
                else if (currentStatusClass === 'stopped') currentStatusValue = 'stopped';
            }

            card.classList.add('editing');

            // إنشاء HTML خيارات حالة التطبيق حسب القسم
            let statusOptionsHtml = '';
            if (inSocial) {
                statusOptionsHtml = `
                    <option value="important" ${currentStatusValue === 'important' ? 'selected' : ''}>مهم</option>
                    <option value="later" ${currentStatusValue === 'later' ? 'selected' : ''}>للمشاهدة لاحقاً</option>
                    <option value="normal" ${currentStatusValue === 'normal' ? 'selected' : ''}>عادي</option>
                `;
            } else {
                statusOptionsHtml = `
                    <option value="ready" ${currentStatusValue === 'ready' ? 'selected' : ''}>جاهز</option>
                    <option value="review" ${currentStatusValue === 'review' ? 'selected' : ''}>قيد المراجعة</option>
                    <option value="develop" ${currentStatusValue === 'develop' ? 'selected' : ''}>قيد التطوير</option>
                    <option value="stopped" ${currentStatusValue === 'stopped' ? 'selected' : ''}>متوقف</option>
                `;
            }

            // إنشاء نموذج التعديل داخل البطاقة
            const editForm = document.createElement('div');
            editForm.className = 'app-edit-form';
            editForm.innerHTML = `
                <div class="form-row">
                    <label>اسم التطبيق</label>
                    <input type="text" class="edit-name" value="${currentName}">
                </div>
                <div class="form-row">
                    <label>الوصف القصير</label>
                    <input type="text" class="edit-desc" value="${currentDesc}">
                </div>
                <div class="form-row">
                    <label>رابط الموقع</label>
                    <input type="url" class="edit-url" value="${currentUrl}">
                </div>
                <div class="form-row">
                    <label>حالة التطبيق</label>
                    <select class="edit-status">
                        ${statusOptionsHtml}
                    </select>
                </div>
                <div class="edit-actions">
                    <button type="button" class="btn btn-primary save-edit">حفظ</button>
                    <button type="button" class="btn btn-secondary cancel-edit">إلغاء</button>
                </div>
            `;

            const info = card.querySelector('.app-info');
            if (!info) return;

            // إخفاء منطقة الميتا مؤقتاً أثناء التعديل ليكون التركيز على النموذج
            const metaEl = info.querySelector('.app-meta');
            const actionsEl = card.querySelector('.app-actions');
            if (metaEl) metaEl.style.display = 'none';
            if (actionsEl) actionsEl.style.display = 'none';

            info.appendChild(editForm);

            const nameInput = editForm.querySelector('.edit-name');
            const descInput = editForm.querySelector('.edit-desc');
            const urlInput = editForm.querySelector('.edit-url');
            const statusSelect = editForm.querySelector('.edit-status');
            const saveBtn = editForm.querySelector('.save-edit');
            const cancelBtn = editForm.querySelector('.cancel-edit');

            function cleanup() {
                editForm.remove();
                if (metaEl) metaEl.style.display = '';
                if (actionsEl) actionsEl.style.display = '';
                card.classList.remove('editing');
            }

            saveBtn.addEventListener('click', function () {
                const newName = nameInput.value.trim();
                const newDesc = descInput.value.trim();
                const newUrl = urlInput.value.trim();
                const statusValue = statusSelect ? statusSelect.value : 'ready';

                if (!newName || !newUrl) {
                    alert('الاسم والرابط مطلوبان.');
                    return;
                }

                if (titleEl) titleEl.textContent = newName;

                if (newDesc) {
                    if (descEl) {
                        descEl.textContent = newDesc;
                    } else {
                        const newDescP = document.createElement('p');
                        newDescP.className = 'app-description';
                        newDescP.textContent = newDesc;
                        if (info) {
                            const meta = info.querySelector('.app-meta');
                            info.insertBefore(newDescP, meta || info.firstChild);
                        }
                    }
                } else if (descEl) {
                    descEl.remove();
                }

                if (primaryLink) primaryLink.setAttribute('href', newUrl);
                if (secondaryLink) secondaryLink.setAttribute('href', newUrl);

                // تحديث الحالة النصية والكلاس
                let statusText = 'جاهز';
                let statusClass = 'stable';
                if (inSocial) {
                    if (statusValue === 'important') {
                        statusText = 'مهم';
                        statusClass = 'update';
                    } else if (statusValue === 'later') {
                        statusText = 'للمشاهدة لاحقاً';
                        statusClass = 'review';
                    } else {
                        statusText = 'عادي';
                        statusClass = 'stable';
                    }
                } else {
                    if (statusValue === 'review') {
                        statusText = 'قيد المراجعة';
                        statusClass = 'review';
                    } else if (statusValue === 'develop') {
                        statusText = 'قيد التطوير';
                        statusClass = 'development';
                    } else if (statusValue === 'stopped') {
                        statusText = 'متوقف';
                        statusClass = 'stopped';
                    }
                }

                if (statusSpan) {
                    statusSpan.textContent = statusText;
                    statusSpan.className = `status ${statusClass}`;
                }

                // تحديث نمط البطاقة المعطلة عند حالة متوقف
                if (statusClass === 'stopped') {
                    card.classList.add('card-disabled');
                } else {
                    card.classList.remove('card-disabled');
                }

                // إذا كانت البطاقة من التطبيقات المحفوظة، نحدّث بياناتها في المصفوفة المناسبة (ويب / أندرويد / سوشيال)
                const appId = card.dataset.appId;
                if (appId) {
                    const inWeb = card.closest('#webAppsGrid') !== null;
                    const inApk = card.closest('#apkAppsGrid') !== null;
                    const inSocial = card.closest('#socialAppsGrid') !== null;

                    let list = null;
                    if (inWeb) list = webApps;
                    else if (inApk) list = apkApps;
                    else if (inSocial) list = socialApps;

                    if (list) {
                        const index = list.findIndex(app => app.id === appId);
                        if (index !== -1) {
                            list[index].name = newName;
                            list[index].url = newUrl;
                            list[index].desc = newDesc;
                            list[index].statusText = statusText;
                            list[index].statusClass = statusClass;

                            if (inWeb) saveWebApps();
                            else if (inApk) saveApkApps();
                            else if (inSocial) saveSocialApps();
                        }
                    }
                }

                cleanup();
            });

            cancelBtn.addEventListener('click', function () {
                cleanup();
            });
        });
    }

    // مصفوفات للتخزين في localStorage
    let webApps = [];
    let apkApps = [];
    let socialApps = [];
    let favoriteApps = [];
    let users = [];
    let currentUser = null;
    // قائمة مفاتيح البطاقات الثابتة المحذوفة (اسم + رابط)
    let deletedStaticCardKeys = [];

    // مفاتيح التخزين المحلية
    const WEB_APPS_KEY = 'dashboard_web_apps';
    const APK_APPS_KEY = 'dashboard_apk_apps';
    const SOCIAL_APPS_KEY = 'dashboard_social_apps';
    const FAVORITES_KEY = 'dashboard_favorite_apps';
    const USERS_KEY = 'dashboard_users';
    const CURRENT_USER_KEY = 'dashboard_current_user';
    const DELETED_STATIC_KEY = 'dashboard_deleted_static_cards';

    function saveWebApps() {
        localStorage.setItem(WEB_APPS_KEY, JSON.stringify(webApps));
    }

    function saveApkApps() {
        localStorage.setItem(APK_APPS_KEY, JSON.stringify(apkApps));
    }

    function saveSocialApps() {
        localStorage.setItem(SOCIAL_APPS_KEY, JSON.stringify(socialApps));
    }

    function saveDeletedStaticCards() {
        localStorage.setItem(DELETED_STATIC_KEY, JSON.stringify(deletedStaticCardKeys));
    }

    function saveFavoriteApps() {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteApps));
    }

    function saveUsers() {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // دالة لتحديث عدد التطبيقات في كل قسم
    function updateSectionCounts() {
        const webGrid = document.getElementById('webAppsGrid');
        const apkGrid = document.getElementById('apkAppsGrid');
        const socialGrid = document.getElementById('socialAppsGrid');
        const favoriteGrid = document.getElementById('favoriteAppsGrid');

        const webCountEl = document.getElementById('webAppsCount');
        const apkCountEl = document.getElementById('apkAppsCount');
        const socialCountEl = document.getElementById('socialAppsCount');
        const favoriteCountEl = document.getElementById('favoriteAppsCount');

        const webCount = webGrid
            ? Array.from(webGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;
        const apkCount = apkGrid
            ? Array.from(apkGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;
        const socialCount = socialGrid
            ? Array.from(socialGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;
        const favoriteCount = favoriteGrid
            ? Array.from(favoriteGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;

        if (webCountEl) webCountEl.textContent = `(${webCount})`;
        if (apkCountEl) apkCountEl.textContent = `(${apkCount})`;
        if (socialCountEl) socialCountEl.textContent = `(${socialCount})`;
        if (favoriteCountEl) favoriteCountEl.textContent = `(${favoriteCount})`;
    }

    // دالة عامة للبحث عن رابط في جميع الأقسام
    function findUrlInAllSections(normalizedUrl) {
        // البحث في تطبيقات الويب
        const webMatch = webApps.find(app => app.url === normalizedUrl);
        if (webMatch) {
            return {
                sectionKey: 'web',
                sectionLabel: 'تطبيقات الويب',
                gridSelector: '#webAppsGrid',
                appId: webMatch.id
            };
        }

        // البحث في تطبيقات الأندرويد APK
        const apkMatch = apkApps.find(app => app.url === normalizedUrl);
        if (apkMatch) {
            return {
                sectionKey: 'apk',
                sectionLabel: 'تطبيقات أندرويد (APK)',
                gridSelector: '#apkAppsGrid',
                appId: apkMatch.id
            };
        }

        // البحث في تطبيقات السوشيال ميديا
        const socialMatch = socialApps.find(app => app.url === normalizedUrl);
        if (socialMatch) {
            return {
                sectionKey: 'social',
                sectionLabel: 'تطبيقات السوشيال ميديا',
                gridSelector: '#socialAppsGrid',
                appId: socialMatch.id
            };
        }

        return null;
    }

    function createWebCardFromData(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.dataset.appId = app.id;
        card.innerHTML = `
            <img src="https://picsum.photos/300/210" alt="${app.name}">
            <div class="app-info">
                <h3>${app.name}</h3>
                ${app.desc ? `<p class="app-description">${app.desc}</p>` : ''}
                <div class="app-meta">
                    <span>تطبيق ويب - الإصدار 1.0.0</span>
                    <span class="status ${app.statusClass}">${app.statusText}</span>
                </div>
                <div class="app-actions">
                    <a href="${app.url}" class="btn btn-primary" target="_blank">زيارة الموقع</a>
                    <a href="${app.url}" class="btn btn-secondary" target="_blank">عرض صفحة التطبيق</a>
                    <button type="button" class="btn" data-favorite-btn>إضافة إلى المفضلة</button>
                    <button type="button" class="btn" data-remove-favorite-btn style="display:none;">إزالة من المفضلة</button>
                    <button type="button" class="btn edit-btn">تعديل التطبيق</button>
                    <button type="button" class="btn delete-btn">حذف التطبيق</button>
                </div>
            </div>
        `;

        const webAppsGrid = document.getElementById('webAppsGrid');
        if (webAppsGrid) {
            if (app.statusClass === 'stopped') {
                card.classList.add('card-disabled');
            }
            // إضافة في بداية الشبكة
            if (webAppsGrid.firstChild) {
                webAppsGrid.insertBefore(card, webAppsGrid.firstChild);
            } else {
                webAppsGrid.appendChild(card);
            }
            attachCardHover(card);
            attachDeleteHandler(card);
            attachEditHandler(card);
            attachFavoriteHandler(card, 'من قسم تطبيقات الويب');
        }
    }

    // دالة مساعدة لتفعيل التبويب المناسب حسب شبكة البطاقات
    function activateTabForGrid(gridSelector) {
        let targetTabId = null;
        if (gridSelector === '#webAppsGrid') {
            targetTabId = 'webAppsTab';
        } else if (gridSelector === '#apkAppsGrid') {
            targetTabId = 'apkAppsTab';
        } else if (gridSelector === '#socialAppsGrid') {
            targetTabId = 'socialAppsTab';
        }

        if (!targetTabId) return;

        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(btn => {
            const btnTarget = btn.getAttribute('data-tab');
            if (btnTarget === targetTabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === targetTabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }

    // تظليل بطاقة موجودة والتمرير إليها مع فتح التبويب الصحيح
    function highlightExistingCardById(appId, gridSelector) {
        if (!appId) return;

        // فتح التبويب المناسب أولاً
        if (gridSelector) {
            activateTabForGrid(gridSelector);
        }

        const grid = document.querySelector(gridSelector);
        if (!grid) return;
        const card = grid.querySelector(`.app-card[data-app-id="${appId}"]`);
        if (!card) return;

        card.classList.add('card-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            card.classList.remove('card-highlight');
        }, 2000);
    }

    function createApkCardFromData(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.dataset.appId = app.id;
        card.innerHTML = `
            <img src="https://picsum.photos/300/211" alt="${app.name}">
            <div class="app-info">
                <h3>${app.name}</h3>
                ${app.desc ? `<p class="app-description">${app.desc}</p>` : ''}
                <div class="app-meta">
                    <span>تطبيق أندرويد - APK</span>
                    <span class="status ${app.statusClass}">${app.statusText}</span>
                </div>
                <div class="app-actions">
                    <a href="${app.url}" class="btn btn-primary" target="_blank">تحميل APK</a>
                    <a href="${app.url}" class="btn btn-secondary" target="_blank">فتح الرابط</a>
                    <button type="button" class="btn" data-favorite-btn>إضافة إلى المفضلة</button>
                    <button type="button" class="btn" data-remove-favorite-btn style="display:none;">إزالة من المفضلة</button>
                    <button type="button" class="btn edit-btn">تعديل التطبيق</button>
                    <button type="button" class="btn delete-btn">حذف التطبيق</button>
                </div>
            </div>
        `;

        const apkAppsGrid = document.getElementById('apkAppsGrid');
        if (apkAppsGrid) {
            if (app.statusClass === 'stopped') {
                card.classList.add('card-disabled');
            }
            // إضافة في بداية الشبكة
            if (apkAppsGrid.firstChild) {
                apkAppsGrid.insertBefore(card, apkAppsGrid.firstChild);
            } else {
                apkAppsGrid.appendChild(card);
            }
            attachCardHover(card);
            attachDeleteHandler(card);
            attachEditHandler(card);
            attachFavoriteHandler(card, 'من قسم تطبيقات السوشيال ميديا');
        }
    }

    function createSocialCardFromData(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.dataset.appId = app.id;
        card.innerHTML = `
            <img src="https://picsum.photos/300/212" alt="${app.name}">
            <div class="app-info">
                <h3>${app.name}</h3>
                ${app.desc ? `<p class="app-description">${app.desc}</p>` : ''}
                <div class="app-meta">
                    <span>تطبيق سوشيال ميديا</span>
                    <span class="status ${app.statusClass}">${app.statusText}</span>
                </div>
                <div class="app-actions">
                    <a href="${app.url}" class="btn btn-primary" target="_blank">زيارة / فتح الحساب</a>
                    <a href="${app.url}" class="btn btn-secondary" target="_blank">فتح في تبويب جديد</a>
                    <button type="button" class="btn" data-favorite-btn>إضافة إلى المفضلة</button>
                    <button type="button" class="btn" data-remove-favorite-btn style="display:none;">إزالة من المفضلة</button>
                    <button type="button" class="btn edit-btn">تعديل التطبيق</button>
                    <button type="button" class="btn delete-btn">حذف التطبيق</button>
                </div>
            </div>
        `;

        const socialAppsGrid = document.getElementById('socialAppsGrid');
        if (socialAppsGrid) {
            if (app.statusClass === 'stopped') {
                card.classList.add('card-disabled');
            }
            // إضافة في بداية الشبكة
            if (socialAppsGrid.firstChild) {
                socialAppsGrid.insertBefore(card, socialAppsGrid.firstChild);
            } else {
                socialAppsGrid.appendChild(card);
            }
            attachCardHover(card);
            attachDeleteHandler(card);
            attachEditHandler(card);
        }
    }

    // الانتقال من بطاقة المفضلة إلى البطاقة الأصلية في القسم المناسب مع وميض
    function attachFavoriteOriginHandler(favCard) {
        const goBtn = favCard.querySelector('[data-go-original-btn]');
        if (!goBtn) return;

        goBtn.addEventListener('click', function () {
            const titleEl = favCard.querySelector('.app-info h3');
            const primaryLink = favCard.querySelector('.app-actions a.btn-primary');
            const name = titleEl ? titleEl.textContent.trim() : '';
            const url = primaryLink ? primaryLink.getAttribute('href') : '';

            if (!name || !url) return;

            const grids = [
                { selector: '#webAppsGrid', tabId: 'webAppsTab' },
                { selector: '#apkAppsGrid', tabId: 'apkAppsTab' },
                { selector: '#socialAppsGrid', tabId: 'socialAppsTab' }
            ];

            let foundCard = null;
            let targetGridSelector = null;

            for (const g of grids) {
                const grid = document.querySelector(g.selector);
                if (!grid) continue;

                const cards = grid.querySelectorAll('.app-card');
                for (const card of cards) {
                    const cTitleEl = card.querySelector('.app-info h3');
                    const cPrimaryLink = card.querySelector('.app-actions a.btn-primary');
                    const cName = cTitleEl ? cTitleEl.textContent.trim() : '';
                    const cUrl = cPrimaryLink ? cPrimaryLink.getAttribute('href') : '';

                    if (cName === name && cUrl === url) {
                        foundCard = card;
                        targetGridSelector = g.selector;
                        break;
                    }
                }

                if (foundCard) break;
            }

            if (!foundCard || !targetGridSelector) {
                alert('لم يتم العثور على البطاقة الأصلية في الأقسام الأخرى. قد تكون محذوفة.');
                return;
            }

            // تفعيل التبويب المناسب أولاً
            activateTabForGrid(targetGridSelector);

            // تمرير إلى البطاقة وإضافة تأثير الوميض
            foundCard.classList.add('card-highlight');
            foundCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                foundCard.classList.remove('card-highlight');
            }, 2000);
        });
    }

    function createFavoriteCardFromData(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.dataset.favoriteId = app.id;
        card.innerHTML = `
            <img src="${app.imageSrc || 'https://picsum.photos/300/213'}" alt="${app.name}">
            <div class="app-info">
                <h3>${app.name}</h3>
                ${app.desc ? `<p class="app-description">${app.desc}</p>` : ''}
                <div class="app-meta">
                    <span>${app.sourceLabel || 'تطبيق مفضل'}</span>
                    <span class="status ${app.statusClass}">${app.statusText}</span>
                </div>
                <div class="app-actions">
                    <a href="${app.url}" class="btn btn-primary" target="_blank">فتح التطبيق</a>
                    <a href="${app.url}" class="btn btn-secondary" target="_blank">فتح في تبويب جديد</a>
                    <button type="button" class="btn" data-go-original-btn>الذهاب إلى البطاقة الأصلية</button>
                    <button type="button" class="btn delete-btn">إزالة من المفضلة</button>
                </div>
            </div>
        `;

        const favoriteGrid = document.getElementById('favoriteAppsGrid');
        if (favoriteGrid) {
            if (app.statusClass === 'stopped') {
                card.classList.add('card-disabled');
            }
            if (favoriteGrid.firstChild) {
                favoriteGrid.insertBefore(card, favoriteGrid.firstChild);
            } else {
                favoriteGrid.appendChild(card);
            }
            attachCardHover(card);
            attachDeleteHandler(card);
            attachFavoriteOriginHandler(card);
        }
    }

    // تحميل البيانات من localStorage عند بداية التشغيل
    try {
        const storedWeb = localStorage.getItem(WEB_APPS_KEY);
        if (storedWeb) {
            webApps = JSON.parse(storedWeb);
            webApps.forEach(app => createWebCardFromData(app));
        }
    } catch (e) {
        webApps = [];
    }

    try {
        const storedApk = localStorage.getItem(APK_APPS_KEY);
        if (storedApk) {
            apkApps = JSON.parse(storedApk);
            apkApps.forEach(app => createApkCardFromData(app));
        }
    } catch (e) {
        apkApps = [];
    }

    try {
        const storedSocial = localStorage.getItem(SOCIAL_APPS_KEY);
        if (storedSocial) {
            socialApps = JSON.parse(storedSocial);
            socialApps.forEach(app => createSocialCardFromData(app));
        }
    } catch (e) {
        socialApps = [];
    }

    try {
        const storedDeleted = localStorage.getItem(DELETED_STATIC_KEY);
        if (storedDeleted) {
            deletedStaticCardKeys = JSON.parse(storedDeleted);
        }
    } catch (e) {
        deletedStaticCardKeys = [];
    }

    try {
        const storedFavorites = localStorage.getItem(FAVORITES_KEY);
        if (storedFavorites) {
            favoriteApps = JSON.parse(storedFavorites);
            favoriteApps.forEach(app => createFavoriteCardFromData(app));
        }
    } catch (e) {
        favoriteApps = [];
    }

    try {
        const storedUsers = localStorage.getItem(USERS_KEY);
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
    } catch (e) {
        users = [];
    }

    // ضمان وجود حقل isAdmin وتعيين الأدمن الأول إذا لم يكن موجوداً
    if (Array.isArray(users) && users.length > 0) {
        let hasAdmin = users.some(u => u && u.isAdmin === true);
        if (!hasAdmin) {
            // اجعل أول مستخدم في القائمة هو الأدمن
            users[0].isAdmin = true;
            try {
                saveUsers();
            } catch (e) {}
        }
    }

    // قراءة المستخدم الحالي إن وُجد
    try {
        const storedCurrent = localStorage.getItem(CURRENT_USER_KEY);
        if (storedCurrent) {
            currentUser = JSON.parse(storedCurrent);
        }
    } catch (e) {
        currentUser = null;
    }

    // بعد تحميل المستخدم الحالي من التخزين، نطبّق ظهور قسم الإدارة ونحدّث عرض المستخدم الحالي في الهيدر
    if (typeof applyAdminVisibility === 'function') {
        applyAdminVisibility();
    }
    if (typeof updateCurrentUserDisplay === 'function') {
        updateCurrentUserDisplay();
    }

    // تطبيق تأثير التحويم ومنطق الحذف/التعديل/المفضلة على البطاقات الثابتة الموجودة في HTML فقط
    const appCards = document.querySelectorAll('.app-card');
    appCards.forEach(card => {
        // لا نعيد ربط البطاقات التي تم إنشاؤها من localStorage (لديها appId) لأننا ربطناها بالفعل
        if (card.dataset.appId) return;

        // إذا كانت البطاقة من البطاقات الثابتة المحذوفة سابقاً، لا نظهرها
        const titleEl = card.querySelector('.app-info h3');
        const primaryLink = card.querySelector('.app-actions a.btn-primary');
        const name = titleEl ? titleEl.textContent.trim() : '';
        const url = primaryLink ? primaryLink.getAttribute('href') : '';
        const key = name && url ? (name + '|' + url) : null;
        if (key && deletedStaticCardKeys.includes(key)) {
            card.remove();
            return;
        }

        attachCardHover(card);
        attachDeleteHandler(card);
        attachEditHandler(card);

        // تحديد النص المناسب للمصدر حسب القسم
        let sourceLabel = '';
        if (card.closest('#webAppsGrid')) {
            sourceLabel = 'من قسم تطبيقات الويب';
        } else if (card.closest('#apkAppsGrid')) {
            sourceLabel = 'من قسم تطبيقات الأندرويد';
        } else if (card.closest('#socialAppsGrid')) {
            sourceLabel = 'من قسم تطبيقات السوشيال ميديا';
        }
        attachFavoriteHandler(card, sourceLabel);
    });

    // بعد تحميل كل البيانات ومعالجة البطاقات الثابتة المحذوفة، نحدّث عداد التطبيقات لكل قسم
    updateSectionCounts();

    // التعامل مع نموذج إضافة تطبيق ويب جديد
    const addWebAppForm = document.getElementById('addWebAppForm');
    const appNameInput = document.getElementById('appNameInput');
    const appUrlInput = document.getElementById('appUrlInput');
    const appDescriptionInput = document.getElementById('appDescriptionInput');
    const appStatusSelect = document.getElementById('appStatusSelect');
    const webAppsGrid = document.getElementById('webAppsGrid');

    if (addWebAppForm && appNameInput && appUrlInput && webAppsGrid) {
        addWebAppForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = appNameInput.value.trim();
            const url = appUrlInput.value.trim();
            let desc = appDescriptionInput ? appDescriptionInput.value.trim() : '';
            const statusValue = appStatusSelect ? appStatusSelect.value : 'ready';

            if (!name || !url) {
                return;
            }

            const normalizedUrl = url.trim();
            // فحص الرابط في جميع الأقسام
            const duplicate = findUrlInAllSections(normalizedUrl);
            if (duplicate) {
                const goToExisting = confirm(`هذا الرابط مضاف مسبقاً في قسم: ${duplicate.sectionLabel}.\n\nاضغط موافق للانتقال إلى البطاقة الموجودة، أو إلغاء لإضافته مرة أخرى هنا في قسم تطبيقات الويب.`);
                if (goToExisting) {
                    highlightExistingCardById(duplicate.appId, duplicate.gridSelector);
                    return;
                }
            }

            // إذا لم يكتب المستخدم وصفًا، نولّد وصفًا تلقائيًا حسب الدومين
            if (!desc) {
                const domain = getDomainLabel(normalizedUrl);
                desc = `موقع ويب على: ${domain}`;
            }

            // تحديد نص الحالة والكلاس حسب الاختيار
            let statusText = 'جاهز';
            let statusClass = 'stable';
            if (statusValue === 'review') {
                statusText = 'قيد المراجعة';
                statusClass = 'review';
            } else if (statusValue === 'develop') {
                statusText = 'قيد التطوير';
                statusClass = 'development';
            } else if (statusValue === 'stopped') {
                statusText = 'متوقف';
                statusClass = 'stopped';
            }
            // إنشاء كائن بيانات للتطبيق الجديد
            const appData = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                name,
                url: normalizedUrl,
                desc,
                statusText,
                statusClass
            };

            webApps.push(appData);
            saveWebApps();

            createWebCardFromData(appData);
            updateSectionCounts();

            // تفريغ الحقول بعد الإضافة
            appNameInput.value = '';
            appUrlInput.value = '';
            if (appDescriptionInput) appDescriptionInput.value = '';
            if (appStatusSelect) appStatusSelect.value = 'ready';
        });
    }

    // التعامل مع نموذج إضافة تطبيق أندرويد (APK) جديد
    const addApkAppForm = document.getElementById('addApkAppForm');
    const appApkNameInput = document.getElementById('appApkNameInput');
    const appApkUrlInput = document.getElementById('appApkUrlInput');
    const appApkDescriptionInput = document.getElementById('appApkDescriptionInput');
    const apkAppsGrid = document.getElementById('apkAppsGrid');
    const appApkStatusSelect = document.getElementById('appApkStatusSelect');

    if (addApkAppForm && appApkNameInput && appApkUrlInput && apkAppsGrid) {
        addApkAppForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = appApkNameInput.value.trim();
            const url = appApkUrlInput.value.trim();
            let desc = appApkDescriptionInput ? appApkDescriptionInput.value.trim() : '';
            const statusValue = appApkStatusSelect ? appApkStatusSelect.value : 'ready';

            if (!name || !url) {
                return;
            }

            const normalizedUrl = url.trim();
            // فحص الرابط في جميع الأقسام
            const duplicate = findUrlInAllSections(normalizedUrl);
            if (duplicate) {
                const goToExisting = confirm(`هذا الرابط مضاف مسبقاً في قسم: ${duplicate.sectionLabel}.\n\nاضغط موافق للانتقال إلى البطاقة الموجودة، أو إلغاء لإضافته مرة أخرى هنا في قسم تطبيقات أندرويد (APK).`);
                if (goToExisting) {
                    highlightExistingCardById(duplicate.appId, duplicate.gridSelector);
                    return;
                }
            }

            // تحديد نص الحالة والكلاس حسب الاختيار
            let statusText = 'جاهز';
            let statusClass = 'stable';
            if (statusValue === 'review') {
                statusText = 'قيد المراجعة';
                statusClass = 'review';
            } else if (statusValue === 'develop') {
                statusText = 'قيد التطوير';
                statusClass = 'development';
            } else if (statusValue === 'stopped') {
                statusText = 'متوقف';
                statusClass = 'stopped';
            }
            // إنشاء كائن بيانات لتطبيق الأندرويد الجديد
            const appData = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                name,
                url,
                desc,
                statusText,
                statusClass
            };

            apkApps.push(appData);
            saveApkApps();

            createApkCardFromData(appData);
            updateSectionCounts();

            // تفريغ الحقول بعد الإضافة
            appApkNameInput.value = '';
            appApkUrlInput.value = '';
            if (appApkDescriptionInput) appApkDescriptionInput.value = '';
            if (appApkStatusSelect) appApkStatusSelect.value = 'ready';
        });
    }

    // التعامل مع نموذج إنشاء حساب جديد
    const signupForm = document.getElementById('signupForm');
    const signupUsername = document.getElementById('signupUsername');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupConfirmPassword = document.getElementById('signupConfirmPassword');

    if (signupForm && signupUsername && signupEmail && signupPassword && signupConfirmPassword) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = signupUsername.value.trim();
            const email = signupEmail.value.trim().toLowerCase();
            const password = signupPassword.value.trim();
            const confirmPassword = signupConfirmPassword.value.trim();

            if (!username || !email || !password || !confirmPassword) {
                alert('يرجى تعبئة جميع الحقول.');
                return;
            }

            if (password !== confirmPassword) {
                alert('كلمتا المرور غير متطابقتين.');
                return;
            }

            const exists = users.some(user => user.email === email);
            if (exists) {
                alert('يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل.');
                return;
            }

            const userData = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                username,
                email,
                password,
                // أول مستخدم يتم إنشاؤه يصبح أدمن تلقائياً
                isAdmin: users.length === 0
            };

            users.push(userData);
            saveUsers();

            signupUsername.value = '';
            signupEmail.value = '';
            signupPassword.value = '';
            signupConfirmPassword.value = '';

            alert('تم إنشاء الحساب بنجاح. يمكنك استخدام هذه البيانات في شاشة تسجيل الدخول.');
        });
    }

    // منطق تسجيل الدخول / إنشاء الحساب وحماية اللوحة
    const authOverlay = document.getElementById('authOverlay');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const goToSignupBtn = document.getElementById('goToSignupBtn');
    const goToLoginBtn = document.getElementById('goToLoginBtn');

    function showLoginView() {
        if (!authOverlay) return;
        if (authTitle) authTitle.textContent = 'تسجيل الدخول';
        if (authSubtitle) authSubtitle.textContent = 'قم بتسجيل الدخول للوصول إلى لوحة التحكم';
        if (loginForm) loginForm.style.display = 'flex';
        if (signupForm) signupForm.style.display = 'none';
    }

    function showSignupView() {
        if (!authOverlay) return;
        if (authTitle) authTitle.textContent = 'إنشاء حساب جديد';
        if (authSubtitle) authSubtitle.textContent = 'قم بإنشاء حساب جديد لاستخدام لوحة التحكم';
        if (loginForm) loginForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'flex';
    }

    if (goToSignupBtn) {
        goToSignupBtn.addEventListener('click', function () {
            showSignupView();
        });
    }

    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', function () {
            showLoginView();
        });
    }

    function applyAuthGuard() {
        if (!authOverlay || !loginForm) return;

        // إذا لم يكن هناك أي مستخدمين مسجلين، نظهر طبقة المصادقة مع نموذج إنشاء الحساب
        if (!users || users.length === 0) {
            authOverlay.style.display = 'flex';
            showSignupView();
            return;
        }

        if (currentUser && currentUser.email) {
            authOverlay.style.display = 'none';
        } else {
            authOverlay.style.display = 'flex';
            showLoginView();
        }
    }

    if (loginForm && loginEmail && loginPassword) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = loginEmail.value.trim().toLowerCase();
            const password = loginPassword.value.trim();

            if (!email || !password) {
                if (loginError) {
                    loginError.textContent = 'يرجى إدخال البريد الإلكتروني وكلمة المرور.';
                    loginError.style.display = 'block';
                }
                return;
            }

            const userByEmail = users.find(u => u.email === email);
            if (!userByEmail) {
                if (loginError) {
                    loginError.textContent = 'هذا البريد الإلكتروني غير مسجَّل في النظام. يرجى إنشاء حساب جديد أولاً.';
                    loginError.style.display = 'block';
                } else {
                    alert('هذا البريد الإلكتروني غير مسجَّل في النظام. يرجى إنشاء حساب جديد أولاً.');
                }
                return;
            }

            if (userByEmail.password !== password) {
                if (loginError) {
                    loginError.textContent = 'كلمة السر أو البريد الإلكتروني غير صحيح.';
                    loginError.style.display = 'block';
                } else {
                    alert('كلمة السر أو البريد الإلكتروني غير صحيح.');
                }
                return;
            }

            const user = userByEmail;
            currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin === true,
                permissions: user.permissions && typeof user.permissions === 'object' ? user.permissions : {}
            };
            try {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
            } catch (e) {}

            if (loginError) loginError.style.display = 'none';
            loginPassword.value = '';

            if (authOverlay) authOverlay.style.display = 'none';

            // بعد تسجيل الدخول الناجح، نحدّث ظهور قسم الإدارة حسب صلاحيات الحساب، ونضمن تفريغ نموذج إضافة المستخدم وتحديث اسم المستخدم في الهيدر
            if (typeof applyAdminVisibility === 'function') {
                applyAdminVisibility();
            }
            if (typeof clearAdminAddUserForm === 'function') {
                clearAdminAddUserForm();
            }
            if (typeof updateCurrentUserDisplay === 'function') {
                updateCurrentUserDisplay();
            }
        });
    }

    // تطبيق حماية الدخول بعد تحميل المستخدمين
    applyAuthGuard();

    // ضمان تفريغ نموذج إضافة مستخدم جديد عند تحميل الصفحة أيضاً
    if (typeof clearAdminAddUserForm === 'function') {
        clearAdminAddUserForm();
    }

    // تحديث الإحصائيات بشكل دوري حتى لو كانت القيم نصوصاً غير رقمية في البداية
    setInterval(function() {
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(value => {
            // استخراج الأرقام فقط من النص الحالي (يتجاهل الكلمات مثل "ليس رقم")
            const digitsOnly = value.textContent.replace(/[^0-9]/g, '');
            let currentValue = digitsOnly ? parseInt(digitsOnly, 10) : 0;

            const newValue = currentValue + Math.floor(Math.random() * 10);
            value.textContent = newValue.toLocaleString('ar-SA');
        });
    }, 5000);
});

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

    // التعامل مع زر الملف الشخصي
    const profileBtn = document.querySelector('.profile-btn');
    profileBtn.addEventListener('click', function() {
        alert('سيتم عرض إعدادات الملف الشخصي هنا');
    });

    // رقم سري لحذف التطبيقات في وضع إدارة التنزيلات (قابل للتغيير) مع تخزينه في localStorage
    const DELETE_PASSWORD_KEY = 'dashboard_delete_password';
    let deletePassword = '1234';

    try {
        const storedPwd = localStorage.getItem(DELETE_PASSWORD_KEY);
        if (storedPwd) {
            deletePassword = storedPwd;
        }
    } catch (e) {
        // إذا حدث خطأ في قراءة localStorage نستخدم القيمة الافتراضية
        deletePassword = '1234';
    }

    // تفعيل وضع إدارة التنزيلات من القائمة الجانبية
    const downloadsNav = document.getElementById('downloadsNav');
    if (downloadsNav) {
        downloadsNav.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('manage-mode');
        });
    }

    // نموذج تغيير الرقم السري لحذف التطبيقات
    const changeDeletePasswordForm = document.getElementById('changeDeletePasswordForm');
    const oldDeletePasswordInput = document.getElementById('oldDeletePassword');
    const newDeletePasswordInput = document.getElementById('newDeletePassword');

    if (changeDeletePasswordForm && oldDeletePasswordInput && newDeletePasswordInput) {
        changeDeletePasswordForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const oldPwd = oldDeletePasswordInput.value;
            const newPwd = newDeletePasswordInput.value;

            if (!oldPwd || !newPwd) {
                alert('يرجى إدخال الرقم السري الحالي والجديد.');
                return;
            }

            if (oldPwd !== deletePassword) {
                alert('الرقم السري الحالي غير صحيح. لم يتم التغيير.');
                return;
            }

            deletePassword = newPwd;
            try {
                localStorage.setItem(DELETE_PASSWORD_KEY, deletePassword);
            } catch (e) {}
            oldDeletePasswordInput.value = '';
            newDeletePasswordInput.value = '';
            alert('تم تحديث الرقم السري لحذف التطبيقات بنجاح.');
        });
    }

    // زر إعادة تعيين الرقم السري في حال نسيانه
    const resetDeletePasswordBtn = document.getElementById('resetDeletePasswordBtn');
    if (resetDeletePasswordBtn) {
        resetDeletePasswordBtn.addEventListener('click', function () {
            const newPwd = prompt('لقد نسيت الرقم السري الحالي.\n\nاكتب كلمة أو أرقام جديدة لتكون الرقم السري الجديد للحذف:');
            if (!newPwd) {
                alert('لم يتم إدخال رقم سري جديد. لم يتم التغيير.');
                return;
            }

            const confirmReset = confirm(`سيتم تعيين الرقم السري الجديد للحذف إلى:\n\n${newPwd}\n\nهل أنت متأكد من المتابعة؟`);
            if (!confirmReset) {
                return;
            }

            deletePassword = newPwd;
            try {
                localStorage.setItem(DELETE_PASSWORD_KEY, deletePassword);
            } catch (e) {}

            alert('تمت إعادة تعيين الرقم السري للحذف بنجاح.');
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

    // دالة لإضافة منطق الحذف مع الرقم السري لبطاقة واحدة
    function attachDeleteHandler(card) {
        const deleteBtn = card.querySelector('.delete-btn');
        if (!deleteBtn) return;

        deleteBtn.addEventListener('click', function () {
            const entered = prompt('أدخل الرقم السري لحذف هذا التطبيق:');
            if (entered !== deletePassword) {
                alert('الرقم السري غير صحيح. لم يتم الحذف.');
                return;
            }

            const confirmDelete = confirm('هل أنت متأكد من حذف هذا التطبيق؟ لا يمكن التراجع.');
            if (!confirmDelete) return;

            const appId = card.dataset.appId;
            if (appId) {
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
    // قائمة مفاتيح البطاقات الثابتة المحذوفة (اسم + رابط)
    let deletedStaticCardKeys = [];

    // مفاتيح التخزين المحلية
    const WEB_APPS_KEY = 'dashboard_web_apps';
    const APK_APPS_KEY = 'dashboard_apk_apps';
    const SOCIAL_APPS_KEY = 'dashboard_social_apps';
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

    // دالة لتحديث عدد التطبيقات في كل قسم
    function updateSectionCounts() {
        const webGrid = document.getElementById('webAppsGrid');
        const apkGrid = document.getElementById('apkAppsGrid');
        const socialGrid = document.getElementById('socialAppsGrid');

        const webCountEl = document.getElementById('webAppsCount');
        const apkCountEl = document.getElementById('apkAppsCount');
        const socialCountEl = document.getElementById('socialAppsCount');

        const webCount = webGrid
            ? Array.from(webGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;
        const apkCount = apkGrid
            ? Array.from(apkGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;
        const socialCount = socialGrid
            ? Array.from(socialGrid.querySelectorAll('.app-card')).filter(card => card.style.display !== 'none').length
            : 0;

        if (webCountEl) webCountEl.textContent = `(${webCount})`;
        if (apkCountEl) apkCountEl.textContent = `(${apkCount})`;
        if (socialCountEl) socialCountEl.textContent = `(${socialCount})`;
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

    // تطبيق تأثير التحويم ومنطق الحذف/التعديل على البطاقات الثابتة الموجودة في HTML فقط
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

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

    // رقم سري لحذف التطبيقات في وضع إدارة التنزيلات (قابل للتغيير)
    let deletePassword = '1234';

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
            oldDeletePasswordInput.value = '';
            newDeletePasswordInput.value = '';
            alert('تم تحديث الرقم السري لحذف التطبيقات بنجاح.');
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
                // بطاقات مضافة ديناميكياً (ويب أو أندرويد)
                const isWeb = card.closest('#webAppsGrid') !== null;
                if (isWeb) {
                    webApps = webApps.filter(app => app.id !== appId);
                    saveWebApps();
                } else {
                    apkApps = apkApps.filter(app => app.id !== appId);
                    saveApkApps();
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

            const currentName = titleEl ? titleEl.textContent.trim() : '';
            const currentDesc = descEl ? descEl.textContent.trim() : '';
            const currentUrl = primaryLink ? primaryLink.getAttribute('href') : '';
            const currentStatusText = statusSpan ? statusSpan.textContent.trim() : 'جاهز';
            const currentStatusClass = statusSpan ? statusSpan.classList[1] || 'stable' : 'stable';

            let currentStatusValue = 'ready';
            if (currentStatusClass === 'review') currentStatusValue = 'review';
            else if (currentStatusClass === 'development') currentStatusValue = 'develop';
            else if (currentStatusClass === 'stopped') currentStatusValue = 'stopped';

            card.classList.add('editing');

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
                        <option value="ready" ${currentStatusValue === 'ready' ? 'selected' : ''}>جاهز</option>
                        <option value="review" ${currentStatusValue === 'review' ? 'selected' : ''}>قيد المراجعة</option>
                        <option value="develop" ${currentStatusValue === 'develop' ? 'selected' : ''}>قيد التطوير</option>
                        <option value="stopped" ${currentStatusValue === 'stopped' ? 'selected' : ''}>متوقف</option>
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

                // إذا كانت البطاقة من التطبيقات المحفوظة، نحدّث بياناتها في webApps أو apkApps
                const appId = card.dataset.appId;
                if (appId) {
                    const isWeb = card.closest('#webAppsGrid') !== null;
                    const list = isWeb ? webApps : apkApps;
                    const index = list.findIndex(app => app.id === appId);
                    if (index !== -1) {
                        list[index].name = newName;
                        list[index].url = newUrl;
                        list[index].desc = newDesc;
                        list[index].statusText = statusText;
                        list[index].statusClass = statusClass;
                        if (isWeb) {
                            saveWebApps();
                        } else {
                            saveApkApps();
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
    // قائمة مفاتيح البطاقات الثابتة المحذوفة (اسم + رابط)
    let deletedStaticCardKeys = [];

    // مفاتيح التخزين المحلية
    const WEB_APPS_KEY = 'dashboard_web_apps';
    const APK_APPS_KEY = 'dashboard_apk_apps';
    const DELETED_STATIC_KEY = 'dashboard_deleted_static_cards';

    function saveWebApps() {
        localStorage.setItem(WEB_APPS_KEY, JSON.stringify(webApps));
    }

    function saveApkApps() {
        localStorage.setItem(APK_APPS_KEY, JSON.stringify(apkApps));
    }

    function saveDeletedStaticCards() {
        localStorage.setItem(DELETED_STATIC_KEY, JSON.stringify(deletedStaticCardKeys));
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
            webAppsGrid.appendChild(card);
            attachCardHover(card);
            attachDeleteHandler(card);
            attachEditHandler(card);
        }
    }

    // تظليل بطاقة موجودة والتمرير إليها
    function highlightExistingCardById(appId, gridSelector) {
        if (!appId) return;
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
            apkAppsGrid.appendChild(card);
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
            const desc = appDescriptionInput ? appDescriptionInput.value.trim() : '';
            const statusValue = appStatusSelect ? appStatusSelect.value : 'ready';

            if (!name || !url) {
                return;
            }

            // منع تكرار نفس الرابط لتطبيقات الويب
            const normalizedUrl = url.trim();
            const existing = webApps.find(app => app.url === normalizedUrl);
            if (existing) {
                alert('هذا الرابط مضاف من قبل لتطبيق ويب. سيتم الانتقال إلى البطاقة الموجودة.');
                highlightExistingCardById(existing.id, '#webAppsGrid');
                return;
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
            const desc = appApkDescriptionInput ? appApkDescriptionInput.value.trim() : '';
            const statusValue = appApkStatusSelect ? appApkStatusSelect.value : 'ready';

            if (!name || !url) {
                return;
            }

            // منع تكرار نفس الرابط لتطبيقات APK
            const normalizedUrl = url.trim();
            const existing = apkApps.find(app => app.url === normalizedUrl);
            if (existing) {
                alert('هذا الرابط مضاف من قبل لتطبيق أندرويد. سيتم الانتقال إلى البطاقة الموجودة.');
                highlightExistingCardById(existing.id, '#apkAppsGrid');
                return;
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

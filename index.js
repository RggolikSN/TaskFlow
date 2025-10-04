// App data
let appData = {
    tasks: [],
    user: {
        name: "Пользователь",
        email: "",
        bio: "",
        points: 0,
        level: 'Новичок',
        carefreeMode: false,
        theme: 'light'
    },
    settings: {
        notifications: true,
        cookiesAccepted: false,
        cookiePreferences: {
            necessary: true,
            preferences: true,
            analytics: false
        },
        workspace: {
            uiDensity: 'normal',
            animations: 'reduced',
            showCompleted: true,
            showOverdue: true,
            groupByCategory: false,
            accentColor: '#007AFF'
        }
    },
    categories: [
        { id: 'all', name: 'Все категории' },
        { id: 'work', name: 'Работа' },
        { id: 'personal', name: 'Личное' },
        { id: 'health', name: 'Здоровье' },
        { id: 'education', name: 'Образование' },
        { id: 'other', name: 'Другое' }
    ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initUI();

    if (!appData.settings.cookiesAccepted) {
        setTimeout(() => {
            document.getElementById('cookie-notice').classList.add('active');
        }, 1000);
    }

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    checkOverdueTasks();
    updateStats();
    renderTasks();
    renderCategories();
});

function loadData() {
    const savedData = localStorage.getItem('taskflow-data');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            appData = { ...appData, ...parsedData };

            if (!appData.tasks) {
                appData.tasks = [];
            }
        } catch (e) {
            console.error('Error loading data:', e);
            localStorage.removeItem('taskflow-data');
        }
    }
}

function saveData() {
    try {
        localStorage.setItem('taskflow-data', JSON.stringify(appData));
        return true;
    } catch (e) {
        console.error('Error saving data:', e);
        showNotification('Ошибка сохранения данных', 'error');
        return false;
    }
}

function initUI() {
    // Tab navigation
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Add task button
    document.getElementById('add-task-btn').addEventListener('click', function() {
        document.getElementById('task-modal').classList.add('active');
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('task-due-date').min = localDateTime;
        document.getElementById('task-due-date').value = localDateTime;
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Task form
    document.getElementById('task-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addTask();
    });

    // Cookies
    document.getElementById('cookie-accept').addEventListener('click', function() {
        acceptAllCookies();
    });

    document.getElementById('cookie-decline').addEventListener('click', function() {
        declineCookies();
    });

    // Clear data button
    document.getElementById('clear-data-btn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
            clearAllData();
        }
    });

    // Theme settings
    document.getElementById('theme-settings-btn').addEventListener('click', function() {
        openThemeSettings();
    });

    // Workspace settings
    document.getElementById('workspace-settings-btn').addEventListener('click', function() {
        document.getElementById('workspace-modal').classList.add('active');
        initWorkspaceSettings();
    });

    // Profile editing
    document.getElementById('edit-profile-btn').addEventListener('click', function() {
        document.getElementById('profile-modal').classList.add('active');
        initProfileSettings();
    });

    // About modal
    document.getElementById('about-btn').addEventListener('click', function() {
        document.getElementById('about-modal').classList.add('active');
        updateAboutStats();
    });

    // Save workspace
    document.getElementById('save-workspace').addEventListener('click', function() {
        saveWorkspaceSettings();
    });

    // Profile form
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfile();
    });

    // Toggles
    document.getElementById('carefree-toggle').addEventListener('change', function() {
        appData.user.carefreeMode = this.checked;
        if (saveData()) {
            showNotification(this.checked ? 'Беззаботный режим включен' : 'Беззаботный режим выключен');
        }
    });

    document.getElementById('notifications-toggle').addEventListener('change', function() {
        appData.settings.notifications = this.checked;
        if (saveData()) {
            if (this.checked && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
            showNotification(this.checked ? 'Уведомления включены' : 'Уведомления выключены');
        }
    });

    // Set current values
    document.getElementById('carefree-toggle').checked = appData.user.carefreeMode;
    document.getElementById('notifications-toggle').checked = appData.settings.notifications;

    // Apply theme and workspace settings
    applyTheme(appData.user.theme);
    applyWorkspaceSettings();

    // Update UI with loaded data
    updateUI();
}

function acceptAllCookies() {
    appData.settings.cookiesAccepted = true;
    appData.settings.cookiePreferences = {
        necessary: true,
        preferences: true,
        analytics: true
    };

    if (saveData()) {
        document.getElementById('cookie-notice').classList.remove('active');
        showNotification('Все cookie приняты');
    }
}

function declineCookies() {
    appData.settings.cookiesAccepted = true;
    appData.settings.cookiePreferences = {
        necessary: true,
        preferences: false,
        analytics: false
    };

    if (saveData()) {
        document.getElementById('cookie-notice').classList.remove('active');
        showNotification('Приняты только необходимые cookie');
    }
}

function updateUI() {
    document.getElementById('profile-name').textContent = appData.user.name;
    document.getElementById('user-level').textContent = appData.user.level;
    document.getElementById('user-points').textContent = appData.user.points;
    updateUserLevel();
}

function initProfileSettings() {
    document.getElementById('profile-name-input').value = appData.user.name;
    document.getElementById('profile-email').value = appData.user.email || '';
    document.getElementById('profile-bio').value = appData.user.bio || '';
}

function saveProfile() {
    appData.user.name = document.getElementById('profile-name-input').value;
    appData.user.email = document.getElementById('profile-email').value;
    appData.user.bio = document.getElementById('profile-bio').value;

    if (saveData()) {
        document.getElementById('profile-name').textContent = appData.user.name;
        document.getElementById('profile-modal').classList.remove('active');
        showNotification('Профиль успешно обновлен');
    }
}

function initWorkspaceSettings() {
    const workspace = appData.settings.workspace;

    // Set current values
    document.getElementById('ui-density').value = workspace.uiDensity;
    document.getElementById('animations').value = workspace.animations;
    document.getElementById('show-completed').checked = workspace.showCompleted;
    document.getElementById('show-overdue').checked = workspace.showOverdue;
    document.getElementById('group-by-category').checked = workspace.groupByCategory;

    // Set accent color
    document.querySelectorAll('.accent-color').forEach(color => {
        color.classList.remove('active');
        if (color.getAttribute('data-color') === workspace.accentColor) {
            color.classList.add('active');
        }

        color.addEventListener('click', function() {
            document.querySelectorAll('.accent-color').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function saveWorkspaceSettings() {
    const workspace = appData.settings.workspace;

    workspace.uiDensity = document.getElementById('ui-density').value;
    workspace.animations = document.getElementById('animations').value;
    workspace.showCompleted = document.getElementById('show-completed').checked;
    workspace.showOverdue = document.getElementById('show-overdue').checked;
    workspace.groupByCategory = document.getElementById('group-by-category').checked;

    const activeColor = document.querySelector('.accent-color.active');
    if (activeColor) {
        workspace.accentColor = activeColor.getAttribute('data-color');
    }

    if (saveData()) {
        applyWorkspaceSettings();
        document.getElementById('workspace-modal').classList.remove('active');
        showNotification('Настройки рабочего пространства сохранены');

        // Перерендерим задачи для применения новых настроек
        renderTasks();
    }
}

function applyWorkspaceSettings() {
    const workspace = appData.settings.workspace;

    // Apply UI density
    document.body.classList.remove('ui-compact', 'ui-normal', 'ui-comfortable');
    document.body.classList.add(`ui-${workspace.uiDensity}`);

    // Apply animations
    document.body.classList.remove('no-animations', 'reduced-animations');
    if (workspace.animations === 'none') {
        document.body.classList.add('no-animations');
    } else if (workspace.animations === 'reduced') {
        document.body.classList.add('reduced-animations');
    }

    // Apply accent color
    if (workspace.accentColor) {
        document.documentElement.style.setProperty('--primary-color', workspace.accentColor);
    }
}

function updateAboutStats() {
    const totalTasks = appData.tasks.length;
    const completedTasks = appData.tasks.filter(task => task.completed).length;
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-stats').textContent = completedTasks;
    document.getElementById('productivity').textContent = `${productivity}%`;
}

function renderCategories() {
    const categoryTags = document.getElementById('category-tags');
    if (!categoryTags) return;

    categoryTags.innerHTML = '';

    appData.categories.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'category-tag';
        if (category.id === 'all') {
            tag.classList.add('active');
        }
        tag.setAttribute('data-category', category.id);
        tag.textContent = category.name;

        tag.addEventListener('click', function() {
            document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });

        categoryTags.appendChild(tag);
    });
}

// Add task function
function addTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const category = document.getElementById('task-category').value;
    const dueDate = document.getElementById('task-due-date').value;
    const repeat = document.getElementById('task-repeat').value;
    const points = parseInt(document.getElementById('task-points').value) || 10;

    // Validation
    if (!title.trim()) {
        showNotification('Введите название задачи', 'error');
        return;
    }

    if (!dueDate) {
        showNotification('Выберите срок выполнения', 'error');
        return;
    }

    // Create task
    const newTask = {
        id: Date.now() + Math.random(),
        title: title.trim(),
        description: description.trim(),
        category: category,
        dueDate: new Date(dueDate).getTime(),
        repeat: repeat,
        points: points,
        completed: false,
        overdue: false,
        createdAt: Date.now()
    };

    appData.tasks.push(newTask);
    if (saveData()) {
        renderTasks();
        updateStats();

        // Close modal and reset form
        document.getElementById('task-modal').classList.remove('active');
        document.getElementById('task-form').reset();

        showNotification('Задача успешно добавлена!');
        scheduleReminder(newTask);
    }
}

function completeTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
        task.completed = true;

        if (!appData.user.carefreeMode) {
            appData.user.points += task.points;
            updateUserLevel();
        }

        if (task.repeat !== 'none') {
            createNextTask(task);
        }

        if (saveData()) {
            renderTasks();
            updateStats();
            showNotification(`Задача выполнена! +${task.points} баллов`);
        }
    }
}

function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
        return;
    }

    appData.tasks = appData.tasks.filter(t => t.id !== taskId);
    if (saveData()) {
        renderTasks();
        updateStats();
        showNotification('Задача удалена');
    }
}

function createNextTask(task) {
    let nextDueDate = new Date(task.dueDate);

    switch (task.repeat) {
        case 'daily':
            nextDueDate.setDate(nextDueDate.getDate() + 1);
            break;
        case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
        case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            break;
    }

    const newTask = {
        ...task,
        id: Date.now() + Math.random(),
        dueDate: nextDueDate.getTime(),
        completed: false,
        overdue: false,
        createdAt: Date.now()
    };

    appData.tasks.push(newTask);
    saveData();
    scheduleReminder(newTask);
}

function checkOverdueTasks() {
    const now = Date.now();
    let hasChanges = false;

    appData.tasks.forEach(task => {
        if (!task.completed && task.dueDate < now && !task.overdue) {
            task.overdue = true;
            hasChanges = true;

            if (!appData.user.carefreeMode) {
                const penalty = Math.floor(task.points / 2);
                appData.user.points = Math.max(0, appData.user.points - penalty);
                updateUserLevel();

                if (penalty > 0) {
                    showNotification(`Задача просрочена! -${penalty} баллов`, 'warning');
                }
            }
        }
    });

    if (hasChanges) {
        saveData();
        renderTasks();
        updateStats();
    }
}

function updateUserLevel() {
    const points = appData.user.points;
    let progress = 0;

    if (points < 100) {
        appData.user.level = 'Новичок';
        progress = (points / 100) * 100;
    } else if (points < 500) {
        appData.user.level = 'Любитель';
        progress = ((points - 100) / 400) * 100;
    } else if (points < 1000) {
        appData.user.level = 'Опытный';
        progress = ((points - 500) / 500) * 100;
    } else if (points < 2000) {
        appData.user.level = 'Эксперт';
        progress = ((points - 1000) / 1000) * 100;
    } else {
        appData.user.level = 'Мастер';
        progress = 100;
    }

    const progressElement = document.getElementById('level-progress');
    if (progressElement) {
        progressElement.style.width = `${progress}%`;
    }

    const levelElement = document.getElementById('user-level');
    const pointsElement = document.getElementById('user-points');

    if (levelElement) levelElement.textContent = appData.user.level;
    if (pointsElement) pointsElement.textContent = appData.user.points;
}

function scheduleReminder(task) {
    if (!appData.settings.notifications) return;

    const reminderTime = task.dueDate - (60 * 60 * 1000); // 1 hour before
    const now = Date.now();

    if (reminderTime > now && 'Notification' in window && Notification.permission === 'granted') {
        setTimeout(() => {
            if (!task.completed) {
                new Notification('TaskFlow', {
                    body: `Остался 1 час до выполнения задачи: "${task.title}"`,
                    icon: '/favicon.ico'
                });
            }
        }, reminderTime - now);
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    const activeCategory = document.querySelector('.category-tag.active');
    if (!activeCategory) return;

    const category = activeCategory.getAttribute('data-category');

    let filteredTasks = appData.tasks;
    if (category !== 'all') {
        filteredTasks = appData.tasks.filter(task => task.category === category);
    }

    // Apply workspace filters
    const workspace = appData.settings.workspace;
    if (!workspace.showCompleted) {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Нет задач</h3>
                <p>Добавьте свою первую задачу, нажав кнопку "Добавить"</p>
            </div>
        `;
        return;
    }

    // Group tasks by category if enabled
    if (workspace.groupByCategory && category === 'all') {
        renderGroupedTasks(filteredTasks);
    } else {
        renderUngroupedTasks(filteredTasks);
    }
}

function renderGroupedTasks(tasks) {
    const taskList = document.getElementById('task-list');
    const categories = appData.categories.filter(cat => cat.id !== 'all');

    categories.forEach(category => {
        const categoryTasks = tasks.filter(task => task.category === category.id);
        if (categoryTasks.length === 0) return;

        const groupElement = document.createElement('div');
        groupElement.className = 'task-group';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'task-group-header';
        groupHeader.textContent = category.name;

        groupElement.appendChild(groupHeader);

        const sortedTasks = [...categoryTasks].sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return a.dueDate - b.dueDate;
        });

        sortedTasks.forEach((task, index) => {
            const taskElement = createTaskElement(task, index);
            groupElement.appendChild(taskElement);
        });

        taskList.appendChild(groupElement);
    });
}

function renderUngroupedTasks(tasks) {
    const taskList = document.getElementById('task-list');

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        return a.dueDate - b.dueDate;
    });

    sortedTasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task, index) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card ${task.completed ? 'completed' : ''} ${task.overdue ? 'overdue' : ''}`;

    // Apply animation delay only if animations are enabled
    const workspace = appData.settings.workspace;
    if (workspace.animations !== 'none') {
        taskElement.style.animationDelay = `${index * 0.1}s`;
    }

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const timeDiff = dueDate - now;
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));

    let timeText = '';
    if (task.completed) {
        timeText = 'Выполнено';
    } else if (task.overdue) {
        timeText = 'Просрочено';
    } else if (hoursLeft < 24) {
        timeText = `Осталось: ${hoursLeft} ч`;
    } else {
        timeText = dueDate.toLocaleDateString('ru-RU');
    }

    taskElement.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-points">+${task.points}</div>
        </div>
        <div class="task-description">${escapeHtml(task.description || 'Нет описания')}</div>
        <div class="task-meta">
            <div>${timeText}</div>
            <div class="task-actions">
                ${!task.completed ? `<button onclick="completeTask(${task.id})"><i class="fas fa-check"></i></button>` : ''}
                <button onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;

    return taskElement;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateStats() {
    const completed = appData.tasks.filter(t => t.completed).length;
    const overdue = appData.tasks.filter(t => t.overdue && !t.completed).length;
    const pending = appData.tasks.filter(t => !t.completed && !t.overdue).length;

    const completedElement = document.getElementById('tasks-completed');
    const overdueElement = document.getElementById('tasks-overdue');
    const pendingElement = document.getElementById('tasks-pending');
    const streakElement = document.getElementById('streak-days');

    if (completedElement) completedElement.textContent = completed;
    if (overdueElement) overdueElement.textContent = overdue;
    if (pendingElement) pendingElement.textContent = pending;

    // Simple streak calculation
    if (streakElement) {
        const today = new Date().toDateString();
        const lastCompletion = localStorage.getItem('lastCompletion');

        if (lastCompletion === today) {
            streakElement.textContent = parseInt(localStorage.getItem('streakDays') || '0');
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastCompletion === yesterday.toDateString()) {
                const newStreak = parseInt(localStorage.getItem('streakDays') || '0') + 1;
                localStorage.setItem('streakDays', newStreak.toString());
                streakElement.textContent = newStreak;
            } else {
                localStorage.setItem('streakDays', '1');
                streakElement.textContent = 1;
            }
            localStorage.setItem('lastCompletion', today);
        }
    }

    updateUserLevel();
}

function openThemeSettings() {
    const themeOptions = document.getElementById('theme-options');
    if (!themeOptions) return;

    themeOptions.innerHTML = '';

    const themes = [
        { name: 'light', color: '#F2F2F7', text: 'Светлая' },
        { name: 'dark', color: '#000000', text: 'Тёмная' },
        { name: 'blue', color: '#E6F2FF', text: 'Синяя' },
        { name: 'green', color: '#E6F7EA', text: 'Зелёная' },
        { name: 'orange', color: '#FFF4E6', text: 'Оранжевая' },
        { name: 'purple', color: '#F3E6F9', text: 'Фиолетовая' },
        { name: 'midnight', color: '#0A0A0A', text: 'Полночь' },
        { name: 'sunset', color: '#FFF0F0', text: 'Закат' },
        { name: 'forest', color: '#F0F8F0', text: 'Лес' },
        { name: 'ocean', color: '#F0F9FF', text: 'Океан' },
        { name: 'violet', color: '#F8F0FF', text: 'Фиалка' },
        { name: 'gold', color: '#FFFBE6', text: 'Золото' },
        { name: 'slate', color: '#F2F2F7', text: 'Сланец' },
        { name: 'crimson', color: '#FFF0EF', text: 'Малиновый' }
    ];

    themes.forEach((theme, index) => {
        const themeOption = document.createElement('div');
        themeOption.className = `theme-option ${appData.user.theme === theme.name ? 'active' : ''}`;
        themeOption.style.backgroundColor = theme.color;
        themeOption.setAttribute('data-theme', theme.name);
        themeOption.setAttribute('title', theme.text);
        themeOption.style.animationDelay = `${index * 0.05}s`;
        themeOption.textContent = theme.text;

        themeOption.addEventListener('click', function() {
            applyTheme(theme.name);
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            showNotification(`Тема "${theme.text}" применена`);
        });

        themeOptions.appendChild(themeOption);
    });

    document.getElementById('theme-modal').classList.add('active');
}

function applyTheme(themeName) {
    appData.user.theme = themeName;
    saveData();
    document.documentElement.setAttribute('data-theme', themeName);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

function clearAllData() {
    localStorage.removeItem('taskflow-data');
    appData = {
        tasks: [],
        user: {
            name: "Пользователь",
            email: "",
            bio: "",
            points: 0,
            level: 'Новичок',
            carefreeMode: false,
            theme: 'light'
        },
        settings: {
            notifications: true,
            cookiesAccepted: false,
            cookiePreferences: {
                necessary: true,
                preferences: true,
                analytics: false
            },
            workspace: {
                uiDensity: 'normal',
                animations: 'reduced',
                showCompleted: true,
                showOverdue: true,
                groupByCategory: false,
                accentColor: '#007AFF'
            }
        },
        categories: [
            { id: 'all', name: 'Все категории' },
            { id: 'work', name: 'Работа' },
            { id: 'personal', name: 'Личное' },
            { id: 'health', name: 'Здоровье' },
            { id: 'education', name: 'Образование' },
            { id: 'other', name: 'Другое' }
        ]
    };

    // Reset UI toggles
    document.getElementById('carefree-toggle').checked = false;
    document.getElementById('notifications-toggle').checked = true;

    // Update UI
    updateUI();
    renderTasks();
    renderCategories();

    showNotification('Все данные очищены');
}

// Make functions available globally
window.completeTask = completeTask;
window.deleteTask = deleteTask;
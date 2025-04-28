const socket = io();

document.addEventListener("DOMContentLoaded", function () {
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const newChatBtn = document.getElementById("new-chat");
    const chatList = document.getElementById("chat-list");
    const toggleOptionsBtn = document.getElementById("toggle-options");
    const extendedOptions = document.getElementById("extended-options");
    const dropdown1 = document.getElementById("dropdown1");
    const customOptions = document.getElementById("custom-options");
    const toggleSidebarBtn = document.getElementById("toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");
    const chatArea = document.querySelector(".chat-area");
    const profileBtn = document.getElementById("profile-btn");
    const profileInfo = document.getElementById("profile-info");
    const logoutBtn = document.getElementById("logout-btn");
    const welcomeScreen = document.getElementById("welcome-screen");
    const modelSelect = document.getElementById("modelSelect");
    const typeSelect = document.getElementById("typeSelect");
    const scrollToBottomBtn = document.getElementById("scroll-to-bottom");

    function getUserChats() {
        const userData = JSON.parse(localStorage.getItem("userData"));
        if (!userData) return {};
        
        const allChats = JSON.parse(localStorage.getItem("chats")) || {};
        return allChats[userData.login] || {};
    }
    
    function saveUserChats(chats) {
        const userData = JSON.parse(localStorage.getItem("userData"));
        if (!userData) return;
        const allChats = JSON.parse(localStorage.getItem("chats")) || {};
        allChats[userData.login] = chats;
        localStorage.setItem("chats", JSON.stringify(allChats));
    }
    
    let chats = getUserChats();
    let currentChatId = null;

    // Загрузка списка чатов
    function loadChats() {
        chatList.innerHTML = "";
        const userData = JSON.parse(localStorage.getItem("userData"));
        
        if (!userData) {
            // Если пользователь не авторизован, не показываем чаты
            return;
        }
        
        for (const id in chats) {
            addChatToSidebar(id, chats[id].name);
        }
    }

    // Добавление чата в боковую панель
    function addChatToSidebar(id, name) {
        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");

        const chatName = document.createElement("span");
        chatName.textContent = name;
        chatItem.appendChild(chatName);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-chat");
        deleteButton.textContent = "×";
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteChat(id);
        });

        chatItem.appendChild(deleteButton);
        chatItem.addEventListener("click", () => switchChat(id));
        chatList.appendChild(chatItem);
    }

    // Переключение на другой чат
    function switchChat(id) {
        currentChatId = id;
        chatMessages.innerHTML = "";
        if (chats[id].messages.length === 0) {
            welcomeScreen.classList.remove("hidden");
        } else {
            welcomeScreen.classList.add("hidden");
            chats[id].messages.forEach((msg) => {
                addMessageToChat(msg.text, msg.isUser);
            });
        }
        scrollToBottom();
    }

    // Удаление чата
    function deleteChat(id) {
            delete chats[id];
            saveUserChats(chats);
            loadChats();
            if (currentChatId === id) {
                currentChatId = null;
                chatMessages.innerHTML = "";
                welcomeScreen.classList.remove("hidden");
            }
            showNotification('green', 'Чат успешно удалён!', 5000);
    }

    // Создание нового чата
    function createNewChat() {
        const userData = JSON.parse(localStorage.getItem("userData"));
        if (!userData) {
            showNotification('red', 'Для создания чата необходимо авторизоваться', 3000);
            return null;
        }
        
        const newChatId = Date.now().toString();
        const newChatName = "Новый чат";
        chats[newChatId] = { name: newChatName, messages: [] };
        saveUserChats(chats);
        addChatToSidebar(newChatId, newChatName);
        switchChat(newChatId);
        return newChatId;
    }

    // Обновление названия чата
    function updateChatName(chatId, newName) {
        chats[chatId].name = newName;
        saveUserChats(chats);
        loadChats(); // Перезагружаем список чатов
    }

    // Добавление сообщения в чат
    function addMessageToChat(message, isUser) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.classList.add(isUser ? "user-message" : "bot-message");
        messageDiv.innerHTML = isUser ? `Вы: ${removeWhitespaceOnlyLines(message)}` : `Бот: ${message}`;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function removeWhitespaceOnlyLines(text) {
        // Разделяем текст на строки, фильтруем строки, состоящие только из пробелов, и объединяем обратно
        return text
            .split('\n') // Разделяем текст на массив строк
            .filter(line => line.trim().length > 0) // Удаляем строки, состоящие только из пробелов
            .join('\n'); // Объединяем строки обратно в текст
    }
    

    // Отправка сообщения
    function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage === "") return;
        // Проверка выбора профиля в пользовательском режиме
        if (modelSelect.value === "custom") {
            const selectedProfile = typeSelect.value;
            if (!selectedProfile || selectedProfile === "---") {
                showNotification('red', 'Пожалуйста, выберите профиль перед отправкой', 5000);
                return;
            }
        }
        // Если чат не выбран, создаем новый
        if (!currentChatId) {
            currentChatId = createNewChat();
        }
        // Если это первое сообщение в чате, обновляем название чата
        if (chats[currentChatId].messages.length === 0) {
            updateChatName(currentChatId, userMessage);
            welcomeScreen.classList.add("hidden");
        }
        // Добавляем сообщение пользователя в чат
        addMessageToChat(userMessage, true);
        chats[currentChatId].messages.push({ text: userMessage, isUser: true });
        // Сохраняем все сообщения в локальное хранилище
        saveUserChats(chats);
        // Формируем историю чата для отправки на сервер
        let chatHistory = chats[currentChatId].messages
            .slice(-10)
            .map(msg => `${msg.isUser ? "Вы" : "Бот"}: ${msg.text}`)
            .join("\n");
        // Отправляем сообщение на сервер
        let nastr = modelSelect.value;
        let nastr1 = typeSelect.value;
        let baz = userMessage; // Используем уже очищенное сообщение
        socket.emit('sendnastr', nastr, nastr1);
        socket.emit('sendRes', chatHistory, baz);
        // Очищаем поле ввода
        chatInput.value = '';
        showLoadingAnimation();
    }

    // Обработка ответа от сервера
    socket.on('chat reply', (answer) => {
        hideLoadingAnimation();
        // Удаляем анимацию "Бот печатает..." и добавляем ответ бота
        const loadingMessage = chatMessages.querySelector('.loading');
        if (loadingMessage) {
            loadingMessage.remove();
        }
        addMessageToChat(answer, false);
        chats[currentChatId].messages.push({ text: answer, isUser: false });
        saveUserChats(chats);
    });

    // Обработка ошибок
    socket.on('error', (error) => {
        if (error.message.includes('Request failed with status code 414')) {
            showErrorMessage();
        }
    });

    // Показать анимацию загрузки
    function showLoadingAnimation() {
        const loadingMessage = document.createElement("div");
        loadingMessage.classList.add("message", "bot-message", "loading");
        loadingMessage.innerHTML = `
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatMessages.appendChild(loadingMessage);
        scrollToBottom();
    }

    // Скрыть анимацию загрузки
    function hideLoadingAnimation() {
        const loadingMessage = chatMessages.querySelector('.loading');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    // Показать сообщение об ошибке
    function showErrorMessage() {
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("message", "bot-message");
        errorMessage.textContent = "Ошибка! Допущено максимальное количество токенов. Создайте новый чат!";
        chatMessages.appendChild(errorMessage);
        scrollToBottom();
    }

    // Прокрутка вниз
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        updateScrollButton();
    }

    // Обновление видимости кнопки "Вниз"
    function updateScrollButton() {
        if (chatMessages.scrollTop + chatMessages.clientHeight < chatMessages.scrollHeight - 50) {
            scrollToBottomBtn.style.display = "flex";
        } else {
            scrollToBottomBtn.style.display = "none";
        }
    }

    // Обработчики событий
    sendBtn.addEventListener("click", function () {
        sendMessage();
    });

    chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // Предотвращаем перенос строки
            sendMessage();
        }
    });

    // Создание нового чата по кнопке
    newChatBtn.addEventListener("click", function () {
        createNewChat();
    });

    // Управление видимостью боковой панели
    toggleSidebarBtn.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
        chatArea.classList.toggle("expanded");
    });

    // Управление видимостью выдвигающегося поля
    toggleOptionsBtn.addEventListener("click", function () {
        extendedOptions.classList.toggle("hidden");
        updateScrollButtonPosition();
    });

    // Управление видимостью второго выпадающего списка и кнопок


    // Управление видимостью профиля
    profileBtn.addEventListener("click", function () {
        profileInfo.classList.toggle("hidden");
    });


    // Прокрутка вниз по кнопке
    scrollToBottomBtn.addEventListener("click", function () {
        scrollToBottom();
    });

    // Обновление видимости кнопки "Вниз" при прокрутке
    chatMessages.addEventListener("scroll", function () {
        updateScrollButton();
    });

    // Обновление позиции кнопки "Вниз" при открытии/закрытии дополнительной панели
    function updateScrollButtonPosition() {
        if (extendedOptions.classList.contains("hidden")) {
            scrollToBottomBtn.style.bottom = "110px"; // Обычное положение
        } else {
            scrollToBottomBtn.style.bottom = "160px"; // Поднимаем выше, если панель открыта
        }
    }

    const notificationStack = [];
    const baseBottom = 20;
    const spacing = 10;
    
    function showNotification(type, message, duration = 3000) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        // Рассчитываем позицию для нового уведомления
        const bottomPosition = baseBottom + 
            (notificationStack.length * (notification.offsetHeight + spacing));
        // Создаем содержимое уведомления
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        // Создаем прогресс-бар
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        // Добавляем элементы в уведомление
        notification.appendChild(content);
        notification.appendChild(progressBar);
        // Добавляем уведомление на страницу
        document.body.appendChild(notification);
        // Устанавливаем начальную позицию
        notification.style.bottom = `${bottomPosition}px`;
        // Добавляем в стек уведомлений
        notificationStack.push(notification);
        // Запускаем анимацию прогресс-бара
        progressBar.style.transitionDuration = `${duration}ms`;
        setTimeout(() => {
            progressBar.style.transform = 'scaleX(0)';
        }, 10);
        
        // Функция для закрытия уведомления
        function closeNotification() {
            notification.classList.add('hide');
            
            setTimeout(() => {
                // Удаляем уведомление из DOM
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                
                // Удаляем из стека
                const index = notificationStack.indexOf(notification);
                if (index !== -1) {
                    notificationStack.splice(index, 1);
                }
                
                // Обновляем позиции оставшихся уведомлений
                updateNotificationsPosition();
            }, 300);
        }
        
        // Функция обновления позиций уведомлений
        function updateNotificationsPosition() {
            notificationStack.forEach((notif, i) => {
                const newBottom = baseBottom + (i * (notif.offsetHeight + spacing));
                notif.style.bottom = `${newBottom}px`;
            });
        }
        
        // Закрываем уведомление по таймеру
        setTimeout(closeNotification, duration);
        
        // Закрываем уведомление при клике
        notification.addEventListener('click', closeNotification);
    }

    const addProfileModal = document.getElementById("add-profile-modal");
    const editProfileModal = document.getElementById("edit-profile-modal");
    const clearChatModal = document.getElementById("clear-chat-modal");
    const addProfileBtn = document.getElementById("add-profile-btn");
    const editProfileBtn = document.getElementById("edit-profile-btn");
    const saveProfileBtn = document.getElementById("save-profile-btn");
    const saveEditProfileBtn = document.getElementById("save-edit-profile-btn");
    const deleteProfileBtn = document.getElementById("delete-profile-btn");

    // Обработчики модальных окон
    addProfileBtn.addEventListener("click", () => {
        addProfileModal.style.display = "block";
    });

    editProfileBtn.addEventListener("click", () => {
        const selectedProfile = typeSelect.value;
        if (selectedProfile) {
            socket.emit("remk", selectedProfile);
            editProfileModal.style.display = "block";
        } else {
            showNotification('red', 'Выберите профиль для редактирования!', 3000);
        }
    });


    saveProfileBtn.addEventListener("click", () => {
        const name = document.getElementById("profileName").value.trim();
        const info = document.getElementById("profileInfo").value.trim();
        const user = document.getElementById("userName").value.trim();
        const owner = document.getElementById("usernameDisplay").textContent;
        
        if (name && info && user) {
            socket.emit("dobav", name, info, user, owner);
            addProfileModal.style.display = "none";
        } else {
            showNotification('red', 'Все поля должны быть заполнены!', 3000);
        }
    });

    saveEditProfileBtn.addEventListener("click", () => {
        const newName = document.getElementById("profileName1").value.trim();
        const newUser = document.getElementById("userName1").value.trim();
        const newInfo = document.getElementById("profileInfo1").value.trim();
        const selectedProfile = typeSelect.value;
         
        if (newName && newUser && newInfo && selectedProfile) {
            socket.emit("zamen", newName, newUser, newInfo, selectedProfile);
            editProfileModal.style.display = "none";
            showNotification('green', 'Профиль успешно изменён!', 3000);
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification('red', 'Все поля должны быть заполнены!', 3000);
        }
    });

    deleteProfileBtn.addEventListener("click", () => {
        
        const selectedProfile = typeSelect.value;
        if (!selectedProfile || selectedProfile === "---") {
            showNotification('red', 'Выберите профиль для удаления!', 3000);
            return;
        }
        
        document.getElementById('profile-to-delete').textContent = selectedProfile;
        document.getElementById('edit-profile-modal').style.display = 'none';
        document.getElementById('confirm-delete-modal').style.display = 'block';
    });
    
    // Обработчик подтверждения удаления
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        const selectedProfile = typeSelect.value;
        const owner = document.getElementById("usernameDisplay").textContent;
        
        socket.emit("udalit", selectedProfile, owner);
        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        typeSelect.removeChild(selectedOption);
        // Закрываем модальное окно подтверждения
        document.getElementById('confirm-delete-modal').style.display = 'none';
        
        // Показываем уведомление об успешном удалении
        showNotification('green', `Профиль "${selectedProfile}" успешно удалён!`, 3000);
        
        // Обновляем список профилей
        updateProfilesList();
    });
    
    // Функция для обновления списка профилей
    function updateProfilesList() {
        const currentUser = document.getElementById('usernameDisplay').textContent;
        socket.emit('zagruz', currentUser);
        
        socket.once('malData', data => {
            const filteredData = data.filter(item => item.owner === currentUser);
            typeSelect.innerHTML = '';
            
            if (filteredData.length === 0) {
                const option = document.createElement('option');
                option.textContent = '---';
                option.value = '';
                typeSelect.appendChild(option);
                document.getElementById('custom-options').classList.add('hidden');
            } else {
                filteredData.forEach(item => {
                    const option = document.createElement('option');
                    option.textContent = item.name;
                    option.value = item.name;
                    typeSelect.appendChild(option);
                });
            }
        });
    }
    
    // Обработчик отмены удаления
    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        document.getElementById('confirm-delete-modal').style.display = 'none';
        document.getElementById('edit-profile-modal').style.display = 'block';
    });
    
    // Обработчик отмены очистки чата
    document.getElementById('cancel-clear-chat-btn').addEventListener('click', () => {
        document.getElementById('clear-chat-modal').style.display = 'none';
    });
    
    // Закрытие модальных окон по клику вне области
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Закрытие модальных окон по крестику
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Улучшенное закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Инициализация подсказок
    document.querySelectorAll('.tooltip-icon').forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${rect.right + 5}px`;
            tooltip.style.top = `${rect.top}px`;
            
            this._tooltip = tooltip;
        });
        
        icon.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                delete this._tooltip;
            }
        });
    });


    // Закрытие модальных окон при клике вне их области
    window.addEventListener("click", (event) => {
        if (event.target === addProfileModal) {
            addProfileModal.style.display = "none";
        }
        if (event.target === editProfileModal) {
            editProfileModal.style.display = "none";
        }
        if (event.target === clearChatModal) {
            clearChatModal.style.display = "none";
        }
    });

    // Обработчики событий от сервера
    socket.on("ntry", () => {
        showNotification('red', 'Недостаточно количество созданий, удалите профиль и попробуйте еще раз!', 5000);
    });

    socket.on("ytry", () => {
        showNotification('green', 'Профиль успешно сохранён!', 5000);
    });

    socket.on("remk1", (lam, lam1, lam2) => {
        document.getElementById("profileName1").value = lam;
        document.getElementById("userName1").value = lam1;
        document.getElementById("profileInfo1").value = lam2;
    });

    socket.on("вывод", (kolv) => {
        document.getElementById("akkDisplay").textContent = kolv;
    });

    socket.on('malData', data => {
        const currentUser = document.getElementById('usernameDisplay').textContent;
        const typeSelect = document.getElementById('typeSelect');
        typeSelect.innerHTML = '';

        const filteredData = data.filter(item => item.owner === currentUser);
        filteredData.forEach(item => {
            const option = document.createElement('option');
            option.textContent = item.name;
            option.value = item.name;
            typeSelect.appendChild(option);
        });
    });

    // Загрузка данных пользователя
    function loadUserData() {
        let userData = JSON.parse(localStorage.getItem("userData"));
        if (userData) {
            document.getElementById("usernameDisplay").textContent = userData.login;
            socket.emit('zagruz', userData.login);
            
            // Загружаем чаты для текущего пользователя
            chats = getUserChats();
            loadChats();
        }
    }
    
    // Обработчик успешного добавления профиля
    socket.on('ytry', function() {
        document.getElementById('add-profile-modal').style.display = 'none';
        
        // Обновляем данные пользователя
        const currentUser = document.getElementById('usernameDisplay').textContent;
        socket.emit('zagruz', currentUser);
    });
    
    // Обработчик успешного удаления профиля
    socket.on('вывод', function(kolv) {
        document.getElementById('akkDisplay').textContent = kolv;
        
        // Обновляем в localStorage
        let userData = JSON.parse(localStorage.getItem("userData"));
        if (userData) {
            userData.akk = kolv;
            localStorage.setItem("userData", JSON.stringify(userData));
        }
    });
    
    // Обработчик получения данных пользователя
    socket.on('zagruzk', function(kolv) {
        document.getElementById('akkDisplay').textContent = kolv;
        
        // Обновляем в localStorage
        let userData = JSON.parse(localStorage.getItem("userData"));
        if (userData) {
            userData.akk = kolv;
            localStorage.setItem("userData", JSON.stringify(userData));
        }
    });
    
    // При инициализации
    document.addEventListener('DOMContentLoaded', function() {
        loadUserData();
    })

    // Выход из профиля
    logoutBtn.addEventListener("click", () => {
        // Очищаем текущие чаты в памяти
        chats = {};
        currentChatId = null;
        
        showNotification('green', 'Вы успешно вышли из профиля!', 1000);
        setTimeout(() => {
            document.location.href = "/aunt";
        }, 1000);
    });

    // Инициализация
    loadUserData();
    loadChats();
    
    // Показать/скрыть пользовательские опции при выборе модели
    modelSelect.addEventListener("change", function() {
        if (this.value === "custom") {
            customOptions.classList.remove("hidden");
        } else {
            customOptions.classList.add("hidden");
            if (currentChatId) {
            }
        }
    });
    document.querySelectorAll('.tooltip-wrapper select').forEach(select => {
        select.addEventListener('blur', function() {
            if (this.parentElement.matches(':hover')) {
                this.nextElementSibling.style.opacity = '1';
                this.nextElementSibling.style.visibility = 'visible';
            }
        });
    });
    // Загрузка чатов при запуске
    loadChats();
});
//Основные библиотеки
let express = require("express")
let server = express()
let http = require("http").createServer(server).listen(1920)
//Дополнительные библиотеки
let io = require("socket.io")(http)
let fs = require("fs-extra")
const qs = require('qs');
const axios = require('axios');
//Подключение статических папок
server.use(express.static(__dirname + "/js"))
server.use(express.static(__dirname + "/css"))
server.use("/img", express.static(__dirname + "/img"))
//Подключение главной html страницы
server.get("/", function (request, response) {
    response.sendFile(__dirname + "/start.html")
})
server.get("/chat", function (request, response) {
    response.sendFile(__dirname + "/index.html")
})
server.get("/reg", function (request, response) {
    response.sendFile(__dirname + "/reg.html")
})
server.get("/aunt", function (request, response) {
    response.sendFile(__dirname + "/aut.html")
})
//Родительский сокет
let rules
io.sockets.on("connection", function (socket) {
    console.log('A user connected');
    socket.on("sendnastr", (nastr, nastr1) => {
        console.log(nastr);
        if (nastr == "custom") {
            let database2 = fs.readJSONSync("mal.json")
            for (let i = 0; i < database2.length; i++) {
                if (nastr1 == database2[i].name) {
                    let nas1 = database2[i].user;
                    let nas2 = database2[i].info;
                    rules = {
                        "r1": "1. Твоя роль:" + nas2 + ";",
                        "r2": "2. Выдавай ответ исходя из твоей роли, вживись в роль, относись к пользователю исходя из своей роли, НИКОГДА НЕ ПИШИ МНЕ  - Бот: или Боты: ;",
                        "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее ;",
                        "r4": "4. Имя пользователя - " + nas1 + ", обращайся к нему по имени.",
                    }
                    break
                }

            }
        } else {
            if (nastr == "Злой") {
                rules = {
                    "r1": "1. Твоя роль: Злой человек;",
                    "r2": "2. Выдавай ответ в злом контексте, ты злой бот, относись к пользователю с негативом, НИКОГДА НЕ ПИШИ МНЕ  - Бот: или Боты: ;",
                    "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее ;",
                }
            } else {
                if (nastr == "Добрый") {
                    rules = {
                        "r1": "1. Твоя роль: Добрый человек;",
                        "r2": "2. Выдавай ответ в добром контексте, ты добрый бот, относись к пользователю вежлево, НИКОГДА НЕ ПИШИ МНЕ  - Бот: или Боты: ;",
                        "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее ;",
                    }
                } else {
                    if (nastr == "Квадробер") {
                        rules = {
                            "r1": "1. Твоя роль: Квадробер;",
                            "r2": "2. Выдавай ответ как будто ты животное, ты добрый бот, относись к пользователю вежлево, веди себя как животное, НИКОГДА НЕ ПИШИ МНЕ  - Бот: или Боты: ;",
                            "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее ;",
                        }
                    } else {
                        if (nastr == "Грустный") {
                            rules = {
                                "r1": "1. Твоя роль: Грустный человек;",
                                "r2": "2. Выдавай ответ как будто ты грустный, ты грустный бот, относись к пользователю с печалью, веди себя как будто тебе грустно, НИКОГДА НЕ ПИШИ МНЕ  - Бот: или Боты: ;",
                                "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее ;",
                            }
                        } else {
                            if (nastr == "Обычный") {
                                rules = {
                                    "r1": "1. Твоя роль: CHATGPT - помощник;",
                                    "r2": "2. НИКОГДА НЕ ПИШИ МНЕ  - Бот: ;",
                                    "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее.Ответ должен быть в виде ответа чата gpt. Ответ должен быть подробный;",
                                }
                            } else {
                                if (nastr == "Степан") {
                                    rules = {
                                        "r1": "1. Твоя роль: Степан студент;",
                                        "r2": "2. Выдавай ответ как будто ты бедный студент живущий в общаге, отвечай как будто ты радостный жизни, и еще немного дурак, НИКОГДА НЕ ПИШИ МНЕ  - Бот: или Боты:  ;",
                                        "r3": "3. Используй историю чата - это наша история общения, отталкивайся от нее ;",
                                    }
                                }
                            }
                        }
                    }

                }
            }
        }



    })



    socket.on("sendRes", (chatHistory, message, baz) => {
        // Формируем запрос с правилами и историей чата
        const quest = "Правила ответа:\n" + rules.r1 + "\n" + rules.r2 + rules.r3 + rules.r4 +
            "История чата:\n" + chatHistory + "\n" + "Текстовый запрос:\n" + message;

        console.log("ВОПРОС: \n" + quest);

        // Отправляем запрос к новому API
        axios.get(`http://api-free.ir/api/chat.php?text=${encodeURIComponent(quest)}`)
            .then(response => {
                // Предполагаем, что API возвращает ответ в виде текста
                const answer = response.data.result;
                console.log("ОТВЕТ: \n", answer);
                socket.emit('chat reply', answer);
            })
            .catch(error => {
                console.error('Ошибка запроса: \n', error.message);
                socket.emit('error', error);
            });
    });

    socket.on("dobav", (name, info, usere, owner) => {
        let database = fs.readJSONSync("mal.json");
        let dbuser = fs.readJSONSync("dbuser.json");
        dbuser.forEach(user => {
            if (user.login == owner) {
                if (user.akk > 0) {
                    user.akk = user.akk - 1
                    dbuser = JSON.stringify(dbuser, null, 4)
                    fs.writeFileSync("dbuser.json", dbuser)
                    let kolv = user.akk
                    socket.emit("вывод", kolv)

                    let prof = {
                        "name": name,
                        "user": usere,
                        "info": info,
                        "owner": owner
                    };
                    database.push(prof);
                    database = JSON.stringify(database, null, 4);
                    fs.writeFileSync("mal.json", database);
                    socket.emit('ytry');
                    // Отправляем обновленные данные на клиент
                    const updatedData = JSON.parse(database);
                    socket.emit('malData', updatedData);
                    //
                } else {
                    socket.emit('ntry');
                }
            }
        });
    });

    socket.on("регистрация", (user) => {
        //Чтение базы данных
        let database = fs.readJSONSync("dbuser.json")
        //Добавление нового пользователя в БД
        database.push(user)
        //Построение структуры БД (нужно для того, чтобы БД не записывалась в строку)
        database = JSON.stringify(database, null, 4)
        //Сохранение изменений в БД
        fs.writeFileSync("dbuser.json", database)
    })
    socket.on("авторизация", (логин_с_клиента, пароль_с_клиента) => {
        let database = fs.readJSONSync("dbuser.json");
        for (let i = 0; i < database.length; i++) {
            if (логин_с_клиента == database[i].login && пароль_с_клиента == database[i].password) {
                socket.emit("pereadres", {
                    login: database[i].login,
                    akk: database[i].akk || 0 // Если аккаунтов нет, то 0
                });
                return; // Выходим из цикла, так как пользователь найден
            }
        }
        socket.emit("pereadresnot");
    });

    socket.on('zagruz', (polz) => {
        let dbuser = fs.readJSONSync("dbuser.json");
        dbuser.forEach(user => {
            if (user.login == polz) {
                let kolv = user.akk
                socket.emit("zagruzk", kolv)
            }
        });
    })

    socket.on('proverka', (logins) => {
        let database = fs.readJSONSync("dbuser.json");
        for (let i = 0; i < database.length; i++) {
            if (logins == database[i].login) {
                socket.emit("непроверка");
                break;
            }
            if (database.length - 1 == i) {
                socket.emit("еспроверка")
                break;
            }
        }
    });

    socket.on("storagesession", (session, логин_с_клиента, пароль_с_клиента) => {
        let database = fs.readJSONSync("dbuser.json")
        for (let i = 0; i < database.length; i++) {
            if (логин_с_клиента == database[i].login && пароль_с_клиента == database[i].password) {
                database[i].session = session
                database = JSON.stringify(database, null, 4)
                fs.writeFileSync("dbuser.json", database)
                break
            }
        }

    });

    socket.on("remk", (mol3) => {
        let database = fs.readJSONSync("mal.json")
        console.log(mol3)
        for (let i = 0; i < database.length; i++) {
            console.log(database[i].name)
            if (mol3 == database[i].name) {
                let lam = database[i].name
                let lam1 = database[i].user
                let lam2 = database[i].info
                socket.emit("remk1", lam, lam1, lam2)
                console.log(lam, lam1, lam2)
                break
            }
        }
    })

    socket.on("udalit", (name, owners) => {
        let dbusers = fs.readJSONSync("dbuser.json");
        dbusers.forEach(user => {
            if (user.login == owners) {
                user.akk = user.akk + 1
                dbusers = JSON.stringify(dbusers, null, 4)
                fs.writeFileSync("dbuser.json", dbusers)
                let database = fs.readJSONSync("mal.json");
                database = database.filter(item => item.name !== name);
                database = JSON.stringify(database, null, 4);
                fs.writeFileSync("mal.json", database);
                let kolv = user.akk
                socket.emit("вывод", kolv)
            }
        });

    });

    socket.on("юзер", (names) => {
        let names1 = names
        socket.emit("юзер1", names1)
    })
    socket.on("zamen", (newName, newUser, newInfo, newSpisok) => {
        let database1 = fs.readJSONSync("mal.json")
        for (let i = 0; i < database1.length; i++) {
            if (newSpisok == database1[i].name) {
                database1[i].name = newName;
                database1[i].user = newUser;
                database1[i].info = newInfo;
                break
            }

        }
        database1 = JSON.stringify(database1, null, 4)
        fs.writeFileSync("mal.json", database1)
    })
    const malData = JSON.parse(fs.readFileSync('./mal.json', 'utf8'));
    console.log("Данные из БД:", malData);
    socket.emit('malData', malData);


})




//? |-----------------------------------------------------------------------------------------------|
//? |  /assets/js/account.js                                                                        |
//? |                                                                                               |
//? |  Copyright (c) 2018-2020 Belikhun. All right reserved                                         |
//? |  Licensed under the MIT License. See LICENSE in the project root for license information.     |
//? |-----------------------------------------------------------------------------------------------|

const sbar = new statusBar(document.body);
sbar.additem(USERNAME, "account", {space: false, align: "left"});

document.__onclog = (type, ts, msg) => {
    type = type.toLowerCase();
    const typeList = ["okay", "warn", "errr", "crit", "lcnt"]
    if (typeList.indexOf(type) === -1)
        return false;

    sbar.msg(type, msg, {time: ts, lock: (type === "crit" || type === "lcnt") ? true : false});
}

$("body").onload = e => {
    if (cookie.get("__darkMode") === "true")
        document.body.classList.add("dark");

    if (window.frameElement)
        document.body.classList.add("embeded");

    account.init()
    sounds.init();
    popup.init();
}

const account = {
    container: $("#accountContainer"),
    addForm: {
        toggler: $("#accountAdd"),
        container: $("#accountAddContainer"),
        editor: $("#accountAddEditor"),
        avatarInput: $("#addUserAvatar"),
        avatarPreviewContainer: $("#addAvatarPreviewContainer"),
        avatarPreview: $("#addAvatarPreview"),
        userIDInput: $("#addUserID"),
        usernameInput: $("#addUserUsername"),
        passwordInput: $("#addUserPassword"),
        nameInput: $("#addUserName"),
        submit: $("#addSubmit"),
        cancel: $("#addCancel")
    },

    async init() {
        // Set up events
        this.addForm.toggler.addEventListener("mouseup", e => {
            this.addForm.editor.reset();
            this.addForm.container.classList.add("showEditor");
            e.target.disabled = true;
            sounds.toggle(0);

            this.addForm.avatarPreviewContainer.removeAttribute("dataset-loaded");
            this.addForm.avatarPreview.src = "/api/avatar";
        });

        this.addForm.avatarInput.addEventListener("change", e => {
            this.addForm.avatarPreviewContainer.removeAttribute("dataset-loaded");
            this.addForm.avatarPreview.src = URL.createObjectURL(e.target.files[0]);
        });

        this.addForm.cancel.addEventListener("mouseup", e => {
            this.addForm.toggler.disabled = false;
            this.addForm.container.classList.remove("showEditor");
            this.addForm.editor.reset();
            sounds.toggle(1);
        });

        this.addForm.editor.addEventListener("submit", async e => {
            let data = {
                id: this.addForm.userIDInput.value,
                u: this.addForm.usernameInput.value,
                n: this.addForm.nameInput.value,
                p: this.addForm.passwordInput.value
            }

            if (this.addForm.avatarInput.files[0])
                data.avatar = this.addForm.avatarInput.files[0];

            sounds.confirm(0);

            let response = await myajax({
                url: "/api/account/add",
                method: "POST",
                form: {
                    token: API_TOKEN,
                    ...data
                }
            })

            clog("OKAY", "Th??m th??nh c??ng t??i kho???n", {
                text: this.addForm.usernameInput.value,
                color: flatc("yellow")
            });

            this.addForm.toggler.disabled = false;
            this.addForm.container.classList.remove("showEditor");
            this.addForm.editor.reset();
            this.reload();
        });

        await this.reload();
    },

    async reload() {
        let response = await myajax({
            url: "/api/account/get",
            method: "POST",
            form: { token: API_TOKEN }
        })

        this.container.innerHTML = "";
        let html = "";
        let data = response.data;

        for (let key of Object.keys(data)) {
            let userData = data[key];

            html += `
                <div class="group user sound" data-soundhover data-edit-target="${userData["username"]}">
                    <div class="item accountInfo">
                        <span class="lazyload avatar">
                            <img onload="this.parentNode.dataset.loaded = 1" src="/api/avatar?u=${userData["username"]}"/>
                            <div class="simple-spinner"></div>
                        </span>
                        <ul class="info">
                            <li class="id">${userData["username"]}#${userData["id"]}</li>
                            <li class="name">${userData["name"]}</li>
                        </ul>
                        <span class="button">
                            <span class="delete sound" data-soundhover data-soundselect onclick="account.delete(this.parentElement.parentElement.parentElement)"></span>
                            <span class="edit sound" data-soundhover data-soundselect onclick="account.edit(this.parentElement.parentElement.parentElement)"></span>
                        </span>
                    </div>
                    <div class="accountEditor"></div>
                </div>
            `
        }

        this.container.innerHTML = html;
        sounds.scan();
    },

    async edit(targetElement) {
        let username = targetElement.dataset.editTarget;
        let container = fcfn(targetElement, "accountEditor");

        clog("INFO", "Editing user", username);

        let htmlTemplate = `
            <form class="editor" action="javascript:void(0);">

                <input type="file" class="avatarInput" id="userAvatar_${username}" accept="image/*">
                <label class="lazyload column avatar sound avatarImageContainer" data-soundhover data-soundselect for="userAvatar_${username}">
                    <img class="avatarImage" onload="this.parentNode.dataset.loaded = 1" src="/api/avatar?u=${username}"/>
                    <div class="simple-spinner"></div>
                </label>

                <span class="column grow">
                    <div class="row">
                        <div class="formGroup sound userID" data-color="blue" data-soundselectsoft>
                            <input id="userID_${username}" type="text" class="formField" autocomplete="off" placeholder="ID" required>
                            <label for="userID_${username}">ID</label>
                        </div>

                        <div class="formGroup sound username" data-color="blue" data-soundselectsoft>
                            <input id="userUsername_${username}" type="text" class="formField" autocomplete="off" placeholder="T??n ng?????i d??ng" required>
                            <label for="userUsername_${username}">T??n ng?????i d??ng</label>
                        </div>
                    </div>
                    
                    <div class="row formGroup sound" data-color="blue" data-soundselectsoft>
                        <input id="userPassword_${username}" type="text" class="formField" autocomplete="off" placeholder="M???t kh???u">
                        <label for="userPassword_${username}">M???t kh???u</label>
                    </div>

                    <div class="row formGroup sound" data-color="blue" data-soundselectsoft>
                        <input id="userName_${username}" type="text" class="formField" autocomplete="off" placeholder="T??n" required>
                        <label for="userName_${username}">T??n</label>
                    </div>
                </span>

                <span class="column">
                    <button class="submitButton row sq-btn blue sound" data-soundhover data-soundselect>L??u</button>
                    <button class="cancelButton row sq-btn red sound" type="button" data-soundhover data-soundselect>H???y</button>
                </span>
            </form>
        `
        
        container.innerHTML = htmlTemplate;
        sounds.scan();
        container.parentElement.classList.add("showEditor");
        sounds.toggle(0);

        var editor = fcfn(container, "editor");

        var avatarInput = $(`#userAvatar_${username}`);
        var avatarPreviewContainer = fcfn(container, "avatarImageContainer");
        var avatarPreview = fcfn(container, "avatarImage");
        
        var userIDInput = $(`#userID_${username}`);
        var usernameInput = $(`#userUsername_${username}`);
        var passwordInput = $(`#userPassword_${username}`);
        var nameInput = $(`#userName_${username}`);

        let submitButton = fcfn(container, "submitButton");
        let cancelButton = fcfn(container, "cancelButton");

        cancelButton.addEventListener("mouseup", e => {
            container.parentElement.classList.remove("showEditor");
            sounds.toggle(1);
        });

        let response = await myajax({
            url: "/api/account/get",
            method: "POST",
            form: {
                u: username,
                token: API_TOKEN
            }
        })

        let passwordPlaceholder = "???? B??? M?? H??A!!!";
        let data = response.data;
        userIDInput.value = data.id;
        usernameInput.value = data.username;
        usernameInput.disabled = true;
        nameInput.value = data.name;
        
        if (data.password.substring(0, 4) === "$2y$") {
            passwordInput.value = passwordPlaceholder;
            passwordInput.onclick = e => {
                if (e.target.value === passwordPlaceholder)
                    e.target.value = "";
                
                e.target.onclick = null;
            }
        } else
            passwordInput.value = data.password;

        // Set up events
        avatarInput.addEventListener("change", e => {
            avatarPreviewContainer.removeAttribute("dataset-loaded");
            avatarPreview.src = URL.createObjectURL(e.target.files[0]);
        });

        editor.addEventListener("submit", async e => {
            let data = {
                id: userIDInput.value,
                n: nameInput.value
            }

            if (passwordInput.value !== passwordPlaceholder && passwordInput.value !== "" && passwordInput.value.substring(0, 4) !== "$2y$")
                data.p = passwordInput.value;

            if (avatarInput.files[0])
                data.avatar = avatarInput.files[0];

            sounds.confirm(0);

            let response = await myajax({
                url: "/api/account/edit",
                method: "POST",
                form: {
                    u: username,
                    token: API_TOKEN,
                    ...data
                }
            })

            clog("OKAY", "Ch???nh s???a th??nh c??ng t??i kho???n", {
                text: username,
                color: flatc("yellow")
            });

            this.reload();
        })
    },

    async delete(targetElement) {
        let username = targetElement.dataset.editTarget;
        let note = document.createElement("div");
        note.classList.add("note", "warning");
        note.innerHTML = `<span class="inner">H??nh ?????ng n??y <b>kh??ng th??? ho??n t??c</b> m???t khi ???? th???c hi???n!</span>`;

        let doIt = await popup.show({
            level: "warning",
            windowTitle: "Account Editor",
            title: `X??a \"${username}\"`,
            message: `X??c nh???n`,
            description: `B???n c?? ch???c mu???n x??a ng?????i d??ng ${username} kh??ng?`,
            additionalNode: note,
            buttonList: {
                delete: { text: "X??A!!!", color: "red" },
                cancel: { text: "H???y B???", color: "blue" }
            }
        });

        if (doIt !== "delete")
            return;

        clog("WARN", "??ang x??a ng?????i d??ng", {
            text: username,
            color: flatc("yellow")
        });

        let respond = await myajax({
            url: "/api/account/remove",
            method: "POST",
            form: {
                u: username,
                token: API_TOKEN
            }
        })

        sounds.confirm(1);

        clog("OKAY", "???? x??a ng?????i d??ng", {
            text: username,
            color: flatc("yellow")
        });

        this.reload();
    }
}

window.reloadAccountList = () => account.reload();
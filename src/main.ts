import "./style.css";

type PostData = {
    id: number,
    title: string,
    body: string,
    userId: number
}

type FieldDisplayEditor = {
    editor: HTMLInputElement | HTMLTextAreaElement | null,
    display: HTMLInputElement | HTMLTextAreaElement | null
}

async function fetchPosts() {
    const resp = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data: PostData[] = await resp.json();
    return new Map(data.map((post) => [post.id, post]));
}

function renderPostElem(postData: PostData) {
    const html = `
<article class="item" id="post_${postData.id}">
    <div class="item-data">
        <h2 class="item-field-value" data-editor-name="post_title_editor">${postData.title}</h2>
        <input class="item-field-editor hidden" type="text" name="post_title_editor" data-item-field-name="title">
        <p class="item-field-value" data-editor-name="post_body_editor">${postData.body}</p>
        <textarea class="item-field-editor hidden" name="post_body_editor" data-item-field-name="body" rows="4" cols="50">
        </textarea>
    </div>
    <button class="saving-button hidden" data-item-id="${postData.id}">Save</button>
    <button class="editing-button" data-item-id="${postData.id}">Edit</button>
    <button class="removal-button" data-item-id="${postData.id}">Delete</button>
</article>
    `.trim();
    const item_template = document.createElement("template");
    item_template.innerHTML = html;
    return item_template.content.firstElementChild as HTMLElement;
}

async function onSaveButtonClicked(event: MouseEvent) {
    if (!(event.target instanceof HTMLElement)) return;

    const savingButton = event.target;
    const itemId = parseInt(savingButton.getAttribute("data-item-id")!);
    const itemElem = document.getElementById(`post_${itemId}`)!;

    // const postData: PostData = BLOG_POSTS.get(itemId)!;

    const formData: any = {};
    const formElements: any = {};
    const editableFields: Array<keyof PostData> = ["title", "body"];

    for (let fieldName of editableFields) {
        const editableFieldElements: FieldDisplayEditor = {editor: null, display: null};
        formElements[fieldName] = editableFieldElements;

        const fieldEditor: HTMLInputElement | null = itemElem.querySelector(
            `.item-field-editor[data-item-field-name=${fieldName}]`,
        );
        if (!fieldEditor) continue;

        editableFieldElements.editor = fieldEditor;
        editableFieldElements.display = itemElem.querySelector(
            `.item-field-value[data-editor-name=${fieldEditor.name}]`,
        );
        formData[fieldName] = fieldEditor.value.toString();
    }
    const resp = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${itemId}`, {
            method: "PATCH",
            body: JSON.stringify({
                title: formData["title"],
                body: formData["body"],
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        });

    const postData: PostData = await resp.json();
    BLOG_POSTS.set(postData.id, postData);
    console.log(postData);

    for (let fieldName of editableFields) {
        const editableFieldElements = formElements[fieldName];
        const fieldEditor = editableFieldElements.editor;
        const fieldDisplay = editableFieldElements.display;

        if (fieldDisplay) fieldDisplay.textContent = postData[fieldName];

        if (fieldEditor && fieldDisplay) {
            fieldEditor.classList.add("hidden");
            fieldDisplay.classList.remove("hidden");
        }
    }
    const editingButton = itemElem.querySelector(".editing-button")!;
    editingButton.classList.remove("hidden");
    savingButton.classList.add("hidden");
}

function onEditButtonClicked(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
        const editingButton = event.target;
        const itemId = editingButton.getAttribute("data-item-id")!;
        // console.log(`post_${itemId}`)
        const itemElem = document.getElementById(`post_${itemId}`)!;
        // console.log(itemElem)
        editItemElem(itemElem);
    }
}

async function onRemoveButtonClicked(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
        const clickedButton = event.target;
        let itemId = parseInt(clickedButton.getAttribute("data-item-id")!);
        if (!itemId) return;

        if (BLOG_POSTS.has(itemId)) {
            BLOG_POSTS.delete(itemId);
            const resp = await fetch(
                `https://jsonplaceholder.typicode.com/posts/${itemId}`, {
                    method: "DELETE",
                });
            const json = await resp.json();
            console.log(json);
        }

        const itemElem = document.getElementById(`post_${itemId}`);
        if (itemElem) {
            itemElem.remove();
        }
    }
}

function appendItemElem(itemElem: HTMLElement, parentElem: HTMLElement, insertAsFirst: boolean = false) {
    if (insertAsFirst) {
        parentElem.insertAdjacentElement("afterbegin", itemElem);
    } else {
        parentElem.appendChild(itemElem);
    }

    const removalButton: HTMLButtonElement = itemElem.querySelector(".removal-button")!;
    removalButton.addEventListener("click", onRemoveButtonClicked);

    const editButton: HTMLButtonElement = itemElem.querySelector(".editing-button")!;
    editButton.addEventListener("click", onEditButtonClicked);

    const saveButton: HTMLButtonElement = itemElem.querySelector(".saving-button")!;
    saveButton.addEventListener("click", onSaveButtonClicked);
}

function editItemElem(itemElem: HTMLElement) {
    const savingButton: HTMLButtonElement = itemElem.querySelector(".saving-button")!;
    const editingButton: HTMLButtonElement = itemElem.querySelector(".editing-button")!;
    savingButton.classList.remove("hidden");
    editingButton.classList.add("hidden");

    const fieldElements: NodeListOf<HTMLElement> = itemElem.querySelectorAll(".item-field-value");
    for (let fieldElem of fieldElements) {
        let editorName = fieldElem.getAttribute("data-editor-name");
        if (editorName === undefined) continue;

        let editorElem = itemElem.querySelector(`[name=${editorName}]`)!;
        if (editorElem === null) continue;

        let fieldValue = fieldElem.textContent!;
        if (editorElem instanceof HTMLInputElement) {
            editorElem.value = fieldValue;
        } else {
            editorElem.textContent = fieldValue;
        }
        editorElem.classList.remove("hidden");
        fieldElem.classList.add("hidden");
    }
}

const BLOG_POSTS = await fetchPosts();

const postsSectionElem: HTMLElement = document.querySelector("#items_group")!;
for (let postData of BLOG_POSTS.values()) {
    appendItemElem(renderPostElem(postData), postsSectionElem);
}

async function onAddItemClicked() {
    const resp = await fetch(
        "https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            body: JSON.stringify({
                title: "New Post",
                body: "",
                userId: 1,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        });
    const newPostData: PostData = await resp.json();
    console.log("new post", newPostData);
    BLOG_POSTS.set(newPostData.id, newPostData);

    const newPostElem = renderPostElem(newPostData);
    appendItemElem(newPostElem, postsSectionElem, true);
    editItemElem(newPostElem);
}

const addItemBtn: HTMLButtonElement = document.querySelector("#add_item_button")!;
addItemBtn.addEventListener("click", onAddItemClicked);



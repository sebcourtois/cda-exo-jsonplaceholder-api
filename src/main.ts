import './style.css'

type PostData = {
    id: number,
    title: string,
    body: string,
    userId: number
}

type PostFormData = { "title"?: string, "body"?: string }

type FieldElements = {
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
        <h2 class="item-field-value" data-editor-name="item_label_editor">${postData.title}</h2>
        <input class="item-field-editor hidden" type="text" name="item_label_editor" data-item-field-name="title">
        <p class="item-field-value" data-editor-name="item_text_editor">${postData.body}</p>
        <textarea class="item-field-editor hidden" name="item_text_editor" data-item-field-name="body"
        rows="4" cols="50">        
        </textarea>
    </div>
    <button class="saving-button hidden" data-item-id="${postData.id}">Save</button>
    <button class="editing-button" data-item-id="${postData.id}">Edit</button>
    <button class="removal-button" data-item-id="${postData.id}">Delete</button>
</article>
    `.trim();
    const item_template = document.createElement("template")
    item_template.innerHTML = html
    return item_template.content.firstElementChild as HTMLElement
}

function onSaveButtonClicked(event: MouseEvent) {
    if (!(event.target instanceof HTMLElement)) return

    const savingButton = event.target;
    const itemId = parseInt(savingButton.dataset.itemId!)
    const itemElem = document.getElementById(`post_${itemId}`)!

    const postData: PostData = BLOG_POSTS.get(itemId)!

    const formData: any = {}
    const editableFieldElements: FieldElements = {editor: null, display: null}
    const formElements: any = {}
    const editableFields: Array<keyof PostData> = ["title", "body"]
    for (let fieldName of editableFields) {
        let selector = `.item-field-editor[data-item-field-name=${fieldName}]`
        const fieldEditor: HTMLInputElement | null = itemElem.querySelector(selector)
        if (!fieldEditor) continue
        editableFieldElements.editor = fieldEditor

        const editorName = fieldEditor.name
        selector = `.item-field-value[item_label_editor=${editorName}]`
        editableFieldElements.display = itemElem.querySelector(selector)

        formData[fieldName] = fieldEditor.value
        formElements[fieldName] = editableFieldElements
    }
    postData.title = formData["title"]
    postData.body = formData["body"]

    // saveItemsDb();

    for (let fieldName of editableFields) {

    }

    const fieldElements = itemElem.querySelectorAll(".item-field-value");
    for (let fieldElem of fieldElements) {
        let editorName = fieldElem.getAttribute("data-editor-name");
        if (editorName === undefined) continue;

        let editorElem = itemElem.querySelector(`[name=${editorName}]`);
        if (editorElem === null) continue;

        let fieldName = editorElem.getAttribute("data-item-field-name")!;
        fieldElem.textContent = postData[fieldName as keyof PostData];

        editorElem.classList.add("hidden");
        fieldElem.classList.remove("hidden");
    }
    const editingButton = itemElem.querySelector(".editing-button")!;
    editingButton.classList.remove("hidden");
    savingButton.classList.add("hidden");
}

function onEditButtonClicked(event: MouseEvent) {
    if (event.target instanceof HTMLElement) {
        const editingButton = event.target;
        const itemId = editingButton.dataset.itemId!;
        console.log(`post_${itemId}`)
        const itemElem = document.getElementById(`post_${itemId}`)!;
        console.log(itemElem)
        editItemElem(itemElem)
    }
}

function appendItemElem(itemElem: HTMLElement, parentElem: HTMLElement, insertAsFirst: boolean = false) {
    if (insertAsFirst) {
        parentElem.insertAdjacentElement("afterbegin", itemElem)
    } else {
        parentElem.appendChild(itemElem)
    }

    // const removalButton: HTMLButtonElement = itemElem.querySelector(".removal-button")!;
    // removalButton.addEventListener("click", onRemoveButtonClicked);
    //
    // const moveButton: HTMLButtonElement = itemElem.querySelector(".page-move-button")!;
    // moveButton.addEventListener("click", onMoveButtonClicked);

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

const BLOG_POSTS = await fetchPosts()

const itemsGroupElem: HTMLElement = document.querySelector("#items_group")!;
for (let postData of BLOG_POSTS.values()) {
    appendItemElem(renderPostElem(postData), itemsGroupElem)
}

function onAddItemClicked() {
    const newPostData: PostData = {
        id: -1,
        userId: -1,
        title: "New Post",
        body: "",
    }
    const newPostElem = renderPostElem(newPostData)
    appendItemElem(newPostElem, itemsGroupElem, true)
    editItemElem(newPostElem)
}

const addItemBtn: HTMLButtonElement = document.querySelector("#add_item_button")!;
addItemBtn.addEventListener("click", onAddItemClicked);



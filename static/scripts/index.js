// handling dynamic border color
const logoutIcon = document.querySelector('.logout-icon');
const notesIcon = document.querySelector('.notes-icon');
const toolsSidebar = document.querySelector('.tools-sidebar');

logoutIcon.addEventListener('mouseover', () => {
    toolsSidebar.classList.add('logout-trigger');
});

logoutIcon.addEventListener('mouseout', () => {
    toolsSidebar.classList.remove('logout-trigger');
});


// handle notes sidebar 
const notesSidebar = document.getElementById('notes-sidebar');

function showNotesSidebar() {
    toolsSidebar.classList.add('notes-trigger');
    notesSidebar.classList.add('show');
}

function closeNotesSidebar() {
    if (notesSidebar.classList.contains('show')) {

        toolsSidebar.classList.remove('notes-trigger');
        notesSidebar.classList.remove('show');
        disable_create_input();
    } else {

        toolsSidebar.classList.add('notes-trigger');
        notesSidebar.classList.add('show');
    }
}

// render flash message
const flashMessage = document.getElementById('flash-message');

function showFlashMessage(message) {
    flashMessage.innerHTML = message;
    flashMessage.style.display = 'block';
    setTimeout(function () {
        flashMessage.style.display = 'none';
    }, 4000); // hide message after n seconds
}

// get notes content and update to textarea
const textArea = document.getElementById("text-area");
const noteName = document.getElementById("note-name");

function update_textarea(fname) {
    fetch("/api/__get_data", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "name": fname })
    }).then(response => {
        return response.json();
    })
        .then(responseJson => {
            if (!responseJson['success']) {
                showFlashMessage(responseJson['response']);
                logoutFunc();
            } else {
                noteName.textContent = fname;
                textArea.title = fname;
                textArea.value = responseJson['response']
                enable_note_interactions();
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


// event listener to handle notes selection
function addEventListenerToLi(liElement, fname) {
    liElement.addEventListener('click', function () {
        // Remove 'active' class from all list items
        document.querySelectorAll('.notes-sidebar ul li').forEach(item => item.classList.remove('active'));
        // Add 'active' class to the clicked list item
        liElement.classList.add('active');
        update_textarea(fname);
    });
}


// fetch note titles
const ulElement = document.querySelector('.notes-sidebar ul');

function createLi(text, inserBefore = false) {
    const liElement = document.createElement('li');
    liElement.textContent = text;
    addEventListenerToLi(liElement, text); // adding eventlister to each li
    if (!inserBefore) {
        ulElement.appendChild(liElement);
    } else {
        ulElement.insertBefore(liElement, ulElement.children[1]);
    }
    return liElement;
}

fetch('/api/__get_titles')
    .then(response => {
        return response.json();
    })
    .then(responseJson => {

        if (!responseJson['success']) {
            showFlashMessage(responseJson['response']);
            logoutFunc();
        } else {
            responseJson['response'].forEach(title => {
                createLi(decodeURIComponent(title));
            });
            get_logs_and_update_text();
        }

    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

function getLiFromName(name) {
    return Array.from(document.querySelectorAll('li')).find(li => li.textContent === name);
}

function get_logs_and_update_text() {
    fetch("/api/__get_logs", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(responseJson => {
            if (!responseJson['success']) {
                showFlashMessage(responseJson['response']);
                logoutFunc();
            } else {
                const liWithCheckItem = getLiFromName(responseJson['last_viewed']);
                if (liWithCheckItem) {
                    liWithCheckItem.click();
                }
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function save_data() {
    fetch("/api/__update_note", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "name": textArea.title, "data": textArea.value })
    }).then(response => {
        return response.json();
    })
        .then(responseJson => {
            showFlashMessage(responseJson['response']);
            if (!responseJson['updated']) {
                logoutFunc();
            }
            removeStarFromName();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


function logoutFunc() {
    fetch("/api/__logout", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
    }).then(response => {
        return response.json();
    })
        .then(responseJson => {
            if (!responseJson['logged_out']) {
                showFlashMessage(responseJson['response']);
            } else {
                // Redirect to the homepage if successfully logged out
                window.location.href = "/";
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function handleKeyCombination(e) {
    // Check if Ctrl (or Cmd on macOS) key is pressed
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
            e.preventDefault();
            save_data();
        }
        else if (e.key === 'b') {
            e.preventDefault();
            notesIcon.click();
        }
    }

}

// Attach the keys event listener to the document
document.addEventListener('keydown', handleKeyCombination);

// loading animated svg
const loadingSvg = document.querySelector('.processing-icon');

// Function to show the loading icon
function showLoadingSvg() {
    loadingSvg.style.display = 'flex';
}

// Function to hide the loading icon
function hideLoadingSvg() {
    loadingSvg.style.display = 'none';
}

// Interceptor to handle fetch requests
function interceptFetchRequests() {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        showLoadingSvg();

        try {
            const response = await originalFetch(...args);
            hideLoadingSvg();
            return response;
        } catch (error) {
            hideLoadingSvg();
            throw error;
        }
    };
}

// Call the interceptor to start intercepting fetch requests
interceptFetchRequests();


function addStarToName() {
    noteName.textContent = textArea.title + "*";
}

function removeStarFromName() {
    noteName.textContent = textArea.title;
}

// handle note deletion
async function delete_note() {
    if (await confirmDialog("Are you sure? delete '" + textArea.title + "'")) {
        fetch("/api/__delete_note", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "name": textArea.title })
        }).then(response => {
            return response.json();
        })
            .then(responseJson => {
                showFlashMessage(responseJson['response']);
                if (!responseJson['deleted']) {
                    logoutFunc();
                } else {
                    getLiFromName(textArea.title).remove();
                    textArea.value = "";
                    textArea.title = "";
                    noteName.textContent = "...";
                }

            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
}

// handle notes interaction { save and delete }
const saveBtn = document.querySelector(".save-icon");
const deleteBtn = document.querySelector(".delete-icon");

function disable_note_interactions() {
    saveBtn.classList.add("disabled");
    deleteBtn.classList.add("disabled");
}

function enable_note_interactions() {
    saveBtn.classList.remove("disabled");
    deleteBtn.classList.remove("disabled");
}

// handle note creation
//const createBtn = document.querySelector(".create-icon");
const createInput = document.querySelector(".create-input")
function enable_create_input() {
    //createInput.style.display = "flex";
    if (!notesSidebar.classList.contains("show")) {
        notesIcon.click();
    }
    createInput.classList.add("active");
    createInput.focus();

}

function disable_create_input() {
    createInput.classList.remove("active");
    //createInput.style.display = "none";
}

// handle note creation
function create_note() {
    var nName = createInput.value;

    fetch("/api/__create_note", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "name": nName })
    }).then(response => {
        return response.json();
    })
        .then(responseJson => {
            showFlashMessage(responseJson['response']);
            if (responseJson['created']) {
                createLi(nName, insertBefore = true).click();
                disable_create_input();
                textArea.focus()
            } else if (responseJson['response'].includes("exists")) {
                pass
            } else {
                logoutFunc();
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


createInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        create_note();
    }
});


// handle dialog box render

const customDialogTitle = document.getElementById("customDialogTitle");
const customOverlay = document.getElementById("customOverlay");
const customCancelButton = document.getElementById("customCancelButton");
const customOkButton = document.getElementById("customOkButton");

function confirmDialog(title) {
    disable_note_interactions();

    customDialogTitle.textContent = title;

    return new Promise((resolve) => {
        customOverlay.style.display = "flex";

        customCancelButton.addEventListener("click", function () {
            customOverlay.style.display = "none";
            resolve(false);
            enable_note_interactions();
        });

        customOkButton.addEventListener("click", function () {
            customOverlay.style.display = "none";
            resolve(true);
        });
    });
}

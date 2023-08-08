function setCookie(cName, cValue, expDays) {
    let date = new Date();
    date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
}

function showFlashMessage(message) {
    var flashMessage = document.getElementById('flash-message');
    flashMessage.innerHTML = message;
    flashMessage.style.display = 'block';
    setTimeout(function() {
    flashMessage.style.display = 'none';
    }, 4000); // hide message after n seconds
}

const form = document.getElementById('login-form');
const button = document.getElementById('submit_btn');
const loading_svg = document.getElementById('loading-anim');

function toggle_loading_anim(){
    if (loading_svg.style.display != "block"){
        loading_svg.style.display = "block";
        button.style.display = "none";
    }else{
        loading_svg.style.display = "none";
        button.style.display = "block"
    }
}
const signInForm = document.getElementById('signin-form');
if (signInForm){
    signInForm.addEventListener('submit', function(event) {
        event.preventDefault();
        toggle_loading_anim();

        const username = event.target.elements[0].value;
        const password = event.target.elements[1].value;

        send_post_req("api/__signin", {"username": username, "password": password})
            .then(response => {
                if (response['authenticated']){
                    setCookie("token", response['authtoken'], 365);
                    location.reload();
                }else{
                    showFlashMessage(response['response']);
                    toggle_loading_anim();
                }
            })
            .catch(error => {
                console.error(error);
                toggle_loading_anim();
            });
    });
}

const signUpForm = document.getElementById('signup-form');

if (signUpForm){
    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault();
        toggle_loading_anim();

        const username = event.target.elements[0].value;
        const password = event.target.elements[1].value;

        send_post_req("api/__signup", {"username": username, "password": password})
            .then(response => {
                showFlashMessage(response['response']);
                if (response['created']){
                    window.location.href = "/";
                }else{
                    toggle_loading_anim();
                }
            })
            .catch(error => {
                console.error(error);
                toggle_loading_anim();
            });
    });
}

function send_post_req(endpoint, data){
    return fetch(endpoint, {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(data)
    }).then((response) => {
        return response.json();
    })
}
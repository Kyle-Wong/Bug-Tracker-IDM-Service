const CreateUser = document.querySelector(".CreateUser");

CreateUser.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = CreateUser.querySelector(".username").value;
    const password = CreateUser.querySelector(".password").value;
    console.log(username);
    console.log(JSON.stringify({username,password}));
    post('/createUser', {username, password})
}) 

function post (path, data){
    return window.fetch(path, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
}
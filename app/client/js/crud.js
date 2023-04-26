export const ORIGIN = window.location.origin;

export async function logIn(username, password) {
    const response = await fetch(`${ORIGIN}/server/login?${username}=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function createAccount(username, password) {
    const response = await fetch(`${ORIGIN}/server/createAccount?${username}=${password}`,
        { method: 'PUT' }
    );
    const data = await response.json();
    return data;
}

export async function logOut(username, password) {
    const response = await fetch(`${ORIGIN}/server/logout?${username}=${password}`,
        { method: 'POST' }
    );
}

export async function createThread(username, password, post, image, hasImage) {
    const message = JSON.stringify({ user: username, pw: password, postData: post, hasImage: hasImage});
    const response = await fetch(`${ORIGIN}/server/createThread?data=${message}`,
        { method: 'POST', body: image }
    );
    const data = await response.json();
    return data;
}

export async function getThread(post) {
    const response = await fetch(`${ORIGIN}/server/getThread?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function createComment(post_parent, post_id, parent_id, username, password, text) {
    const response = await fetch(`${ORIGIN}/server/createComment?post_id=${post_id}&post_parent=${post_parent}&parent_id=${parent_id}&username=${username}&pw=${password}&text=${text}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function getComments(post) {
    const response = await fetch(`${ORIGIN}/server/getComments?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function deleteThread(username, password, title) {
    const message = JSON.stringify({ user: username, pw: password, title: title });
    const response = await fetch(`${ORIGIN}/server/deleteThread?data=${message}`, 
        { method: 'DELETE' }
    );
    const data = await response.json();
    return data;
}

export async function dumpThreads(){
    const response = await fetch(`${ORIGIN}/server/dumpThreads`, 
    {method: 'GET'}
    );
    const data = await response.json();
    return data;
}

export async function updateLikeCount(comment) {
    const response = await fetch(`${ORIGIN}/server/updateLikeCount?comment=${comment}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function isLoggedIn(username){
    const response = await fetch(`${ORIGIN}/server/isLoggedIn?user=${username}`, 
    {method: 'GET'}
    );
    const data = await response.json();
    return data;
}
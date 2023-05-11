// The URL of the server
export const ORIGIN = window.location.origin;

// Logs in the user on server-side
export async function logIn(username, password) {
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    const response = await fetch(`${ORIGIN}/server/login?${username}=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

// Creates a new account
export async function createAccount(username, password) {
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    const response = await fetch(`${ORIGIN}/server/createAccount?${username}=${password}`,
        { method: 'PUT' }
    );
    const data = await response.json();
    return data;
}

// Logs out the user
export async function logOut(username, password) {
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    const response = await fetch(`${ORIGIN}/server/logout?${username}=${password}`,
        { method: 'POST' }
    );
}

// Creates a new thread
export async function createThread(username, password, post, image, hasImage) {
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    const text = encodeURIComponent(post.text);
    const title = encodeURIComponent(post.title);
    const response = await fetch(`${ORIGIN}/server/createThread?user=${username}&pw=${password}&postTitle=${title}&postText=${text}&hasImage=${hasImage}`,
        { method: 'POST', body: image }
    );
    const data = await response.json();
    return data;
}

// Returns a specific thread object
export async function getThread(post) {
    post = encodeURIComponent(post);
    const response = await fetch(`${ORIGIN}/server/getThread?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

// Posts a comment
export async function createComment(post_parent, post_id, parent_id, username, password, text) {
    post_parent = encodeURIComponent(post_parent);
    post_id = encodeURIComponent(post_id);
    parent_id = encodeURIComponent(parent_id);
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    text = encodeURIComponent(text);
    const response = await fetch(`${ORIGIN}/server/createComment?post_id=${post_id}&post_parent=${post_parent}&parent_id=${parent_id}&username=${username}&pw=${password}&text=${text}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

// Returns list of comment objects for post
export async function getComments(post) {
    post = encodeURIComponent(post);
    const response = await fetch(`${ORIGIN}/server/getComments?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

// Deleted a thread with title title
// User must be authenticated
export async function deleteThread(username, password, title) {
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    title = encodeURIComponent(title);
    const response = await fetch(`${ORIGIN}/server/deleteThread?user=${username}&pw=${password}&title=${title}`,
        { method: 'DELETE' }
    );
    const data = await response.json();
    return data;
}

// Returns an array of all the thread objects
export async function dumpThreads(page, amount) {
    const response = await fetch(`${ORIGIN}/server/dumpThreads?page=${page}$amount=${amount}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

// Updates the like count for comment
export async function updateLikeCount(comment, username, password) {
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    comment = encodeURIComponent(comment);
    const response = await fetch(`${ORIGIN}/server/updateLikeCount?comment=${comment}&user=${username}&pw=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

// Returns a boolean on weather username is logged in
export async function isLoggedIn(username) {
    username = encodeURIComponent(username);
    const response = await fetch(`${ORIGIN}/server/isLoggedIn?user=${username}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function deleteComment(commentID, username, password){
    username = encodeURIComponent(username);
    password = encodeURIComponent(password);
    commentID = encodeURIComponent(commentID);

    const response = await fetch(`${ORIGIN}/server/deleteComment?user=${username}&pw=${password}&comment=${commentID}`,
    {method: 'DELETE'}
    );
    const data = await response.json();
    return data;
}

export async function numThreads(){
    const response = await fetch(`${ORIGIN}/server/numThreads`, {method: 'GET'});
    const data = await response.json();
    return data;
}
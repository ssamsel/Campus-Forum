// The URL of the server
export const ORIGIN = window.location.origin;

// Logs in the user on server-side
export async function logIn(username, password) {
    const response = await fetch(`${ORIGIN}/server/login?${username}=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

// Creates a new account
export async function createAccount(username, password) {
    const response = await fetch(`${ORIGIN}/server/createAccount?${username}=${password}`,
        { method: 'PUT' }
    );
    const data = await response.json();
    return data;
}

// Logs out the user
export async function logOut(username, password) {
    const response = await fetch(`${ORIGIN}/server/logout?${username}=${password}`,
        { method: 'POST' }
    );
}

// Creates a new thread
export async function createThread(username, password, post, image, hasImage) {
    console.log(`?user=${username}&pw=${password}&postData=${JSON.stringify(post)}&hasImage=${hasImage}}`)
    const response = await fetch(`${ORIGIN}/server/createThread?user=${username}&pw=${password}&postTitle=${post.title}&postText=${post.text}&hasImage=${hasImage}`,
        { method: 'POST', body: image }
    );
    const data = await response.json();
    return data;
}

// Returns a specific thread object
export async function getThread(post) {
    const response = await fetch(`${ORIGIN}/server/getThread?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

// Posts a comment
export async function createComment(post_parent, post_id, parent_id, username, password, text) {
    const response = await fetch(`${ORIGIN}/server/createComment?post_id=${post_id}&post_parent=${post_parent}&parent_id=${parent_id}&username=${username}&pw=${password}&text=${text}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

// Returns list of comment objects for post
export async function getComments(post) {
    const response = await fetch(`${ORIGIN}/server/getComments?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

// Deleted a thread with title title
// User must be authenticated
export async function deleteThread(username, password, title) {
    const response = await fetch(`${ORIGIN}/server/deleteThread?user=${username}&pw=${pw}&title=${title}`,
        { method: 'DELETE' }
    );
    const data = await response.json();
    return data;
}

// Returns an array of all the thread objects
export async function dumpThreads() {
    const response = await fetch(`${ORIGIN}/server/dumpThreads`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

// Updates the like count for comment
export async function updateLikeCount(comment, username, password) {
    const response = await fetch(`${ORIGIN}/server/updateLikeCount?comment=${comment}&user=${username}&pw=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

// Returns a boolean on weather username is logged in
export async function isLoggedIn(username) {
    const response = await fetch(`${ORIGIN}/server/isLoggedIn?user=${username}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}
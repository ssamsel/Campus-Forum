export const SERVER_NAME = window.location.origin;



export async function logIn(username, hash) {
    const response = await fetch(`${SERVER_NAME}/server/login?${username}=${hash}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function createAccount(username, hash) {
    const response = await fetch(`${SERVER_NAME}/server/createAccount?${username}=${hash}`,
        { method: 'PUT' }
    );
    const data = await response.json();
    return data;
}

export async function logOut(username, hash) {
    const response = await fetch(`${SERVER_NAME}/server/logout?${username}=${hash}`,
        { method: 'POST' }
    );
}

export async function createThread(username, hash, post, image, hasImage) {
    const message = JSON.stringify({ user: username, pwHash: hash, postData: post, hasImage: hasImage});
    const response = await fetch(`${SERVER_NAME}/server/createThread?data=${message}`,
        { method: 'POST', body: image }
    );
    const data = await response.json();
    return data;
}

export async function getThread(post) {
    const response = await fetch(`${SERVER_NAME}/server/getThread?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function createComment(post_parent, post_id, parent_id, username, pwHash, text) {
    const response = await fetch(`${SERVER_NAME}/server/createComment?post_id=${post_id}&post_parent=${post_parent}&parent_id=${parent_id}&username=${username}&pwHash=${pwHash}&text=${text}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function getComments(post) {
    const response = await fetch(`${SERVER_NAME}/server/getComments?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function deleteThread(username, hash, post) {
    const message = JSON.stringify({ user: username, pwHash: hash, postData: post });
    const response = await fetch(`${SERVER_NAME}/server/deleteThread?data=${message}`, 
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function dumpThreads(){
    const response = await fetch(`${SERVER_NAME}/server/dumpThreads`, 
    {method: 'GET'}
    );
    const data = await response.json();
    return data;
}

export async function updateLikeCount(comment) {
    const response = await fetch(`${SERVER_NAME}/server/updateLikeCount?comment=${comment}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

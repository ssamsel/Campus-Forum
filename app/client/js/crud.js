export const SERVER_IP_PORT_TUPLE = "127.0.0.1:3000";




export async function logIn(username, hash) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/login?${username}=${hash}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function createAccount(username, hash) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/createAccount?${username}=${hash}`,
        { method: 'PUT' }
    );
    const data = await response.json();
    return data;
}

export async function logOut(username, hash) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/logout?${username}=${hash}`,
        { method: 'POST' }
    );
}

export async function createThread(username, hash, post) {
    const message = JSON.stringify({ user: username, pwHash: hash, postData: post });
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/createThread?data=${message}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function getThread(post) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/getThread?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function createComment(post_parent, post_id, parent_id, username, text) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/createComment?post_id=${post_id}&post_parent=${post_parent}&parent_id=${parent_id}&username=${username}&text=${text}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function getComments(post) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/getComments?post_id=${post}`,
        { method: 'GET' }
    );
    const data = await response.json();
    return data;
}

export async function deleteThread(username, hash, post) {
    const message = JSON.stringify({ user: username, pwHash: hash, postData: post });
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/deleteThread?data=${message}`, 
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function dumpThreads(){
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/dumpThreads`, 
    {method: 'GET'}
    );
    const data = await response.json();
    return data;
}

export async function updateLikeCount(count) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/updateLikeCount?count=${count}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return data;
}
  
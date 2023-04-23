const SERVER_IP_PORT_TUPLE = "127.0.0.1:3000";




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
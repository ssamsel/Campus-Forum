const SERVER_IP_PORT_TUPLE = "127.0.0.1:3000";

export async function logIn(username, password) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/login?${username}=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function createAccount(username, password) {
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/createAccount?${username}=${password}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}
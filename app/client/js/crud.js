const SERVER_IP_PORT_TUPLE = "127.0.0.1:3000";

// Taken from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function hashPw(password) {
    const msgUint8 = new TextEncoder().encode(password); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}


export async function logIn(username, password) {
    const hash = await hashPw(password);
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/login?${username}=${hash}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}

export async function createAccount(username, password) {
    const hash = await hashPw(password);
    const response = await fetch(`http://${SERVER_IP_PORT_TUPLE}/server/createAccount?${username}=${hash}`,
        { method: 'POST' }
    );
    const data = await response.json();
    return data;
}
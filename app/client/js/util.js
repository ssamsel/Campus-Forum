import * as crud from "./crud.js";

export async function integrateAuthUI() {
  const username = window.sessionStorage.getItem("user");
  if (await isAuthenticated()) {
    account_link.innerHTML =
      "<a>" +
      username +
      '</a> <button id="login_out" type="button" class="btn login-btn">Log Out</button>';

    document
      .getElementById("login_out")
      .addEventListener("click", async (e) => {
        await crud.logOut(username, window.sessionStorage.getItem("pw"));
        window.sessionStorage.clear();
        alert("You have logged out");
        location.reload();
      });
  }
  else {
    // Synchronize server and client auth status if not logged in
    crud.logOut(username, window.sessionStorage.getItem("pw"));
    window.sessionStorage.clear();


    // Change account name link so it will return to current forum
    account_link.innerHTML = `<a href=/client/login.html?prev=${encodeURIComponent(window.location.href)}>Create Account/Login</a>`;
  }
}

export async function isAuthenticated() {
  return await crud.isLoggedIn(window.sessionStorage.getItem("user"));
}
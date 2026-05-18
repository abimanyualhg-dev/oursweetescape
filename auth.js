const users = {
  ayah: "ayahganteng",
  bunda: "bundacantik"
};

function submitLogin() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");

  if (users[username] && users[username] === password) {
    localStorage.setItem("loggedInUser", username);
    window.location.href = "call.html";
  } else {
    error.textContent = "ID atau password salah";
  }
}

window.submitLogin = submitLogin;
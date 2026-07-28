const startDate = new Date("2025-12-28T00:00:00+07:00");

function updateTimer(){

const now = new Date();
const diff = now - startDate;

document.getElementById("days").innerText =
Math.floor(diff/(1000*60*60*24));

document.getElementById("hours").innerText =
Math.floor((diff/(1000*60*60))%24);

document.getElementById("minutes").innerText =
Math.floor((diff/(1000*60))%60);

document.getElementById("seconds").innerText =
Math.floor((diff/1000)%60);

document.getElementById("wibClock").innerText =
now.toLocaleTimeString("en-US",{
timeZone:"Asia/Jakarta",
hour12:false
})+" WIB";

document.getElementById("fullDate").innerText =
now.toLocaleDateString("en-US",{
month:"long",
day:"numeric",
year:"numeric"
});

updateSpecialDay();
  
}

setInterval(updateTimer,1000);
updateTimer();

const memories = document.querySelector(".memories");

window.addEventListener("scroll",()=>{

const sectionTop = memories.getBoundingClientRect().top;
const sectionBottom = memories.getBoundingClientRect().bottom;

if(
sectionTop < window.innerHeight * 0.75 &&
sectionBottom > window.innerHeight * 0.25
){
memories.classList.add("show");
}else{
memories.classList.remove("show");
}

});

const btn = document.getElementById("generateBtn");
const output = document.getElementById("quoteOutput");

btn.addEventListener("click",()=>{

const quote =
quotes[Math.floor(Math.random()*quotes.length)];

typeWriter(quote);

});

function typeWriter(text){

output.innerHTML="";
let i=0;

const typing=setInterval(()=>{

output.innerHTML += text.charAt(i);

i++;

if(i>=text.length){
clearInterval(typing);
}

},40);

}

/* LOGIN POPUP */

const loginBtn =
document.getElementById("loginBtn");

const loginPopup =
document.getElementById("loginPopup");

loginBtn.addEventListener("click",()=>{

loginPopup.classList.add("show");

});

loginPopup.addEventListener("click",(e)=>{

if(e.target===loginPopup){
loginPopup.classList.remove("show");
}

});

/* MAGIC TOUCH */

const magicTouchBtn =
document.getElementById("magicTouchBtn");

magicTouchBtn.addEventListener("click",()=>{

window.location.href = "magic-touch.html";

});

/* MAGIC GARDEN */

const magicGardenBtn =
document.getElementById("magicGardenBtn");

magicGardenBtn.addEventListener("click",()=>{

window.location.href = "magic-garden.html";

});

function getOrdinal(n){

    if(n % 100 >= 11 && n % 100 <= 13)
        return n + "th";

    switch(n % 10){

        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";

    }

}

function updateSpecialDay(){

    const box = document.getElementById("specialDay");

    const today = new Date();

    if(today.getDate() !== 28){

        box.textContent = "";
        return;

    }

    const start = new Date(2025,11,28);

    let months =
        (today.getFullYear()-start.getFullYear())*12 +
        (today.getMonth()-start.getMonth());

    if(months <= 0){

        box.textContent = "";
        return;

    }

    if(today.getMonth() === 11){

        const years = today.getFullYear()-2025;

        box.textContent =
        `✨ ${getOrdinal(years)} ANNIVERSARY ✨`;

    }else{

        box.textContent =
        `🌸 ${getOrdinal(months)} MONTHVERSARY 🌸`;

    }

}

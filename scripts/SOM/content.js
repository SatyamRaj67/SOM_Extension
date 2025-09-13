// Get the Project Names from the Hack Club Summer Website
let cards;

function getProjectNames(cards) {
  // I was trying to use forEach but it wasn't working
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].href.includes("/projects/")) {
      let h2 = cards[i].querySelector("h2");
      if (h2) {
        let projectName = h2.innerText;
        console.log(projectName);
      }
    }
  }
}

cards = document.getElementsByTagName("a");
getProjectNames(cards);

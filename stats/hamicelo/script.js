import { FirebaseConfig, GoogleConfig } from "./config/config.js";

let playerInfoGlobal = null;
let gameResultsGlobal = null;
const googleDriveFolderId = GoogleConfig.driveFolerId;

let driveFiles = [];

async function getDriveFiles(folderId) {
  const apiKey = GoogleConfig.apiKey;
  const apiUrl = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents&fields=files(id%2Cname)&key=${apiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  return data.files;
}

// Call this function to get the Drive files for the specified folder
async function loadDriveFiles(folderId) {
  driveFiles = await getDriveFiles(folderId);
}

loadDriveFiles(googleDriveFolderId);

async function fetchGoogleSheetData() {
  let includeOldData = true;
  const apiKey = GoogleConfig.apiKey;
  const sheetId = GoogleConfig.sheetId_data;
  const sheetName = includeOldData ? "temp전체리그Data" : "전체리그Data";
  // const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:Z1000?key=${apiKey}`;
  const url = includeOldData
    ? "https://sheets.googleapis.com/v4/spreadsheets/" +
      sheetId +
      "/values/" +
      sheetName +
      "!A1:J40000?key=" +
      apiKey
    : "https://sheets.googleapis.com/v4/spreadsheets/" +
      sheetId +
      "/values/" +
      sheetName +
      "!A1:J25000?key=" +
      apiKey;

  const response = await fetch(url);
  const data = await response.json();

  const rows = data.values;
  const gameResults = rows.slice(1).map((row) => {
    return {
      date: row[0],
      WinnerTier: row[1],
      WinnerID: row[2],
      WinnerRace: row[3],
      LoserTier: row[4],
      LoserID: row[5],
      LoserRace: row[6],
      Map: row[7],
      leagueTitle: row[8],
      leagueMoreDetails: row[9],
    };
  });

  gameResultsGlobal = gameResults;
  return gameResults;
}

let playerData = null;
let playerResults;

(async function init() {
  playerResults = await fetchPlayerData();
})();

async function fetchPlayerData() {
  if (playerData) {
    return playerData;
  }
  const apiKey = GoogleConfig.apiKey;
  const sheetId = GoogleConfig.sheetId_data;

  const sheetName = "선수Data"; // Replace with the name of the tab you want to fetch data from
  const url =
    "https://sheets.googleapis.com/v4/spreadsheets/" +
    sheetId +
    "/values/" +
    sheetName +
    "!A1:S1300?key=" +
    apiKey;

  const response = await fetch(url);
  const data = await response.json();

  const rows = data.values;
  const playerResults = rows.slice(1).map((row) => {
    return {
      Team: row[0],
      Tier: row[1],
      ID: row[2],
      Race: row[3],
      STLWin: row[11],
      SILWin: row[12],
      NumSTL: parseInt(row[13]) + parseInt(row[14]),
      NumSTLWin: row[13],
      NumSTLLose: row[14],
      NumSILWin: row[15],
      NumSILLose: row[16],
      NumTotalWin: row[17],
      NumTotalLose: row[18],
    };
  });

  // Aggregate the statistics
  const teamStats = {};
  const tierStats = {};
  const raceStats = {};

  playerResults.forEach((player) => {
    if (player.Team.trim() !== "") {
      teamStats[player.Team] = (teamStats[player.Team] || 0) + 1;
      tierStats[player.Tier] = (tierStats[player.Tier] || 0) + 1;
      raceStats[player.Race] = (raceStats[player.Race] || 0) + 1;
    }
  });

  // Prepare the data and labels for the charts
  const teamLabels = Object.keys(teamStats);
  const teamData = teamLabels.map((label) => teamStats[label]);
  const tierLabels = Object.keys(tierStats);
  const tierData = tierLabels.map((label) => tierStats[label]);
  const raceLabels = Object.keys(raceStats);
  const raceData = raceLabels.map((label) => raceStats[label]);

  // Destroy existing chart instances if they exist
  if (teamChartInstance) teamChartInstance.destroy();
  if (tierChartInstance) tierChartInstance.destroy();
  if (raceChartInstance) raceChartInstance.destroy();

  // Sort the labels and data arrays based on the custom sort function
  const sortedTierLabels = Object.keys(tierStats).sort(customTierSort);
  const sortedTierData = sortedTierLabels.map((label) => tierStats[label]);

  // Create the charts
  const teamCtx = document.getElementById("teamChart").getContext("2d");
  const tierCtx = document.getElementById("tierChart").getContext("2d");
  const raceCtx = document.getElementById("raceChart").getContext("2d");

  teamChartInstance = createBarChart(teamCtx, teamData, teamLabels);
  tierChartInstance = createBarChart(tierCtx, sortedTierData, sortedTierLabels);
  raceChartInstance = createBarChart(raceCtx, raceData, raceLabels);

  // Before returning the playerResults, set the global playerData variable
  playerData = playerResults;
  return playerResults;
}

// Function to fetch the team ranking data from the Google Sheet and display it on the page
async function getTeamRankingData() {
  const spinLoading = document.getElementById("loading-ranking");
  spinLoading.style.display = "block"; // show loading spinner

  const apiKey = GoogleConfig.apiKey;
  const sheetId = GoogleConfig.sheetId_data;
  const sheetName = "STLS11일정"; // Replace with the name of the tab you want to fetch data from
  const url =
    "https://sheets.googleapis.com/v4/spreadsheets/" +
    sheetId +
    "/values/" +
    sheetName +
    "!K3:R15?key=" +
    apiKey;

  // const range = "K3:R15"; // Assumes that the first row contains the column headers and the first column contains the team rankings

  const response = await fetch(url);
  const data = await response.json();

  // Process the data and display it on the page
  const rows = data.values;
  const table = document.createElement("table");
  table.id = "team-ranking-table"; // add an id to the table
  table.classList.add("table-responsive-md");
  const headerRow = document.createElement("tr");

  // Add the column headers to the table
  for (let i = 0; i < rows[0].length; i++) {
    const headerCell = document.createElement("th");
    headerCell.textContent = rows[0][i];
    headerCell.style.border = "1px solid black";
    headerCell.style.padding = "10px";
    headerCell.style.width = "auto";
    headerCell.classList.add("text-center");
    headerRow.appendChild(headerCell);
  }
  table.appendChild(headerRow);

  // Add the team ranking data to the table
  for (let i = 1; i < rows.length; i++) {
    const dataRow = document.createElement("tr");

    for (let j = 0; j < rows[i].length; j++) {
      const dataCell = document.createElement("td");
      dataCell.textContent = rows[i][j];
      // Apply border, margin, and width styles to the cell
      dataCell.style.border = "1px solid black";
      dataCell.style.padding = "10px";
      dataCell.style.width = "auto";
      if (i >= 11) {
        if (j == 0) {
          dataCell.colSpan = "8";
          dataCell.classList.add("text-left");
        } else {
          continue; // skip creating the remaining td elements in the row
        }
      } else {
        dataCell.classList.add("text-center");
      }
      dataRow.appendChild(dataCell);
    }
    table.appendChild(dataRow);
  }

  // Add the table to the page
  const teamRankingSection = document.getElementById("team-ranking");
  teamRankingSection.innerHTML = "";
  teamRankingSection.appendChild(table);

  spinLoading.style.display = "none"; // show loading spinner
}

// Function to fetch the STL S11 schedule data from the Google Sheet and display it on the page
async function getScheduleData() {
  const spinLoading = document.getElementById("loading-schedule");
  spinLoading.style.display = "block"; // show loading spinner

  await getDriveFiles(googleDriveFolderId);

  const apiKey = GoogleConfig.apiKey;
  const sheetId = GoogleConfig.sheetId_data;
  const sheetName = "S11일정";

  const url =
    "https://sheets.googleapis.com/v4/spreadsheets/" +
    sheetId +
    "/values/" +
    sheetName +
    "!A1:P117?key=" +
    apiKey;
  const response = await fetch(url);
  const data = await response.json();

  // Process the data and display it on the page
  const rows = data.values;
  const scheduleSection = document.getElementById("schedule");

  // Clear the existing schedule data
  scheduleSection.innerHTML = "";

  // Loop through the rows and create a table for the data
  const table = document.createElement("table");
  table.id = "schedule-table";
  table.classList.add("table-responsive-md");

  // Add the schedule data to the table
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let todayMatch = "";

  for (let i = 0; i < rows.length; i++) {
    const dataRow = document.createElement("tr");
    for (let j = 0; j < rows[i].length; j++) {
      const dataCell = document.createElement("td");
      if (j === 3 && rows[i][3] && rows[i][4] && rows[i][5]) {
        const fileId = await getGameImageFileId(rows[i][0]);
        if (fileId) {
          const gameLink = document.createElement("a");
          gameLink.textContent = `${rows[i][3]} : ${rows[i][5]}`;
          gameLink.href = "#";
          gameLink.addEventListener("click", () => {
            const modal = document.getElementById("gameImageModal");
            modal.querySelector(
              ".modal-title",
            ).textContent = `${rows[i][2]} ${rows[i][3]} : ${rows[i][5]} ${rows[i][6]}`;
            const modalLoading = modal.querySelector(".modal-body .loading");
            modalLoading.style.display = "block"; // show loading spinner
            const modalImg = modal.querySelector(".modal-body img");
            getGameImageFileId(rows[i][0]).then((fileId) => {
              modalImg.src = `https://drive.google.com/uc?id=${fileId}&export=view`;
              modalImg.onload = () => {
                modalLoading.style.display = "none"; // hide loading spinner when image is loaded
              };
            });
            const modalDialog = new bootstrap.Modal(modal);
            modalDialog.show();
          });
          dataCell.appendChild(gameLink);
        } else {
          const text = `${rows[i][3]} : ${rows[i][5]}`;
          dataCell.textContent = text;
          dataCell.style.cursor = "default";
          dataCell.style.color = "black";
        }

        j += 2; // skip creating two new cells
      } else if (j === 3) {
        dataCell.textContent = "vs";
        j += 2;
      } else {
        dataCell.textContent = rows[i][j];
      }

      dataRow.appendChild(dataCell);
      dataCell.style.border = "1px solid black";
      dataCell.style.padding = "auto";
      dataCell.style.width = "auto";
      dataCell.classList.add("text-center");
    }
    if (Number(rows[i][3]) === 4) {
      dataRow.children[2].classList.add("text-danger");
    }
    if (Number(rows[i][5]) === 4) {
      dataRow.children[4].classList.add("text-danger");
    }

    if (rows[i][0] === today) {
      dataRow.classList.add("highlighted");
      todayMatch = `<strong>Today's Match</strong> - ${rows[i][0]}(${rows[i][1]}) <br> <span class="match-highlight">${rows[i][2]} vs ${rows[i][6]}</span> <br> (중계: ${rows[i][7]}, 엔트리제출: ${rows[i][8]})`;
    }
    if (rows[i][0].includes("날짜")) {
      dataRow.classList.add("grey-background");
    }
    table.appendChild(dataRow);
  }

  // Add the table to the page
  scheduleSection.appendChild(table);

  // Add today's match to the page
  const todayMatchSection = document.getElementById("today-match");
  todayMatchSection.innerHTML = "";
  if (todayMatch) {
    todayMatchSection.innerHTML = todayMatch;
    todayMatchSection.classList.add("today-match");
  } else {
    todayMatchSection.innerHTML = "No matches today.";
    todayMatchSection.classList.add("today-match");
  }

  spinLoading.style.display = "none"; // not show loading spinner
}

getTeamRankingData();
getScheduleData();

// JavaScript code
const teamSelect = document.getElementById("team-select-button");
const dropdownItems = document.querySelectorAll(".dropdown-item");

// Add event listeners to dropdown items
dropdownItems.forEach((item) => {
  item.addEventListener("click", () => {
    // Update the button label with the selected team name
    teamSelect.innerHTML = item.innerHTML;
    // Get the selected team value from the data-value attribute
    const selectedTeam = item.getAttribute("data-value");
    // Call showTeamSchedule with the selected team value
    showTeamSchedule(selectedTeam);
  });
});

async function showTeamSchedule(selectedTeam) {
  const scheduleSection = document.getElementById("team_schedule");

  scheduleSection.innerHTML = "";

  const spinLoading = document.getElementById("loading-team-schedule");
  spinLoading.style.display = "block"; // show loading spinner

  await getDriveFiles(googleDriveFolderId);

  const apiKey = GoogleConfig.apiKey;
  const sheetId = GoogleConfig.sheetId_data;
  const sheetName = "S11일정";

  const url =
    "https://sheets.googleapis.com/v4/spreadsheets/" +
    sheetId +
    "/values/" +
    sheetName +
    "!A1:P120?key=" +
    apiKey;
  const response = await fetch(url);
  const data = await response.json();

  // Process the data and display it on the page
  const rows = data.values;

  // Clear the existing schedule data
  scheduleSection.innerHTML = "";

  // Loop through the rows and create a table for the data
  const table = document.createElement("table");
  table.id = "schedule-table";
  table.classList.add("table-responsive-md");

  // Add the schedule data to the table
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let todayMatch = "";

  for (let i = 0; i < rows.length; i++) {
    if (
      i == 0 ||
      rows[i][2].includes(selectedTeam) ||
      rows[i][6].includes(selectedTeam)
    ) {
      const dataRow = document.createElement("tr");

      // Add a CSS class to the row element based on the score
      if (rows[i][2].includes(selectedTeam)) {
        if (Number(rows[i][3]) === 4) {
          // Team wins
          dataRow.classList.add("team-win");
        } else if (Number(rows[i][5]) === 4) {
          // Opponent wins
          dataRow.classList.add("team-loss");
        }
      } else {
        if (Number(rows[i][5]) === 4) {
          // Team wins
          dataRow.classList.add("team-win");
        } else if (Number(rows[i][3]) === 4) {
          // Opponent wins
          dataRow.classList.add("team-loss");
        }
      }

      for (let j = 0; j < rows[i].length; j++) {
        const dataCell = document.createElement("td");
        if (j === 3 && rows[i][3] && rows[i][4] && rows[i][5]) {
          const fileId = await getGameImageFileId(rows[i][0]);
          if (fileId) {
            const gameLink = document.createElement("a");
            gameLink.textContent = `${rows[i][3]} : ${rows[i][5]}`;
            gameLink.href = "#";
            gameLink.addEventListener("click", () => {
              const modal = document.getElementById("gameImageModal");
              modal.querySelector(
                ".modal-title",
              ).textContent = `${rows[i][2]} ${rows[i][3]} : ${rows[i][5]} ${rows[i][6]}`;
              const modalLoading = modal.querySelector(".modal-body .loading");
              modalLoading.style.display = "block"; // show loading spinner
              const modalImg = modal.querySelector(".modal-body img");
              getGameImageFileId(rows[i][0]).then((fileId) => {
                modalImg.src = `https://drive.google.com/uc?id=${fileId}&export=view`;
                modalImg.onload = () => {
                  modalLoading.style.display = "none"; // hide loading spinner when image is loaded
                };
              });
              const modalDialog = new bootstrap.Modal(modal);
              modalDialog.show();
            });
            dataCell.appendChild(gameLink);
          } else {
            const text = `${rows[i][3]} : ${rows[i][5]}`;
            dataCell.textContent = text;
            dataCell.style.cursor = "default";
            dataCell.style.color = "black";
          }

          j += 2; // skip creating two new cells
        } else if (j === 3) {
          dataCell.textContent = "vs";
          j += 2;
        } else {
          dataCell.textContent = rows[i][j];
        }

        dataRow.appendChild(dataCell);
        dataCell.style.border = "1px solid black";
        dataCell.style.padding = "auto";
        dataCell.style.width = "auto";
        dataCell.classList.add("text-center");
      }
      if (Number(rows[i][3]) === 4) {
        dataRow.children[2].classList.add("text-danger");
      }
      if (Number(rows[i][5]) === 4) {
        dataRow.children[4].classList.add("text-danger");
      }

      if (rows[i][0] === today) {
        dataRow.classList.add("highlighted");
        todayMatch = `<strong>Today's Match</strong> - ${rows[i][0]}(${rows[i][1]}) <br> <span class="match-highlight">${rows[i][2]} vs ${rows[i][6]}</span> <br> (중계: ${rows[i][7]}, 엔트리제출: ${rows[i][8]})`;
      }
      if (rows[i][0].includes("날짜")) {
        dataRow.classList.add("grey-background");
      }
      table.appendChild(dataRow);
    }
  }

  // Add the table to the page
  scheduleSection.appendChild(table);

  spinLoading.style.display = "none"; // not show loading spinner
}

// const scoreCells = document.querySelectorAll('.score-cell');
// scoreCells.forEach(scoreCell => {
//     scoreCell.addEventListener('click', () => {
//         const [i, j] = scoreCell.getAttribute('id').split('-').slice(1);
//         const rateDate = rows[i][0].replace(/ /g, '').replace(/년|월/g, '_').replace(/일/g, '');
//         const rateImageUrl = `https://drive.google.com/uc?export=view&id=[FILE_ID]&timestamp=${new Date().getTime()}`;
//         const rateImageId = `[FILE_ID]`; // replace with the ID of the rate image file in Google Drive
//         if (rows[i][j] && rateImageId) {
//             const modalBody = document.querySelector('#rateModal .modal-body');
//             modalBody.innerHTML = `<img src="${rateImageUrl.replace('[FILE_ID]', rateImageId)}">`;
//             const modalTitle = document.querySelector('#rateModalLabel');
//             modalTitle.innerHTML = `Rate for ${rows[i][2]} vs ${rows[i][6]} (${rows[i][0]})`;
//             $('#rateModal').modal('show');
//         }
//     });
// });

function displayData(gameResults, tableName) {
  const tableBody = document.getElementById(tableName);
  tableBody.innerHTML = "";

  gameResults.forEach((result) => {
    const row = document.createElement("tr");

    Object.values(result).forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

function displayStatistics(gameResults, tableName, keyword) {
  const playerThis = playerInfoGlobal.filter(
    (result) => result.ID.toLowerCase() === keyword,
  );
  if (playerThis.length === 0) {
    console.error("Player not found.");
    return;
  }

  let silWins = 0;
  let silRunnerUps = 0;
  let stlWins = 0;

  if (playerThis[0].SILWin && playerThis[0].SILWin.trim() !== "") {
    silWins = (playerThis[0].SILWin.match(/우승/g) || []).length;
    silRunnerUps = (playerThis[0].SILWin.match(/준우승/g) || []).length;
  }

  if (playerThis[0].STLWin && playerThis[0].STLWin.trim() !== "") {
    stlWins = (playerThis[0].STLWin.match(/우승/g) || []).length;
  }

  const trophiesHtml = Array(stlWins)
    .fill('<img class="trophy" src="trophy.png" title="STL 우승">')
    .join("");
  const goldMedalsHtml = Array(silWins - silRunnerUps)
    .fill(
      `<img class="medal" src="gold-medal.png" title="${playerThis[0].SILWin}">`,
    )
    .join("");
  const silverMedalsHtml = Array(silRunnerUps)
    .fill(
      `<img class="medal" src="silver-medal.png" title="${playerThis[0].SILWin}">`,
    )
    .join("");

  const playerGames = gameResults.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword ||
      result.LoserID.toLowerCase() === keyword,
  );
  const totalGames = playerGames.length;
  const totalWins = playerGames.filter(
    (result) => result.WinnerID.toLowerCase() === keyword,
  ).length;
  const totalLoses = playerGames.length - totalWins;

  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const terranWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserRace.toLowerCase() === "t",
  ).length;
  const protossWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserRace.toLowerCase() === "p",
  ).length;
  const zergWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserRace.toLowerCase() === "z",
  ).length;
  const terranLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerRace.toLowerCase() === "t",
  ).length;
  const protossLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerRace.toLowerCase() === "p",
  ).length;
  const zergLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerRace.toLowerCase() === "z",
  ).length;
  const terranRate =
    terranWins + terranLoses > 0
      ? (terranWins / (terranWins + terranLoses)) * 100
      : 0;
  const protossRate =
    protossWins + protossLoses > 0
      ? (protossWins / (protossWins + protossLoses)) * 100
      : 0;
  const zergRate =
    zergWins + zergLoses > 0 ? (zergWins / (zergWins + zergLoses)) * 100 : 0;

  const playTerranWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerRace.toLowerCase() === "t",
  ).length;
  const playProtossWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerRace.toLowerCase() === "p",
  ).length;
  const playZergWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerRace.toLowerCase() === "z",
  ).length;
  const playTerranLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserRace.toLowerCase() === "t",
  ).length;
  const playProtossLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserRace.toLowerCase() === "p",
  ).length;
  const playZergLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserRace.toLowerCase() === "z",
  ).length;
  const playTerranRate =
    playTerranWins + playTerranLoses > 0
      ? (playTerranWins / (playTerranWins + playTerranLoses)) * 100
      : 0;
  const playProtossRate =
    playProtossWins + playProtossLoses > 0
      ? (playProtossWins / (playProtossWins + playProtossLoses)) * 100
      : 0;
  const playZergRate =
    playZergWins + playZergLoses > 0
      ? (playZergWins / (playZergWins + playZergLoses)) * 100
      : 0;

  const HEL1Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "hel1",
  ).length;
  const HEL1Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "hel1",
  ).length;
  const HEL1Rate =
    HEL1Wins + HEL1Loses > 0 ? (HEL1Wins / (HEL1Wins + HEL1Loses)) * 100 : 0;

  const HEL2Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "hel2",
  ).length;
  const HEL2Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "hel2",
  ).length;
  const HEL2Rate =
    HEL2Wins + HEL2Loses > 0 ? (HEL2Wins / (HEL2Wins + HEL2Loses)) * 100 : 0;

  const AELWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "ael",
  ).length;
  const AELLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "ael",
  ).length;
  const AELRate =
    AELWins + AELLoses > 0 ? (AELWins / (AELWins + AELLoses)) * 100 : 0;

  const MELWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "mel",
  ).length;
  const MELLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "mel",
  ).length;
  const MELRate =
    MELWins + MELLoses > 0 ? (MELWins / (MELWins + MELLoses)) * 100 : 0;

  const IELWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "iel",
  ).length;
  const IELLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "iel",
  ).length;
  const IELRate =
    IELWins + IELLoses > 0 ? (IELWins / (IELWins + IELLoses)) * 100 : 0;

  const CEL1Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "cel1",
  ).length;
  const CEL1Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "cel1",
  ).length;
  const CEL1Rate =
    CEL1Wins + CEL1Loses > 0 ? (CEL1Wins / (CEL1Wins + CEL1Loses)) * 100 : 0;

  const CEL2Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "cel2",
  ).length;
  const CEL2Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "cel2",
  ).length;
  const CEL2Rate =
    CEL2Wins + CEL2Loses > 0 ? (CEL2Wins / (CEL2Wins + CEL2Loses)) * 100 : 0;

  const CEL3Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "cel3",
  ).length;
  const CEL3Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "cel3",
  ).length;
  const CEL3Rate =
    CEL3Wins + CEL3Loses > 0 ? (CEL3Wins / (CEL3Wins + CEL3Loses)) * 100 : 0;

  const STLWin = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.leagueTitle.toLowerCase().includes("team league"),
  ).length;
  const STLLose = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.leagueTitle.toLowerCase().includes("team league"),
  ).length;
  const STLRate =
    STLWin + STLLose > 0 ? (STLWin / (STLWin + STLLose)) * 100 : 0;
  const SILHSTWin = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      (result.leagueTitle.toLowerCase().includes("sil") ||
        result.leagueTitle.toLowerCase().includes("hst") ||
        result.leagueTitle.toLowerCase().includes("hel0 league") ||
        result.leagueTitle.toLowerCase().includes("hel1 league") ||
        result.leagueTitle.toLowerCase().includes("hel2 league") ||
        result.leagueTitle.toLowerCase().includes("ael league") ||
        result.leagueTitle.toLowerCase().includes("mel league") ||
        result.leagueTitle.toLowerCase().includes("iel league") ||
        result.leagueTitle.toLowerCase().includes("cel1 league") ||
        result.leagueTitle.toLowerCase().includes("cel2 league") ||
        result.leagueTitle.toLowerCase().includes("cel3 league")),
  ).length;
  const SILHSTLose = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      (result.leagueTitle.toLowerCase().includes("sil") ||
        result.leagueTitle.toLowerCase().includes("hst") ||
        result.leagueTitle.toLowerCase().includes("hel0 league") ||
        result.leagueTitle.toLowerCase().includes("hel1 league") ||
        result.leagueTitle.toLowerCase().includes("hel2 league") ||
        result.leagueTitle.toLowerCase().includes("ael league") ||
        result.leagueTitle.toLowerCase().includes("mel league") ||
        result.leagueTitle.toLowerCase().includes("iel league") ||
        result.leagueTitle.toLowerCase().includes("cel1 league") ||
        result.leagueTitle.toLowerCase().includes("cel2 league") ||
        result.leagueTitle.toLowerCase().includes("cel3 league")),
  ).length;
  const SILHSTRate =
    SILHSTWin + SILHSTLose > 0
      ? (SILHSTWin / (SILHSTWin + SILHSTLose)) * 100
      : 0;
  const HMEventWin = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      (result.leagueTitle.toLowerCase().includes("청정수리그") ||
        result.leagueTitle.toLowerCase().includes("kaleague") ||
        result.leagueTitle.toLowerCase().includes("연승전") ||
        result.leagueTitle.toLowerCase().includes("포워드")),
  ).length;
  const HMEventLose = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      (result.leagueTitle.toLowerCase().includes("청정수리그") ||
        result.leagueTitle.toLowerCase().includes("kaleague") ||
        result.leagueTitle.toLowerCase().includes("연승전") ||
        result.leagueTitle.toLowerCase().includes("포워드")),
  ).length;
  const HMEventRate =
    HMEventWin + HMEventLose > 0
      ? (HMEventWin / (HMEventWin + HMEventLose)) * 100
      : 0;
  const ClanWin = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      (result.leagueTitle.toLowerCase().includes("kpl") ||
        result.leagueTitle.toLowerCase().includes("wpl") ||
        result.leagueTitle.toLowerCase().includes("tpl") ||
        result.leagueTitle.toLowerCase().includes("we clan") ||
        result.leagueTitle.toLowerCase().includes("프로리그")),
  ).length;
  const ClanLose = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      (result.leagueTitle.toLowerCase().includes("kpl") ||
        result.leagueTitle.toLowerCase().includes("wpl") ||
        result.leagueTitle.toLowerCase().includes("tpl") ||
        result.leagueTitle.toLowerCase().includes("we clan") ||
        result.leagueTitle.toLowerCase().includes("프로리그")),
  ).length;
  const ClanRate =
    ClanWin + ClanLose > 0 ? (ClanWin / (ClanWin + ClanLose)) * 100 : 0;

  const vsHEL1Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "hel1",
  ).length;
  const vsHEL1Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "hel1",
  ).length;
  const vsHEL1Rate =
    vsHEL1Wins + vsHEL1Loses > 0
      ? (vsHEL1Wins / (vsHEL1Wins + vsHEL1Loses)) * 100
      : 0;

  const vsHEL2Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "hel2",
  ).length;
  const vsHEL2Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "hel2",
  ).length;
  const vsHEL2Rate =
    vsHEL2Wins + vsHEL2Loses > 0
      ? (vsHEL2Wins / (vsHEL2Wins + vsHEL2Loses)) * 100
      : 0;

  const vsAELWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "ael",
  ).length;
  const vsAELLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "ael",
  ).length;
  const vsAELRate =
    vsAELWins + vsAELLoses > 0
      ? (vsAELWins / (vsAELWins + vsAELLoses)) * 100
      : 0;

  const vsMELWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "mel",
  ).length;
  const vsMELLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "mel",
  ).length;
  const vsMELRate =
    vsMELWins + vsMELLoses > 0
      ? (vsMELWins / (vsMELWins + vsMELLoses)) * 100
      : 0;

  const vsIELWins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "iel",
  ).length;
  const vsIELLoses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "iel",
  ).length;
  const vsIELRate =
    vsIELWins + vsIELLoses > 0
      ? (vsIELWins / (vsIELWins + vsIELLoses)) * 100
      : 0;

  const vsCEL1Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "cel1",
  ).length;
  const vsCEL1Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "cel1",
  ).length;
  const vsCEL1Rate =
    vsCEL1Wins + vsCEL1Loses > 0
      ? (vsCEL1Wins / (vsCEL1Wins + vsCEL1Loses)) * 100
      : 0;

  const vsCEL2Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "cel2",
  ).length;
  const vsCEL2Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "cel2",
  ).length;
  const vsCEL2Rate =
    vsCEL2Wins + vsCEL2Loses > 0
      ? (vsCEL2Wins / (vsCEL2Wins + vsCEL2Loses)) * 100
      : 0;

  const vsCEL3Wins = playerGames.filter(
    (result) =>
      result.WinnerID.toLowerCase() === keyword &&
      result.LoserTier.toLowerCase() === "cel3",
  ).length;
  const vsCEL3Loses = playerGames.filter(
    (result) =>
      result.LoserID.toLowerCase() === keyword &&
      result.WinnerTier.toLowerCase() === "cel3",
  ).length;
  const vsCEL3Rate =
    vsCEL3Wins + vsCEL3Loses > 0
      ? (vsCEL3Wins / (vsCEL3Wins + vsCEL3Loses)) * 100
      : 0;

  const statsTable = document.getElementById(tableName);
  if (statsTable !== null) {
    statsTable.innerHTML = `
        <tbody>
            <tr>
                <td colspan="2">
                    <div id="player-info" class="container text-center">
                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="table-container">
                        <div class="table-responsive">
                            <table id="left-stats-table" class="stats-table">
                                <tbody>
                                    <tr>
                                        <td colspan="2" style="text-align: center;" class="subtitle-stats"> 전체 전적  </td>
                                    </tr>   
                                    <tr>
                                        <td colspan="2" style="text-align: center;" >
                                        ${totalWins}승 ${totalLoses}패
                                        ${
                                          totalWins + totalLoses > 0
                                            ? `<span class="win-rate">(승률 ${winRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr>
                                    <tr>
                                    <td colspan="2" style="text-align: center;" class="subtitle-stats"> 본인 종족별 전적  </td>
                                    </tr>  
                                    <tr>
                                        <td style="text-align: center;">Terran</td>
                                        <td>
                                        ${playTerranWins}승 ${playTerranLoses}패
                                        ${
                                          playTerranWins + playTerranLoses > 0
                                            ? `<span class="win-rate">(승률 ${playTerranRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">Protoss</td>
                                        <td>
                                        ${playProtossWins}승 ${playProtossLoses}패
                                        ${
                                          playProtossWins + playProtossLoses > 0
                                            ? `<span class="win-rate">(승률 ${playProtossRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">Zerg</td>
                                        <td>${playZergWins}승 ${playZergLoses}패
                                        ${
                                          playZergWins + playZergLoses > 0
                                            ? `<span class="win-rate">(승률 ${playZergRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr> 
                                    <tr>
                                        <td colspan="2" style="text-align: center;" class="subtitle-stats"> 상대 종족별 전적  </td>
                                    </tr>                           
                                    <tr>
                                        <td style="text-align: center;">vs Terran</td>
                                        <td>${terranWins}승 ${terranLoses}패
                                        ${
                                          terranWins + terranLoses > 0
                                            ? `<span class="win-rate">(승률 ${terranRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">vs Protoss</td>
                                        <td>${protossWins}승 ${protossLoses}패
                                        ${
                                          protossWins + protossLoses > 0
                                            ? `<span class="win-rate">(승률 ${protossRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">vs Zerg</td>
                                        <td>${zergWins}승 ${zergLoses}패
                                        ${
                                          zergWins + zergLoses > 0
                                            ? `<span class="win-rate">(승률 ${zergRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="table-responsive">
                            <table id="right-stats-table" class="stats-table">
                                <tbody>
                                    <tr>
                                        <td colspan="3" style="text-align: center;" class="subtitle-stats">리그별 전적  </td>
                                    </tr>       
                                    <tr>
                                        <th style="text-align: center;"> 리그 </th>
                                        <th colspan="2" style="text-align: center;"> 리그성적 </th>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹 팀리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${STLWin}승 ${STLLose}패
                                        ${
                                          STLWin + STLLose > 0
                                            ? `<span class="win-rate">(승률 ${STLRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹 개인리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${SILHSTWin}승 ${SILHSTLose}패
                                        ${
                                          SILHSTWin + SILHSTLose > 0
                                            ? `<span class="win-rate">(승률 ${SILHSTRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹 이벤트리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${HMEventWin}승 ${HMEventLose}패
                                        ${
                                          HMEventWin + HMEventLose > 0
                                            ? `<span class="win-rate">(승률 ${HMEventRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹외 리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${ClanWin}승 ${ClanLose}패
                                        ${
                                          ClanWin + ClanLose > 0
                                            ? `<span class="win-rate">(승률 ${ClanRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>

                                    <tr>
                                        <td colspan="3" style="text-align: center;" class="subtitle-stats">티어별 전적 </td>
                                    </tr>   
                                    <tr>
                                        <th class="text-center no-wrap">티어</th>
                                        <th class="text-center no-wrap">본인 티어</th>
                                        <th class="text-center no-wrap">상대 티어</th>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">HEL1 </td>
                                        <td style="text-align: center;"> ${HEL1Wins}승 ${HEL1Loses}패
                                        ${
                                          HEL1Wins + HEL1Loses > 0
                                            ? `<span class="win-rate">(승률 ${HEL1Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsHEL1Wins}승 ${vsHEL1Loses}패
                                        ${
                                          vsHEL1Wins + vsHEL1Loses > 0
                                            ? `<span class="win-rate">(승률 ${vsHEL1Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">HEL2 </td>
                                        <td style="text-align: center;"> ${HEL2Wins}승 ${HEL2Loses}패
                                        ${
                                          HEL2Wins + HEL2Loses > 0
                                            ? `<span class="win-rate">(승률 ${HEL2Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsHEL2Wins}승 ${vsHEL2Loses}패
                                        ${
                                          vsHEL2Wins + vsHEL2Loses > 0
                                            ? `<span class="win-rate">(승률 ${vsHEL2Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">AEL </td>
                                        <td style="text-align: center;"> ${AELWins}승 ${AELLoses}패
                                        ${
                                          AELWins + AELLoses > 0
                                            ? `<span class="win-rate">(승률 ${AELRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsAELWins}승 ${vsAELLoses}패
                                        ${
                                          vsAELWins + vsAELLoses > 0
                                            ? `<span class="win-rate">(승률 ${vsAELRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">MEL </td>
                                        <td style="text-align: center;"> ${MELWins}승 ${MELLoses}패
                                        ${
                                          MELWins + MELLoses > 0
                                            ? `<span class="win-rate">(승률 ${MELRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsMELWins}승 ${vsMELLoses}패
                                        ${
                                          vsMELWins + vsMELLoses > 0
                                            ? `<span class="win-rate">(승률 ${vsMELRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">IEL </td>
                                        <td style="text-align: center;"> ${IELWins}승 ${IELLoses}패
                                        ${
                                          IELWins + IELLoses > 0
                                            ? `<span class="win-rate">(승률 ${IELRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsIELWins}승 ${vsIELLoses}패
                                        ${
                                          vsIELWins + vsIELLoses > 0
                                            ? `<span class="win-rate">(승률 ${vsIELRate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">CEL1 </td>
                                        <td style="text-align: center;"> ${CEL1Wins}승 ${CEL1Loses}패
                                        ${
                                          CEL1Wins + CEL1Loses > 0
                                            ? `<span class="win-rate">(승률 ${CEL1Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsCEL1Wins}승 ${vsCEL1Loses}패
                                        ${
                                          vsCEL1Wins + vsCEL1Loses > 0
                                            ? `<span class="win-rate">(승률 ${vsCEL1Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">CEL2 </td>
                                        <td style="text-align: center;"> ${CEL2Wins}승 ${CEL2Loses}패
                                        ${
                                          CEL2Wins + CEL2Loses > 0
                                            ? `<span class="win-rate">(승률 ${CEL2Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsCEL2Wins}승 ${vsCEL2Loses}패
                                        ${
                                          vsCEL2Wins + vsCEL2Loses > 0
                                            ? `<span class="win-rate">(승률 ${vsCEL2Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">CEL3 </td>
                                        <td style="text-align: center;"> ${CEL3Wins}승 ${CEL3Loses}패
                                        ${
                                          CEL3Wins + CEL3Loses > 0
                                            ? `<span class="win-rate">(승률 ${CEL3Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                        <td style="text-align: center;"> ${vsCEL3Wins}승 ${vsCEL3Loses}패
                                        ${
                                          vsCEL3Wins + vsCEL3Loses > 0
                                            ? `<span class="win-rate">(승률 ${vsCEL3Rate.toFixed(
                                                2,
                                              )}%</span>)`
                                            : ""
                                        }</td>
                                    </tr>  
                                    <!-- Add tier records here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </tbody>
        `;
  }

  const playerInfoDiv = document.getElementById("player-info");
  playerInfoDiv.innerHTML = `
        <h2 id="player-id">${playerThis[0].ID}</h2>
        <h4 id="player-race">${playerThis[0].Team} / ${playerThis[0].Tier} / ${playerThis[0].Race}</h3>
        <div id="trophies">${trophiesHtml}</div>
        <div id="medals">
            ${goldMedalsHtml}
            ${silverMedalsHtml}
        </div>
    `;

  // Add event listener to the player-info div to show/hide the tooltip
  playerInfoDiv.addEventListener("mouseover", (event) => {
    const tooltipText = event.target.getAttribute("title");
    if (tooltipText) {
      showTooltip(event.pageX, event.pageY, tooltipText);
    }
  });
  playerInfoDiv.addEventListener("mouseout", () => {
    hideTooltip();
  });

  // Add event listeners to the trophy and medal images to show/hide the tooltip
  const trophyImages = document.querySelectorAll(".trophy");
  trophyImages.forEach((trophyImage) => {
    trophyImage.addEventListener("mouseover", (event) => {
      const tooltipText = event.target.getAttribute("title");
      if (tooltipText) {
        showTooltip(event.pageX, event.pageY, tooltipText);
      }
    });
    trophyImage.addEventListener("mouseout", () => {
      hideTooltip();
    });
  });

  const medalImages = document.querySelectorAll(".medal");
  medalImages.forEach((medalImage) => {
    medalImage.addEventListener("mouseover", (event) => {
      const tooltipText = event.target.getAttribute("title");
      if (tooltipText) {
        showTooltip(event.pageX, event.pageY, tooltipText);
      }
    });
    medalImage.addEventListener("mouseout", () => {
      hideTooltip();
    });
  });

  // Show and hide the tooltip
  function showTooltip(x, y, text) {
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left, top;

    if (x + tooltipWidth < windowWidth) {
      left = x;
    } else {
      left = x - tooltipWidth;
    }

    if (y + tooltipHeight < windowHeight) {
      top = y;
    } else {
      top = y - tooltipHeight;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    const tooltip = document.querySelector(".tooltip");
    if (tooltip) {
      tooltip.remove();
    }
  }
}

function populatePlayerStatsTable(player, tableName) {
  // Assuming gameResults, tableName, and playerInfoGlobal are available globally
  const keyword = player.toLowerCase();

  const filteredResults = gameResultsGlobal.filter((result) => {
    // Check if both WinnerID and LoserID are defined before attempting to call toLowerCase()
    if (result.WinnerID && result.LoserID) {
      return (
        result.WinnerID.toLowerCase() === keyword ||
        result.LoserID.toLowerCase() === keyword
      );
    } else {
      return false;
    }
  });

  // Call displayStatistics with the provided parameters
  displayStatistics(filteredResults, tableName, keyword);
}

let currentYearFilter = "All";
let currentSortOrder = "desc"; // default sort order

// Event delegation for dropdown
document
  .getElementById("yearDropdownButton")
  .parentNode.addEventListener("click", (event) => {
    if (event.target.matches(".dropdown-item")) {
      event.preventDefault(); // Prevent the default anchor action

      const selectedYear = event.target.textContent;
      currentYearFilter = selectedYear;

      // Update the button text to show the selected year
      document.getElementById("yearDropdownButton").textContent = selectedYear;

      search();
    }
  });

// Event listeners for sorting buttons
document.getElementById("sortDescButton").addEventListener("click", () => {
  currentSortOrder = "desc";
  search();
});

document.getElementById("sortAscButton").addEventListener("click", () => {
  currentSortOrder = "asc";
  search();
});

function search() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  //   const includeOldData = document.getElementById("includeDataCheckbox").checked;

  //   const checkbox1 = document.querySelector("#includeDataCheckbox");
  //   const checkbox2 = document.querySelector("#includeDataCheckbox2");

  //   checkbox2.checked = checkbox1.checked;
  //   localStorage.setItem("includeOldData", checkbox1.checked);
  //   const includeOldDataLabel = document.getElementById("playerButtonText");
  //   if (checkbox1.checked) {
  //     includeOldDataLabel.textContent = "2021.3.1 이전 데이터도 포함";
  //   } else {
  //     includeOldDataLabel.textContent = "2021.3.1 이후 데이터만 포함";
  //   }

  // Show the loading spinner, hide the button text, and disable the button
  document.getElementById("buttonSpinner").classList.remove("d-none");
  document.getElementById("buttonText").classList.add("d-none");
  document.getElementById("searchButton").disabled = true;

  fetchGoogleSheetData()
    .then((gameResults) => {
      let filteredResults = filterByKeyword(gameResults, keyword);
      filteredResults = filterAndSortData(filteredResults);

      displayData(filteredResults, "rankingTableBody");
      displayStatistics(filteredResults, "statsTable", keyword);
      document.getElementById("statsTable").style.display = "table";

      // Hide the loading spinner, show the button text, and enable the button
      document.getElementById("buttonSpinner").classList.add("d-none");
      document.getElementById("buttonText").classList.remove("d-none");
      document.getElementById("searchButton").disabled = false;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);

      // Hide the loading spinner, show the button text, and enable the button
      document.getElementById("buttonSpinner").classList.add("d-none");
      document.getElementById("buttonText").classList.remove("d-none");
      document.getElementById("searchButton").disabled = false;
    });
}

function filterByKeyword(gameResults, keyword) {
  if (keyword !== "") {
    return gameResults.filter((result) => {
      return (
        result.WinnerID.toLowerCase() === keyword ||
        result.LoserID.toLowerCase() === keyword
      );
    });
  } else {
    return gameResults;
  }
}

function filterAndSortData(gameResults) {
  // Filter by year if a specific year is chosen
  if (currentYearFilter !== "All") {
    gameResults = gameResults.filter((result) => {
      const year = result.date.split(".")[0];
      return year === currentYearFilter;
    });
  }

  // Sort by date
  gameResults.sort((a, b) => {
    const dateA = convertToDate(a.date);
    const dateB = convertToDate(b.date);
    return currentSortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  return gameResults;
}

function convertToDate(dateStr) {
  // Converts date from "YYYY.MM.DD" to "YYYY/MM/DD" format
  const formattedDate = dateStr.replace(/\./g, "/");
  return new Date(formattedDate);
}

function searchTwo() {
  const keyword1 = document.getElementById("searchInput1").value.toLowerCase();
  const keyword2 = document.getElementById("searchInput2").value.toLowerCase();

  //   const includeOldData = document.getElementById(
  //     "includeDataCheckbox2",
  //   ).checked;
  //   const checkbox1 = document.querySelector("#includeDataCheckbox");
  //   const checkbox2 = document.querySelector("#includeDataCheckbox2");

  //   checkbox1.checked = checkbox2.checked;
  //   localStorage.setItem("includeOldData", checkbox2.checked);
  //   const includeOldDataLabel = document.getElementById("playerButtonText");
  //   if (checkbox2.checked) {
  //     includeOldDataLabel.textContent = "2021.3.1 이전 데이터도 포함";
  //   } else {
  //     includeOldDataLabel.textContent = "2021.3.1 이후 데이터만 포함";
  //   }
  if (keyword1 !== "" && keyword2 !== "") {
    // Show the loading spinner, hide the button text, and disable the button
    document.getElementById("buttonSpinner2").classList.remove("d-none");
    document.getElementById("buttonText2").classList.add("d-none");
    document.getElementById("searchButton2").disabled = true;

    fetchGoogleSheetData()
      .then((gameResults) => {
        const filteredResults = gameResults.filter((result) => {
          return (
            (result.WinnerID.toLowerCase() === keyword1 &&
              result.LoserID.toLowerCase() === keyword2) ||
            (result.LoserID.toLowerCase() === keyword1 &&
              result.WinnerID.toLowerCase() === keyword2)
          );
        });

        displayData(filteredResults, "rankingTableBody2");
        displayStatistics(filteredResults, "statsTable2", keyword1);
        document.getElementById("statsTable2").style.display = "table";

        // Hide the loading spinner, show the button text, and enable the button
        document.getElementById("buttonSpinner2").classList.add("d-none");
        document.getElementById("buttonText2").classList.remove("d-none");
        document.getElementById("searchButton2").disabled = false;
      })
      .catch((error) => {
        console.error("Error fetching data:", error);

        // Hide the loading spinner, show the button text, and enable the button
        document.getElementById("buttonSpinner2").classList.add("d-none");
        document.getElementById("buttonText2").classList.remove("d-none");
        document.getElementById("searchButton2").disabled = false;
      });
  }
}

// function updateData() {
//     // Show the loading spinner, hide the button text, and disable the button
//     document.getElementById('updateButtonSpinner').classList.remove('d-none');
//     document.getElementById('updateButtonText').classList.add('d-none');
//     document.getElementById('updateButton').disabled = true;

//     fetchGoogleSheetData()
//         .then(gameResults => {
//             displayData(gameResults, 'rankingTableBody');
//             document.getElementById('statsTable').style.display = 'none';

//             // Hide the loading spinner, show the button text, and enable the button
//             document.getElementById('updateButtonSpinner').classList.add('d-none');
//             document.getElementById('updateButtonText').classList.remove('d-none');
//             document.getElementById('updateButton').disabled = false;
//         })
//         .catch(error => {
//             console.error('Error fetching data:', error);

//             // Hide the loading spinner, show the button text, and enable the button
//             document.getElementById('updateButtonSpinner').classList.add('d-none');
//             document.getElementById('updateButtonText').classList.remove('d-none');
//             document.getElementById('updateButton').disabled = false;
//         });
// }

document.getElementById("searchButton").addEventListener("click", search);
document.getElementById("searchButton2").addEventListener("click", searchTwo);

document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("searchButton").click();
    }
  });

document
  .getElementById("searchInput1")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("searchButton2").click();
    }
  });

document
  .getElementById("searchInput2")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("searchButton2").click();
    }
  });

// // Load all game results on page load
// fetchGoogleSheetData().then(gameResults => {
//     displayData(gameResults);
// });

// Load all player info on page load
// Load playerInfo and make it available to the rest of the app with global variable
fetchPlayerData().then((playerInfo) => {
  playerInfoGlobal = playerInfo;
  // console.log(playerInfoGlobal)
});

function populatePlayerListTable(playerResults) {
  const tableBody = document.getElementById("playerListTableBody");
  tableBody.innerHTML = "";

  for (const player of playerResults) {
    if (player.Team) {
      const row = tableBody.insertRow();
      row.insertCell().textContent = player.Team;
      row.insertCell().textContent = player.Tier;

      // Add an event listener for the click event on the player ID cell
      const idCell = row.insertCell();
      idCell.textContent = player.ID;
      idCell.innerHTML = `${player.ID} ${(() => {
        let wins = 0;
        let runnerUps = 0;

        if (player.SILWin && player.SILWin.trim() !== "") {
          wins = (player.SILWin.match(/우승/g) || []).length;
          runnerUps = (player.SILWin.match(/준우승/g) || []).length;
        }

        let stars = "";
        for (let i = 0; i < wins - runnerUps; i++) {
          stars += '<i class="fas fa-star" style="color: gold;"></i>';
        }

        for (let i = 0; i < runnerUps; i++) {
          stars += '<i class="fas fa-star" style="color: silver;"></i>';
        }

        return stars;
      })()}`;
      idCell.style.cursor = "pointer";
      idCell.addEventListener("click", () => {
        displayPlayerStatsModal(player.ID.toLowerCase());
      });

      row.insertCell().textContent = player.Race;
      row.insertCell().textContent = parseInt(player.NumSTL);
      row.insertCell().textContent = parseInt(player.NumSTLWin);
      row.insertCell().textContent = parseInt(player.NumSTLLose);
      row.insertCell().textContent = parseInt(player.NumSILWin);
      row.insertCell().textContent = parseInt(player.NumSILLose);
      row.insertCell().textContent = parseInt(player.NumTotalWin);
      row.insertCell().textContent = parseInt(player.NumTotalLose);
    }
  }
}

function displayPlayerStatsModal(player) {
  // Call your function to populate the player stats table here
  populatePlayerStatsTable(player, "statsTableModal");

  // Show the modal
  const playerStatsModal = new bootstrap.Modal(
    document.getElementById("playerStatsModal"),
  );
  playerStatsModal.show();
}

// document.querySelectorAll("#playerListTable th").forEach(headerCell => {
//     headerCell.addEventListener("click", () => {
//         const sortBy = headerCell.dataset.sortKey;
//         const sortedData = [...playerResults].sort((a, b) => {
//             if (a[sortBy] < b[sortBy]) return -1;
//             if (a[sortBy] > b[sortBy]) return 1;
//             return 0;
//         });
//         populatePlayerListTable(sortedData);
//     });
// });

let sortAsc = true; // initial sort order is ascending

document.querySelectorAll("#playerListTable th").forEach((headerCell) => {
  headerCell.addEventListener("click", () => {
    const sortBy = headerCell.dataset.sortKey;
    sortAsc = !sortAsc; // toggle the sort order
    const sortedData = [...playerResults].sort((a, b) => {
      const sortMultiplier = sortAsc ? 1 : -1; // set the sort multiplier based on the sort order
      let sortValueA = a[sortBy];
      let sortValueB = b[sortBy];
      if (
        sortBy === "WinRate" ||
        sortBy === "NumSTL" ||
        sortBy === "NumSTLWin" ||
        sortBy === "NumSTLLose" ||
        sortBy === "NumSILWin" ||
        sortBy === "NumSILLose" ||
        sortBy === "NumTotalWin" ||
        sortBy === "NumTotalLose"
      ) {
        // convert WinRate to number if sorting by WinRate
        sortValueA = parseFloat(sortValueA);
        sortValueB = parseFloat(sortValueB);
      }
      if (sortValueA < sortValueB) return -1 * sortMultiplier; // multiply by the sort multiplier to reverse the order if necessary
      if (sortValueA > sortValueB) return 1 * sortMultiplier;
      return 0;
    });
    populatePlayerListTable(sortedData);
  });
});

document
  .getElementById("playerSearchInput")
  .addEventListener("input", function (event) {
    const searchValue = event.target.value.toLowerCase().trim();
    const filteredData = playerResults.filter((player) => {
      return (
        player.Team.toLowerCase().includes(searchValue) ||
        player.Tier.toLowerCase().includes(searchValue) ||
        player.ID.toLowerCase().includes(searchValue) ||
        player.Race.toLowerCase().includes(searchValue)
      );
    });
    populatePlayerListTable(filteredData);
  });

let teamChartInstance, tierChartInstance, raceChartInstance;

function createBarChart(ctx, data, labels) {
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
            "#858796",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
        },
        y: {
          ticks: {
            font: {
              size: (ctx) => {
                const chartWidth = ctx.chart.width;
                return chartWidth <= 480 ? 10 : 12;
              },
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function customTierSort(a, b) {
  const sortOrder = [
    "HEL1",
    "HEL2",
    "AEL",
    "MEL",
    "IEL",
    "CEL1",
    "CEL2",
    "CEL3",
  ];
  return sortOrder.indexOf(a) - sortOrder.indexOf(b);
}

// // get references to the checkboxes
// const checkbox1 = document.querySelector("#includeDataCheckbox");
// const checkbox2 = document.querySelector("#includeDataCheckbox2");
// const includeOldDataLabel = document.getElementById("playerButtonText");

// const storedValue = localStorage.getItem("includeOldData");

// if (storedValue) {
//   checkbox1.checked = storedValue === "true";
//   checkbox2.checked = storedValue === "true";

//   if (storedValue) {
//     includeOldDataLabel.textContent = "2021.3.1 이전 데이터도 포함";
//   } else {
//     includeOldDataLabel.textContent = "2021.3.1 이후 데이터만 포함";
//   }

//   fetchGoogleSheetData(storedValue).then((gameResults) => {
//     gameResultsGlobal = gameResults;
//   });
// } else {
//   fetchGoogleSheetData(false).then((gameResults) => {
//     gameResultsGlobal = gameResults;
//   });
// }

fetchGoogleSheetData(true).then((gameResults) => {
  gameResultsGlobal = gameResults;
});

// Call the functions to fetch and display the data

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const app = firebase.initializeApp(FirebaseConfig);
const analytics = firebase.analytics(app);
const database = firebase.database();

async function updateVisitorCount() {
  const today = new Date().toLocaleDateString();
  const yesterday = new Date(
    new Date().setDate(new Date().getDate() - 1),
  ).toLocaleDateString();

  const totalVisitorsRef = database.ref("totalVisitors");
  const todayVisitorsRef = database.ref(`dailyVisitors/${today}`);

  // Listen for changes in the total visitor count
  totalVisitorsRef.on("value", (snapshot) => {
    const totalVisitors = snapshot.val() || 0;
    document.getElementById("totalVisitors").textContent = totalVisitors;
  });

  // Listen for changes in the today visitor count
  todayVisitorsRef.on("value", (snapshot) => {
    const todayVisitors = snapshot.val() || 0;
    document.getElementById("todayVisitors").textContent = todayVisitors;
  });

  // Update the total visitor count
  totalVisitorsRef.transaction((count) => {
    const newCount = (count || 0) + 1;
    return Number(newCount);
  });

  // Update the today visitor count
  todayVisitorsRef.transaction((count) => {
    const newCount = (count || 0) + 1;
    return Number(newCount);
  });
}

updateVisitorCount();

async function getGameImageFileId(stringFileName) {
  // Get the file ID from the file name in the Google Drive folder
  const fileExtensions = [
    "jpg",
    "png",
    "JPG",
    "PNG",
    "jpeg",
    "JPEG",
    "gif",
    "GIF",
  ];
  const fileNames = fileExtensions.map((ext) => stringFileName + "." + ext);
  const file = driveFiles.find((file) => fileNames.includes(file.name));
  return file ? file.id : "";
}

export { fetchPlayerData, populatePlayerListTable };

// Get all the menu items
const menuItems = document.querySelectorAll(".nav-link");

// Add a click event listener to each menu item
menuItems.forEach((item) => {
  item.addEventListener("click", function () {
    // Remove the "active" class from all the menu items
    menuItems.forEach((item) => {
      item.classList.remove("active");
    });

    // Add the "active" class to the clicked menu item
    this.classList.add("active");
  });
});

// Vote submission
document
  .getElementById("vote-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    var winner = document.querySelector('input[name="winner"]:checked').value;

    // Send the vote data to the server (e.g., using AJAX)
    // You will need to implement the server-side code to store the vote in the MySQL database

    // Update the voting results on the page
    updateVotingResults(winner);
  });

// Function to update the voting results on the page
function updateVotingResults(winner) {
  if (winner === "player1") {
    var player1Votes = parseInt(
      document.getElementById("player1-votes").innerHTML,
    );
    document.getElementById("player1-votes").innerHTML = player1Votes + 1;
  } else if (winner === "player2") {
    var player2Votes = parseInt(
      document.getElementById("player2-votes").innerHTML,
    );
    document.getElementById("player2-votes").innerHTML = player2Votes + 1;
  }
}

// Game result submission
document
  .getElementById("result-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    var gameResult = document.getElementById("game-result-input").value;

    // Send the game result data to the server (e.g., using AJAX)
    // You will need to implement the server-side code to match the game result with the voting result

    // Display the game result on the page (e.g., update a section with the result)
  });

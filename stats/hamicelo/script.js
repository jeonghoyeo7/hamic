import {
  firebaseConfig,
  googleConfig,
} from './config/config.js';

let playerInfoGlobal = null;
let gameResultsGlobal = null;
const googleDriveFolderId = googleConfig.driveFolerId; 

let driveFiles = [];

async function getDriveFiles(folderId) {
    const apiKey = googleConfig.apiKey;
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

async function fetchGoogleSheetData(includeOldData) {
    const apiKey = googleConfig.apiKey;
    const sheetId = googleConfig.sheetId_data;
    const sheetName = includeOldData ? 'temp전체리그Data' : '전체리그Data';
    // const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:Z1000?key=${apiKey}`;
    const url = includeOldData ? "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!A1:J40000?key=" + apiKey : "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!A1:J15000?key=" + apiKey;
    

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
    const apiKey = googleConfig.apiKey;
    const sheetId = googleConfig.sheetId_data;
    const sheetName = '선수Data'; // Replace with the name of the tab you want to fetch data from
    const url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!A1:G1000?key=" + apiKey;
    
    const response = await fetch(url);
    const data = await response.json();

    const rows = data.values;
    const playerResults = rows.slice(1).map((row) => {
        return {
        Team: row[0],
        Tier: row[1],
        ID: row[2],
        Race: row[3],
        };
    });

    // Aggregate the statistics
    const teamStats = {};
    const tierStats = {};
    const raceStats = {};

    playerResults.forEach(player => {
        if (player.Team.trim() !== '') {
          teamStats[player.Team] = (teamStats[player.Team] || 0) + 1;
          tierStats[player.Tier] = (tierStats[player.Tier] || 0) + 1;
          raceStats[player.Race] = (raceStats[player.Race] || 0) + 1;
        }
    });
      

    // Prepare the data and labels for the charts
    const teamLabels = Object.keys(teamStats);
    const teamData = teamLabels.map(label => teamStats[label]);
    const tierLabels = Object.keys(tierStats);
    const tierData = tierLabels.map(label => tierStats[label]);
    const raceLabels = Object.keys(raceStats);
    const raceData = raceLabels.map(label => raceStats[label]);

    // Destroy existing chart instances if they exist
    if (teamChartInstance) teamChartInstance.destroy();
    if (tierChartInstance) tierChartInstance.destroy();
    if (raceChartInstance) raceChartInstance.destroy();

    // Sort the labels and data arrays based on the custom sort function
    const sortedTierLabels = Object.keys(tierStats).sort(customTierSort);
    const sortedTierData = sortedTierLabels.map(label => tierStats[label]);

    // Create the charts
    const teamCtx = document.getElementById('teamChart').getContext('2d');
    const tierCtx = document.getElementById('tierChart').getContext('2d');
    const raceCtx = document.getElementById('raceChart').getContext('2d');

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

    const apiKey = googleConfig.apiKey;
    const sheetId = googleConfig.sheetId_data;
    const sheetName = 'STLS10일정'; // Replace with the name of the tab you want to fetch data from
    const url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!K3:R15?key=" + apiKey;
    

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
  
// Function to fetch the STL S10 schedule data from the Google Sheet and display it on the page
async function getScheduleData() {
    const spinLoading = document.getElementById("loading-schedule");
    spinLoading.style.display = "block"; // show loading spinner

    const apiKey = googleConfig.apiKey;
    const sheetId = googleConfig.sheetId_data;
    const sheetName = 'S10일정'; 
    
    const url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!A1:P107?key=" + apiKey;
    const response = await fetch(url);
    const data = await response.json();
  
    // Process the data and display it on the page
    const rows = data.values;
    const scheduleSection = document.getElementById('schedule');

    // Clear the existing schedule data
    scheduleSection.innerHTML = '';

     // Loop through the rows and create a table for the data
    const table = document.createElement('table');
    table.id = 'schedule-table';
    table.classList.add("table-responsive-md");
    

    // Add the schedule data to the table
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    let todayMatch = '';
    
    for (let i = 0; i < rows.length; i++) {
        const dataRow = document.createElement('tr');
        for (let j = 0; j < rows[i].length; j++) {
            const dataCell = document.createElement('td');
            if (j === 3 && rows[i][3] && rows[i][4] && rows[i][5]) {
                const fileId = await getGameImageFileId(rows[i][0]);
                if (fileId) {
                    const gameLink = document.createElement('a');
                    gameLink.textContent = `${rows[i][3]} : ${rows[i][5]}`;
                    gameLink.href = "#";
                    gameLink.addEventListener('click', () => {
                      const modal = document.getElementById('gameImageModal');
                      modal.querySelector('.modal-title').textContent = `${rows[i][2]} ${rows[i][3]} : ${rows[i][5]} ${rows[i][6]}`;
                      const modalLoading = modal.querySelector('.modal-body .loading');
                      modalLoading.style.display = 'block'; // show loading spinner
                      const modalImg = modal.querySelector('.modal-body img');         
                      getGameImageFileId(rows[i][0]).then((fileId) => {
                        modalImg.src = `https://drive.google.com/uc?id=${fileId}&export=view`;
                        modalImg.onload = () => {
                            modalLoading.style.display = 'none'; // hide loading spinner when image is loaded
                        }
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
            dataRow.children[2].classList.add('text-danger');
        }
        if (Number(rows[i][5]) === 4) {
            dataRow.children[4].classList.add('text-danger');
        }
        
        if (rows[i][0] === today) {
            dataRow.classList.add('highlighted');
            todayMatch = `<strong>Today's Match</strong> - ${rows[i][0]}(${rows[i][1]}) <br> <span class="match-highlight">${rows[i][2]} vs ${rows[i][6]}</span> <br> (중계: ${rows[i][7]}, 엔트리제출: ${rows[i][8]})`;
        }
        if (rows[i][0].includes('날짜')) {
            dataRow.classList.add('grey-background');
        }
        table.appendChild(dataRow);
    }

    // Add the table to the page
    scheduleSection.appendChild(table);

    // Add today's match to the page
    const todayMatchSection = document.getElementById('today-match');
    todayMatchSection.innerHTML = '';
    if (todayMatch) {
        todayMatchSection.innerHTML = todayMatch;
        todayMatchSection.classList.add('today-match');
    } else {
        todayMatchSection.innerHTML = 'No matches today.';
        todayMatchSection.classList.add('today-match');
    }

    spinLoading.style.display = "none"; // not show loading spinner
}

getTeamRankingData();
getScheduleData();
  
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
    tableBody.innerHTML = '';

    gameResults.forEach(result => {
        const row = document.createElement('tr');

        Object.values(result).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

function displayStatistics(gameResults, tableName, keyword) {      
    const playerThis = playerInfoGlobal.filter(
        (result) =>
        result.ID.toLowerCase() === keyword
    );      
    if (playerThis.length === 0) {
        console.error("Player not found.");
        return;
    }
    const playerGames = gameResults.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword ||
        result.LoserID.toLowerCase() === keyword
    );
    const totalGames = playerGames.length;
    const totalWins = playerGames.filter(
        (result) => result.WinnerID.toLowerCase() === keyword
    ).length;
    const totalLoses = playerGames.length - totalWins;

    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
    const terranWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 't'
    ).length;
    const protossWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'p'
    ).length;
    const zergWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'z'
    ).length;
    const terranLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 't'
    ).length;
    const protossLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'p'
    ).length;
    const zergLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'z'
    ).length;
    const terranRate = (terranWins+terranLoses) > 0 ? (terranWins / (terranWins+terranLoses)) * 100 : 0;
    const protossRate = (protossWins+protossLoses) > 0 ? (protossWins / (protossWins+protossLoses)) * 100 : 0;
    const zergRate = (zergWins+zergLoses) > 0 ? (zergWins / (zergWins+zergLoses)) * 100 : 0;

    const playTerranWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 't'
    ).length;
    const playProtossWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'p'
    ).length;
    const playZergWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'z'
    ).length;
    const playTerranLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 't'
    ).length;
    const playProtossLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'p'
    ).length;
    const playZergLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'z'
    ).length;
    const playTerranRate = (playTerranWins+playTerranLoses) > 0 ? (playTerranWins / (playTerranWins+playTerranLoses)) * 100 : 0;
    const playProtossRate = (playProtossWins+playProtossLoses) > 0 ? (playProtossWins / (playProtossWins+playProtossLoses)) * 100 : 0;
    const playZergRate = (playZergWins+playZergLoses) > 0 ? (playZergWins / (playZergWins+playZergLoses)) * 100 : 0;

    const HEL1Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'hel1'
    ).length;
    const HEL1Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'hel1'
    ).length;
    const HEL1Rate = (HEL1Wins+HEL1Loses) > 0 ? (HEL1Wins / (HEL1Wins+HEL1Loses)) * 100 : 0;

    const HEL2Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'hel2'
    ).length;
    const HEL2Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'hel2'
    ).length;
    const HEL2Rate = (HEL2Wins+HEL2Loses) > 0 ? (HEL2Wins / (HEL2Wins+HEL2Loses)) * 100 : 0;

    const AELWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'ael'
    ).length;
    const AELLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'ael'
    ).length;
    const AELRate = (AELWins+AELLoses) > 0 ? (AELWins / (AELWins+AELLoses)) * 100 : 0;

    const MELWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'mel'
    ).length;
    const MELLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'mel'
    ).length;
    const MELRate = (MELWins+MELLoses) > 0 ? (MELWins / (MELWins+MELLoses)) * 100 : 0;

    const IELWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'iel'
    ).length;
    const IELLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'iel'
    ).length;
    const IELRate = (IELWins+IELLoses) > 0 ? (IELWins / (IELWins+IELLoses)) * 100 : 0;

    const CEL1Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'cel1'
    ).length;
    const CEL1Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'cel1'
    ).length;
    const CEL1Rate = (CEL1Wins+CEL1Loses) > 0 ? (CEL1Wins / (CEL1Wins+CEL1Loses)) * 100 : 0;

    const CEL2Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'cel2'
    ).length;
    const CEL2Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'cel2'
    ).length;
    const CEL2Rate = (CEL2Wins+CEL2Loses) > 0 ? (CEL2Wins / (CEL2Wins+CEL2Loses)) * 100 : 0;

    const CEL3Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'cel3'
    ).length;
    const CEL3Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'cel3'
    ).length;
    const CEL3Rate = (CEL3Wins+CEL3Loses) > 0 ? (CEL3Wins / (CEL3Wins+CEL3Loses)) * 100 : 0;

    const STLWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.leagueTitle.toLowerCase().includes('team league')
    ).length;
    const STLLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.leagueTitle.toLowerCase().includes('team league') 
    ).length;
    const SILHSTWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('sil') || result.leagueTitle.toLowerCase().includes('hst') || result.leagueTitle.toLowerCase().includes('hel0 league') || result.leagueTitle.toLowerCase().includes('hel1 league') || result.leagueTitle.toLowerCase().includes('hel2 league' ) || result.leagueTitle.toLowerCase().includes('ael league') || result.leagueTitle.toLowerCase().includes('mel league') || result.leagueTitle.toLowerCase().includes('iel league') || result.leagueTitle.toLowerCase().includes('cel1 league') || result.leagueTitle.toLowerCase().includes('cel2 league')  || result.leagueTitle.toLowerCase().includes('cel3 league'))
    ).length;
    const SILHSTLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('sil') || result.leagueTitle.toLowerCase().includes('hst') || result.leagueTitle.toLowerCase().includes('hel0 league') || result.leagueTitle.toLowerCase().includes('hel1 league') || result.leagueTitle.toLowerCase().includes('hel2 league' ) || result.leagueTitle.toLowerCase().includes('ael league') || result.leagueTitle.toLowerCase().includes('mel league') || result.leagueTitle.toLowerCase().includes('iel league') || result.leagueTitle.toLowerCase().includes('cel1 league') || result.leagueTitle.toLowerCase().includes('cel2 league')  || result.leagueTitle.toLowerCase().includes('cel3 league'))
    ).length;
    const HMEventWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('청정수리그')   || result.leagueTitle.toLowerCase().includes('kaleague') || result.leagueTitle.toLowerCase().includes('연승전') || result.leagueTitle.toLowerCase().includes('포워드'))
    ).length;
    const HMEventLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('청정수리그')   || result.leagueTitle.toLowerCase().includes('kaleague') || result.leagueTitle.toLowerCase().includes('연승전') || result.leagueTitle.toLowerCase().includes('포워드'))
    ).length;
    const ClanWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('kpl') || result.leagueTitle.toLowerCase().includes('wpl') || result.leagueTitle.toLowerCase().includes('tpl') || result.leagueTitle.toLowerCase().includes('we clan') || result.leagueTitle.toLowerCase().includes('프로리그'))
    ).length;
    const ClanLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('kpl') || result.leagueTitle.toLowerCase().includes('wpl') || result.leagueTitle.toLowerCase().includes('tpl') || result.leagueTitle.toLowerCase().includes('we clan') || result.leagueTitle.toLowerCase().includes('프로리그'))
    ).length;
    
    const vsHEL1Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'hel1'
    ).length;
    const vsHEL1Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'hel1'
    ).length;
    const vsHEL1Rate = (HEL1Wins+HEL1Loses) > 0 ? (HEL1Wins / (HEL1Wins+HEL1Loses)) * 100 : 0;

    const vsHEL2Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'hel2'
    ).length;
    const vsHEL2Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'hel2'
    ).length;
    const vsHEL2Rate = (HEL2Wins+HEL2Loses) > 0 ? (HEL2Wins / (HEL2Wins+HEL2Loses)) * 100 : 0;

    const vsAELWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'ael'
    ).length;
    const vsAELLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'ael'
    ).length;
    const vsAELRate = (AELWins+AELLoses) > 0 ? (AELWins / (AELWins+AELLoses)) * 100 : 0;

    const vsMELWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'mel'
    ).length;
    const vsMELLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'mel'
    ).length;
    const vsMELRate = (MELWins+MELLoses) > 0 ? (MELWins / (MELWins+MELLoses)) * 100 : 0;

    const vsIELWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'iel'
    ).length;
    const vsIELLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'iel'
    ).length;
    const vsIELRate = (IELWins+IELLoses) > 0 ? (IELWins / (IELWins+IELLoses)) * 100 : 0;

    const vsCEL1Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'cel1'
    ).length;
    const vsCEL1Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'cel1'
    ).length;
    const vsCEL1Rate = (CEL1Wins+CEL1Loses) > 0 ? (CEL1Wins / (CEL1Wins+CEL1Loses)) * 100 : 0;

    const vsCEL2Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'cel2'
    ).length;
    const vsCEL2Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'cel2'
    ).length;
    const vsCEL2Rate = (CEL2Wins+CEL2Loses) > 0 ? (CEL2Wins / (CEL2Wins+CEL2Loses)) * 100 : 0;

    const vsCEL3Wins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'cel3'
    ).length;
    const vsCEL3Loses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'cel3'
    ).length;
    const vsCEL3Rate = (CEL3Wins+CEL3Loses) > 0 ? (CEL3Wins / (CEL3Wins+CEL3Loses)) * 100 : 0;

    
    const statsTable = document.getElementById(tableName);
    if (statsTable !== null) {
        statsTable.innerHTML = `
        <tbody>
            <tr>
                <td colspan="2">
                    <div id="player-info" class="container text-center">
                        <h2 id="player-id">${playerThis[0].ID}</h2>
                        <h4 id="player-race">${playerThis[0].Team} / ${playerThis[0].Tier} / ${playerThis[0].Race}</h3>
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
                                        <td colspan="2" style="text-align: center;" >${totalWins}승 ${totalLoses}패, 승률 ${winRate.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                    <td colspan="2" style="text-align: center;" class="subtitle-stats"> 본인 종족별 전적  </td>
                                    </tr>  
                                    <tr>
                                        <td style="text-align: center;">Terran</td>
                                        <td>${playTerranWins}승 ${playTerranLoses}패, 승률 ${playTerranRate.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">Protoss</td>
                                        <td>${playProtossWins}승 ${playProtossLoses}패, 승률 ${playProtossRate.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">Zerg</td>
                                        <td>${playZergWins}승 ${playZergLoses}패, 승률 ${playZergRate.toFixed(2)}%</td>
                                    </tr> 
                                    <tr>
                                        <td colspan="2" style="text-align: center;" class="subtitle-stats"> 상대 종족별 전적  </td>
                                    </tr>                           
                                    <tr>
                                        <td style="text-align: center;">vs Terran</td>
                                        <td>${terranWins}승 ${terranLoses}패, 승률 ${terranRate.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">vs Protoss</td>
                                        <td>${protossWins}승 ${protossLoses}패, 승률 ${protossRate.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">vs Zerg</td>
                                        <td>${zergWins}승 ${zergLoses}패, 승률 ${zergRate.toFixed(2)}%</td>
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
                                        <td colspan="2" style="text-align: center;"> ${STLWin}승 ${STLLose}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹 개인리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${SILHSTWin}승 ${SILHSTLose}패</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹 이벤트리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${HMEventWin}승 ${HMEventLose}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 하믹외 리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${ClanWin}승 ${ClanLose}패 </td>
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
                                        <td style="text-align: center;"> ${HEL1Wins}승 ${HEL1Loses}패 </td>
                                        <td style="text-align: center;"> ${vsHEL1Wins}승 ${vsHEL1Loses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">HEL2 </td>
                                        <td style="text-align: center;"> ${HEL2Wins}승 ${HEL2Loses}패 </td>
                                        <td style="text-align: center;"> ${vsHEL2Wins}승 ${vsHEL2Loses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">AEL </td>
                                        <td style="text-align: center;"> ${AELWins}승 ${AELLoses}패 </td>
                                        <td style="text-align: center;"> ${vsAELWins}승 ${vsAELLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">MEL </td>
                                        <td style="text-align: center;"> ${MELWins}승 ${MELLoses}패 </td>
                                        <td style="text-align: center;"> ${vsMELWins}승 ${vsMELLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">IEL </td>
                                        <td style="text-align: center;"> ${IELWins}승 ${IELLoses}패 </td>
                                        <td style="text-align: center;"> ${vsIELWins}승 ${vsIELLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">CEL1 </td>
                                        <td style="text-align: center;"> ${CEL1Wins}승 ${CEL1Loses}패 </td>
                                        <td style="text-align: center;"> ${vsCEL1Wins}승 ${vsCEL1Loses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">CEL2 </td>
                                        <td style="text-align: center;"> ${CEL2Wins}승 ${CEL2Loses}패 </td>
                                        <td style="text-align: center;"> ${vsCEL2Wins}승 ${vsCEL2Loses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">CEL3 </td>
                                        <td style="text-align: center;"> ${CEL3Wins}승 ${CEL3Loses}패 </td>
                                        <td style="text-align: center;"> ${vsCEL3Wins}승 ${vsCEL3Loses}패 </td>
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
}

function populatePlayerStatsTable(player, tableName) {
    // Assuming gameResults, tableName, and playerInfoGlobal are available globally
    const keyword = player.toLowerCase();

    const filteredResults = gameResultsGlobal.filter(result => {
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


function search() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const includeOldData = document.getElementById("includeDataCheckbox").checked;

    const checkbox1 = document.querySelector('#includeDataCheckbox');
    const checkbox2 = document.querySelector('#includeDataCheckbox2');

    checkbox2.checked = checkbox1.checked;
    localStorage.setItem('includeOldData', checkbox1.checked);
    const includeOldDataLabel = document.getElementById("playerButtonText");
    if (checkbox1.checked) {
        includeOldDataLabel.textContent = "2021.3.1 이전 데이터도 포함";
    } else {
        includeOldDataLabel.textContent = "2021.3.1 이후 데이터만 포함";
    }

    if (keyword !== '') {
        // Show the loading spinner, hide the button text, and disable the button
        document.getElementById('buttonSpinner').classList.remove('d-none');
        document.getElementById('buttonText').classList.add('d-none');
        document.getElementById('searchButton').disabled = true;
        
        fetchGoogleSheetData(includeOldData)
            .then(gameResults => {
                const filteredResults = gameResults.filter(result => {
                    return (
                        result.WinnerID.toLowerCase() === keyword ||
                        result.LoserID.toLowerCase() === keyword
                    );
                });
                
                displayData(filteredResults, 'rankingTableBody');
                displayStatistics(filteredResults, 'statsTable', keyword);
                document.getElementById('statsTable').style.display = 'table';

                // Hide the loading spinner, show the button text, and enable the button
                document.getElementById('buttonSpinner').classList.add('d-none');
                document.getElementById('buttonText').classList.remove('d-none');
                document.getElementById('searchButton').disabled = false;
            })
            .catch(error => {
                console.error('Error fetching data:', error);

                // Hide the loading spinner, show the button text, and enable the button
                document.getElementById('buttonSpinner').classList.add('d-none');
                document.getElementById('buttonText').classList.remove('d-none');
                document.getElementById('searchButton').disabled = false;
            });
    } else {
        // Show the loading spinner, hide the button text, and disable the button
        document.getElementById('buttonSpinner').classList.remove('d-none');
        document.getElementById('buttonText').classList.add('d-none');
        document.getElementById('searchButton').disabled = true;

        fetchGoogleSheetData(includeOldData)
            .then(gameResults => {
                displayData(gameResults, 'rankingTableBody');
                document.getElementById('statsTable').style.display = 'none';

                // Hide the loading spinner, show the button text, and enable the button
                document.getElementById('buttonSpinner').classList.add('d-none');
                document.getElementById('buttonText').classList.remove('d-none');
                document.getElementById('searchButton').disabled = false;
            })
            .catch(error => {
                console.error('Error fetching data:', error);

                // Hide the loading spinner, show the button text, and enable the button
                document.getElementById('buttonSpinner').classList.add('d-none');
                document.getElementById('buttonText').classList.remove('d-none');
                document.getElementById('searchButton').disabled = false;
            });
    }
}

function searchTwo() {
    const keyword1 = document.getElementById('searchInput1').value.toLowerCase();
    const keyword2 = document.getElementById('searchInput2').value.toLowerCase();
    const includeOldData = document.getElementById("includeDataCheckbox2").checked;
    const checkbox1 = document.querySelector('#includeDataCheckbox');
    const checkbox2 = document.querySelector('#includeDataCheckbox2');

    checkbox1.checked = checkbox2.checked;
    localStorage.setItem('includeOldData', checkbox2.checked);
    const includeOldDataLabel = document.getElementById("playerButtonText");
    if (checkbox2.checked) {
        includeOldDataLabel.textContent = "2021.3.1 이전 데이터도 포함";
    } else {
        includeOldDataLabel.textContent = "2021.3.1 이후 데이터만 포함";
    }
    if (keyword1 !== '' && keyword2 !== '') {
        // Show the loading spinner, hide the button text, and disable the button
        document.getElementById('buttonSpinner2').classList.remove('d-none');
        document.getElementById('buttonText2').classList.add('d-none');
        document.getElementById('searchButton2').disabled = true;
        
        fetchGoogleSheetData(includeOldData)
            .then(gameResults => {
                const filteredResults = gameResults.filter(result => {
                    return (
                        (result.WinnerID.toLowerCase() === keyword1 && result.LoserID.toLowerCase() === keyword2) ||
                        (result.LoserID.toLowerCase() === keyword1 && result.WinnerID.toLowerCase() === keyword2) 
                    );
                });

                displayData(filteredResults, 'rankingTableBody2');
                displayStatistics(filteredResults, 'statsTable2', keyword1);
                document.getElementById('statsTable2').style.display = 'table';

                // Hide the loading spinner, show the button text, and enable the button
                document.getElementById('buttonSpinner2').classList.add('d-none');
                document.getElementById('buttonText2').classList.remove('d-none');
                document.getElementById('searchButton2').disabled = false;
            })
            .catch(error => {
                console.error('Error fetching data:', error);

                // Hide the loading spinner, show the button text, and enable the button
                document.getElementById('buttonSpinner2').classList.add('d-none');
                document.getElementById('buttonText2').classList.remove('d-none');
                document.getElementById('searchButton2').disabled = false;
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

document.getElementById('searchButton').addEventListener('click', search);
document.getElementById('searchButton2').addEventListener('click', searchTwo);


// // Load all game results on page load
// fetchGoogleSheetData().then(gameResults => {
//     displayData(gameResults);
// });

// Load all player info on page load
// Load playerInfo and make it available to the rest of the app with global variable
fetchPlayerData().then(playerInfo => {
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
            idCell.style.cursor = "pointer";
            idCell.addEventListener("click", () => {
                displayPlayerStatsModal(player.ID.toLowerCase());
            });

            row.insertCell().textContent = player.Race;
        }
    }
}


function displayPlayerStatsModal(player) {
    // Call your function to populate the player stats table here
    populatePlayerStatsTable(player, "statsTableModal");

    // Show the modal
    const playerStatsModal = new bootstrap.Modal(document.getElementById("playerStatsModal"));
    playerStatsModal.show();
}


document.querySelectorAll("#playerListTable th").forEach(headerCell => {
    headerCell.addEventListener("click", () => {
        const sortBy = headerCell.dataset.sortKey;
        const sortedData = [...playerResults].sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            return 0;
        });
        populatePlayerListTable(sortedData);
    });
});

document.getElementById("playerSearchInput").addEventListener("input", function (event) {
    const searchValue = event.target.value.toLowerCase().trim();
    const filteredData = playerResults.filter(player => {
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
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    ticks: {
                        font: {
                            size: (ctx) => {
                                const chartWidth = ctx.chart.width;
                                return chartWidth <= 480 ? 10 : 12;
                            }
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function customTierSort(a, b) {
    const sortOrder = ['HEL1', 'HEL2', 'AEL', 'MEL', 'IEL', 'CEL1', 'CEL2', 'CEL3'];
    return sortOrder.indexOf(a) - sortOrder.indexOf(b);
}

// get references to the checkboxes
const checkbox1 = document.querySelector('#includeDataCheckbox');
const checkbox2 = document.querySelector('#includeDataCheckbox2');
const includeOldDataLabel = document.getElementById("playerButtonText");


const storedValue = localStorage.getItem('includeOldData');

if (storedValue) {
    checkbox1.checked = storedValue === 'true';
    checkbox2.checked = storedValue === 'true';

    if (storedValue) {
        includeOldDataLabel.textContent = "2021.3.1 이전 데이터도 포함";
    } else {
        includeOldDataLabel.textContent = "2021.3.1 이후 데이터만 포함";
    }

    fetchGoogleSheetData(storedValue)
            .then(gameResults => {gameResultsGlobal=gameResults});
} else {
    fetchGoogleSheetData(false)
            .then(gameResults => {gameResultsGlobal=gameResults});
}

// Call the functions to fetch and display the data



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics(app);
const database = firebase.database();


async function updateVisitorCount() {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString();

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
    const fileExtensions = ['jpg', 'png', 'JPG', 'PNG', 'jpeg', 'JPEG', 'gif', 'GIF'];
    const fileNames = fileExtensions.map(ext => stringFileName + '.' + ext);
    const file = driveFiles.find(file => fileNames.includes(file.name));
    return file ? file.id : '';
}



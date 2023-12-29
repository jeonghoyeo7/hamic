import {
  firebaseConfig,
  googleConfig,
} from './config/config.js';

let playerInfoGlobal = null;
let gameResultsGlobal = null;

let adRef = false;
adRef = addKakaoAd(adRef);

async function fetchGoogleSheetData() {
    if (gameResultsGlobal) {
        return gameResultsGlobal;
    }
    const apiKey = googleConfig.apiKey;
    const sheetId = googleConfig.sheetId_data;
    const sheetName = '결과입력';
    const url =  "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!A11:V15000?key=" + apiKey;
    
    const response = await fetch(url);
    const data = await response.json();

    const rows = data.values;
    const gameResults = rows.slice(1).map((row) => {
        const year = row[0];
        const month = row[1];
        const day = row[2];

        const date = new Date(year, month - 1, day);
        const formattedDate = `${year}.${month ? month.toString().padStart(2, '0') : ''}.${day ? day.toString().padStart(2, '0') : ''}`;


        return {
            year: row[0],
            month: row[1],
            day: row[2],
            leagueTitle: row[3],
            Map: row[4],
            WinnerID: row[5] ? row[5].replace(/\[kS\]/i, '') : '',
            LoserID: row[6] ? row[6].replace(/\[kS\]/i, '') : '',
            URL: row[7],
            WinnerTier: row[9],            
            WinnerRace: row[10],
            LoserTier: row[11],            
            LoserRace: row[12],
            Date: formattedDate,
        };
    }).filter(result => {
        return result.leagueTitle && result.WinnerID && result.LoserID &&
               result.WinnerTier && result.WinnerRace && result.LoserTier &&
               result.LoserRace;
    });
    // console.log(gameResults)

    gameResultsGlobal = gameResults;
    return gameResults;
}

let playerData = null;
let playerResults;

(async function init() {
    playerResults = await fetchPlayerData();
})();

let gameResults;

(async function init() {
    gameResults = await fetchGoogleSheetData();
})();

async function fetchPlayerData() {
    if (playerData) {
        return playerData;
    }
    const apiKey = googleConfig.apiKey;
    const sheetId = googleConfig.sheetId_data;
    const sheetName = 'Main'; // Replace with the name of the tab you want to fetch data from
    // const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:Z1000?key=${apiKey}`;
    const url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId + "/values/" + sheetName + "!A2:AB2000?key=AIzaSyCj2I4TWIibjAXevomLr6kJF7y-qMQq-MA";
    
    const response = await fetch(url);
    const data = await response.json();

    const rows = data.values;

    const playerResults = rows.slice(1).map((row) => {
        const win = parseInt(row[9]) || 0; // convert Win to a number, or use 0 if it's not a valid number
        const lose = parseInt(row[11]) || 0; // convert Lose to a number, or use 0 if it's not a valid number
        const games = win + lose; // calculate the total number of games played
        const winRate = games > 0 ? win / games : 0; // calculate the win rate, or set it to 0 if no games have been played
        
        if (row[3] === "Rui") {
            console.log(row[3])
            console.log(row[15])
        }
        return {
          Rank: Number(row[0]),
          RankInTier: 0,
          Point: Number(Number(row[1]).toFixed(2)),
          ID: row[3] ? row[3].replace('[kS]', '') : '',
          Tier: row[6],
          Race: row[8],
          Win: win,
          Lose: lose,
          Games: games,
          WinRate: (winRate * 100).toFixed(1) + '%', // convert the win rate to a percentage string with 2 decimal places
          EventAttendTeam: row[15] === undefined ? "" : row[15],
          EventAttendIndi: row[16] === undefined ? "" : row[16],
        };
      });

    // Aggregate the statistics
    const pointStats = {};
    const tierStats = {};
    const raceStats = {};

    playerResults.forEach(player => {
        pointStats[player.Point] = (pointStats[player.Point] || 0) + 1;
        tierStats[player.Tier] = (tierStats[player.Tier] || 0) + 1;
        raceStats[player.Race] = (raceStats[player.Race] || 0) + 1;
    
        const playersInTier = playerResults.filter(p => p.Tier === player.Tier);
        playersInTier.sort((a, b) => b.Point - a.Point);
        const rankInTier = playersInTier.findIndex(p => p.ID === player.ID) + 1;
    
        player.RankInTier = rankInTier;
    });

    // Prepare the data and labels for the charts
    // const pointLabels = Object.keys(pointStats);
    // const pointData = pointLabels.map(label => pointStats[label]);
    const tierLabels = Object.keys(tierStats);
    const tierData = tierLabels.map(label => tierStats[label]);
    const raceLabels = Object.keys(raceStats);
    const raceData = raceLabels.map(label => raceStats[label]);

    const pointLabels = Object.keys(pointStats).sort((a, b) => parseInt(a) - parseInt(b));
    const pointData = pointLabels.map(label => pointStats[label]);
    

    // Calculate cumulative distribution
    const cumulativePointData = [];
    let cumulativeSum = 0;
    pointData.forEach((value, index) => {
    cumulativeSum += value;
    cumulativePointData[index] = cumulativeSum;
    });

    // Normalize cumulative distribution to convert it to CDF
    const totalPlayers = playerResults.length;
    const normalizedCumulativePointData = cumulativePointData.map(value => value / totalPlayers);

    

    // Destroy existing chart instances if they exist
    if (pointChartInstance) pointChartInstance.destroy();
    if (tierChartInstance) tierChartInstance.destroy();
    if (raceChartInstance) raceChartInstance.destroy();

    // Sort the labels and data arrays based on the custom sort function
    const sortedTierLabels = Object.keys(tierStats).sort(customTierSort);
    const sortedTierData = sortedTierLabels.map(label => tierStats[label]);

    // Create the charts
    const pointCtx = document.getElementById('pointChart').getContext('2d');
    const tierCtx = document.getElementById('tierChart').getContext('2d');
    const raceCtx = document.getElementById('raceChart').getContext('2d');

    pointChartInstance = createLineChart(pointCtx, normalizedCumulativePointData, pointLabels);
    tierChartInstance = createBarChart(tierCtx, sortedTierData, sortedTierLabels);
    raceChartInstance = createBarChart(raceCtx, raceData, raceLabels);

    // Before returning the playerResults, set the global playerData variable
    playerData = playerResults;
    return playerResults;
}

function createLineChart(ctx, data, labels) {
    return new Chart(ctx, {
        type: 'line',
        data: {
        labels: labels,
        datasets: [{
            label: 'CDF',
            data: data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1,
            pointRadius: 2,
            pointHoverRadius: 4,
        }],
        },
        options: {
        scales: {
            x: {
            display: true,
            title: {
                display: true,
                text: 'Points'
            }
            },
            y: {
            display: true,
            title: {
                display: true,
                text: 'CDF'
            },
            min: 0,
            max: 1,
            },
        },
        plugins: {
            legend: {
            display: false,
            },
        },
        },
    });
}
  

function displayData(gameResults, tableName, itemsPerPage = 100, currentPage = 1) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = gameResults.sort((a, b) => new Date(b.Date) - new Date(a.Date)).slice(startIndex, endIndex);

    const tableBody = document.getElementById(tableName);
    tableBody.innerHTML = '';

    // sort gameResults by date in descending order
    // gameResults.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    paginatedResults.forEach(result => {
        const row = document.createElement('tr');

        // Update the keys array with the desired order
        const keys = ['Date', 'WinnerTier', 'WinnerID', 'WinnerRace', 'LoserTier', 'LoserID', 'LoserRace', 'Map', 'leagueTitle', 'URL'];

        // Loop through the keys array and create table cells
        keys.forEach(key => {
            const cell = document.createElement('td');

            if (key === 'URL') {
                if (result[key]) {
                    const anchor = document.createElement('a');
                    anchor.textContent = '영상링크';
                    anchor.href = result[key];
                    anchor.target = '_blank';
                    cell.appendChild(anchor);
                }
            } else {
                cell.textContent = result[key];
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    let pageContainerName;
    pageContainerName = tableName + 'PageContainer';
    displayPaginationButtons(gameResults.length, pageContainerName, itemsPerPage, currentPage, (newPage) => {
        displayData(gameResults, tableName, itemsPerPage, newPage);
    });
}
  


async function displayStatistics(gameResults, tableName, keyword, compare) {  
    keyword = keyword.toString();  
    const playerThis = playerInfoGlobal.filter(
        (result) =>
        result.ID.toLowerCase() === keyword
    );      
    if (playerThis.length === 0) {
        console.error("Player not found.");
        return;
    }


    let kslWins = 0;
    let kslRunnerUps = 0;
    let kplWins = 0;

    if (playerThis[0].EventAttendIndi && playerThis[0].EventAttendIndi.trim() !== '') {
    kslWins = (playerThis[0].EventAttendIndi.match(/우승/g) || []).length;
    kslRunnerUps = (playerThis[0].EventAttendIndi.match(/준우승/g) || []).length;
    }

    if (playerThis[0].EventAttendTeam && playerThis[0].EventAttendTeam.trim() !== '') {
    kplWins = (playerThis[0].EventAttendTeam.match(/우승/g) || []).length;
    }

    const trophiesHtml = Array(kplWins).fill(`<img class="trophy" src="trophy.png" title="${playerThis[0].EventAttendTeam}">`).join('');
    const goldMedalsHtml = Array(kslWins - kslRunnerUps).fill(`<img class="medal" src="gold-medal.png" title="${playerThis[0].EventAttendIndi}">`).join('');
    const silverMedalsHtml = Array(kslRunnerUps).fill(`<img class="medal" src="silver-medal.png" title="${playerThis[0].EventAttendIndi}">`).join('');

    let kplTrophiesHtml = '';
    if (playerThis[0].EventAttendTeam && playerThis[0].EventAttendTeam.trim() !== '') {
        const trophyMatches = playerThis[0].EventAttendTeam.match(/KPL\s*Season\s*(\d+) (우승|준우승) \(([^)]+)\)/g);
        if (trophyMatches) {
            const trophiesHtml = trophyMatches.map(match => {
            const [_, season, result, team] = match.match(/KPL\s*Season\s*(\d+) (우승|준우승) \(([^)]+)\)/);
            const seasonStr = `KPLS${season}`;
            const imgSrc = result === '우승' ? `${seasonStr}_winner.png` : `${seasonStr}_runnerup.png`;
            return `<img class="trophy" src="./img/${imgSrc}" title="${team}">`;
            }).join('');
            kplTrophiesHtml = trophiesHtml;
        }
    }





    let playerThat = [];
    if (compare != false) {
        playerThat = playerInfoGlobal.filter(
            (result) =>
            result.ID.toLowerCase() === compare.toString().toLowerCase()
        );      
        if (playerThat.length === 0) {
            console.error("Player not found.");
            return;
        }
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

    const playTWinsVsT = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 't' && 
        result.LoserRace.toLowerCase() === 't'
    ).length;
    const playTWinsVsP = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 't' && 
        result.LoserRace.toLowerCase() === 'p'
    ).length;
    const playTWinsVsZ = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 't' && 
        result.LoserRace.toLowerCase() === 'z'
    ).length;
    const playTLosesVsT = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 't' && 
        result.WinnerRace.toLowerCase() === 't'
    ).length;
    const playTLosesVsP = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 't' && 
        result.WinnerRace.toLowerCase() === 'p'
    ).length;
    const playTLosesVsZ = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 't' && 
        result.WinnerRace.toLowerCase() === 'z'
    ).length;

    const playPWinsVsT = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'p' && 
        result.LoserRace.toLowerCase() === 't'
    ).length;
    const playPWinsVsP = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'p' && 
        result.LoserRace.toLowerCase() === 'p'
    ).length;
    const playPWinsVsZ = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'p' && 
        result.LoserRace.toLowerCase() === 'z'
    ).length;
    const playPLosesVsT = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'p' && 
        result.WinnerRace.toLowerCase() === 't'
    ).length;
    const playPLosesVsP = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'p' && 
        result.WinnerRace.toLowerCase() === 'p'
    ).length;
    const playPLosesVsZ = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'p' && 
        result.WinnerRace.toLowerCase() === 'z'
    ).length;

    const playZWinsVsT = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'z' && 
        result.LoserRace.toLowerCase() === 't'
    ).length;
    const playZWinsVsP = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'z' && 
        result.LoserRace.toLowerCase() === 'p'
    ).length;
    const playZWinsVsZ = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerRace.toLowerCase() === 'z' && 
        result.LoserRace.toLowerCase() === 'z'
    ).length;
    const playZLosesVsT = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'z' && 
        result.WinnerRace.toLowerCase() === 't'
    ).length;
    const playZLosesVsP = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'z' && 
        result.WinnerRace.toLowerCase() === 'p'
    ).length;
    const playZLosesVsZ = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserRace.toLowerCase() === 'z' && 
        result.WinnerRace.toLowerCase() === 'z'
    ).length;

    const playTRateVsT = (playTWinsVsT+playTLosesVsT) > 0 ? (playTWinsVsT / (playTWinsVsT+playTLosesVsT)) * 100 : 0;
    const playTRateVsP = (playTWinsVsP+playTLosesVsP) > 0 ? (playTWinsVsP / (playTWinsVsP+playTLosesVsP)) * 100 : 0;
    const playTRateVsZ = (playTWinsVsZ+playTLosesVsZ) > 0 ? (playTWinsVsZ / (playTWinsVsZ+playTLosesVsZ)) * 100 : 0;
    const playPRateVsT = (playPWinsVsT+playPLosesVsT) > 0 ? (playPWinsVsT / (playPWinsVsT+playPLosesVsT)) * 100 : 0;
    const playPRateVsP = (playPWinsVsP+playPLosesVsP) > 0 ? (playPWinsVsP / (playPWinsVsP+playPLosesVsP)) * 100 : 0;
    const playPRateVsZ = (playPWinsVsZ+playPLosesVsZ) > 0 ? (playPWinsVsZ / (playPWinsVsZ+playPLosesVsZ)) * 100 : 0;
    const playZRateVsT = (playZWinsVsT+playZLosesVsT) > 0 ? (playZWinsVsT / (playZWinsVsT+playZLosesVsT)) * 100 : 0;
    const playZRateVsP = (playZWinsVsP+playZLosesVsP) > 0 ? (playZWinsVsP / (playZWinsVsP+playZLosesVsP)) * 100 : 0;
    const playZRateVsZ = (playZWinsVsZ+playZLosesVsZ) > 0 ? (playZWinsVsZ / (playZWinsVsZ+playZLosesVsZ)) * 100 : 0;
    

    const GoldWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'gold'
    ).length;
    const GoldLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'gold'
    ).length;
    const GoldRate = (GoldWins+GoldLoses) > 0 ? (GoldWins / (GoldWins+GoldLoses)) * 100 : 0;

    const YellowWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'yellow'
    ).length;
    const YellowLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'yellow'
    ).length;
    const YellowRate = (YellowWins+YellowLoses) > 0 ? (YellowWins / (YellowWins+YellowLoses)) * 100 : 0;

    const RedWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'red'
    ).length;
    const RedLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'red'
    ).length;
    const RedRate = (RedWins+RedLoses) > 0 ? (RedWins / (RedWins+RedLoses)) * 100 : 0;

    const VioletWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'violet'
    ).length;
    const VioletLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'violet'
    ).length;
    const VioletRate = (VioletWins+VioletLoses) > 0 ? (VioletWins / (VioletWins+VioletLoses)) * 100 : 0;

    const BlueWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'blue'
    ).length;
    const BlueLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'blue'
    ).length;
    const BlueRate = (BlueWins+BlueLoses) > 0 ? (BlueWins / (BlueWins+BlueLoses)) * 100 : 0;

    const SkyWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'sky'
    ).length;
    const SkyLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'sky'
    ).length;
    const SkyRate = (SkyWins+SkyLoses) > 0 ? (SkyWins / (SkyWins+SkyLoses)) * 100 : 0;

    const WhiteWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'white'
    ).length;
    const WhiteLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'white'
    ).length;
    const WhiteRate = (WhiteWins+WhiteLoses) > 0 ? (WhiteWins / (WhiteWins+WhiteLoses)) * 100 : 0;
   

    const KPLWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.leagueTitle.toLowerCase().includes('kpl')
    ).length;
    const KPLLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.leagueTitle.toLowerCase().includes('kpl') 
    ).length;
    const EventWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('공식이벤트'))
    ).length;
    const EventLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('공식이벤트'))
    ).length;
    const ELOWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('elo'))
    ).length;
    const ELOLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('elo'))
    ).length;
    const FullWin = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('풀리그'))
    ).length;
    const FullLose = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        (result.leagueTitle.toLowerCase().includes('풀리그'))
    ).length;
    
    const vsGoldWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'gold'
    ).length;
    const vsGoldLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'gold'
    ).length;
    const vsGoldRate = (GoldWins+GoldLoses) > 0 ? (GoldWins / (GoldWins+GoldLoses)) * 100 : 0;

    const vsYellowWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'yellow'
    ).length;
    const vsYellowLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'yellow'
    ).length;
    const vsYellowRate = (YellowWins+YellowLoses) > 0 ? (YellowWins / (YellowWins+YellowLoses)) * 100 : 0;

    const vsRedWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'red'
    ).length;
    const vsRedLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'red'
    ).length;
    const vsRedRate = (RedWins+RedLoses) > 0 ? (RedWins / (RedWins+RedLoses)) * 100 : 0;

    const vsVioletWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'violet'
    ).length;
    const vsVioletLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'violet'
    ).length;
    const vsVioletRate = (VioletWins+VioletLoses) > 0 ? (VioletWins / (VioletWins+VioletLoses)) * 100 : 0;

    const vsBlueWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'blue'
    ).length;
    const vsBlueLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'blue'
    ).length;
    const vsBlueRate = (BlueWins+BlueLoses) > 0 ? (BlueWins / (BlueWins+BlueLoses)) * 100 : 0;

    const vsSkyWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'sky'
    ).length;
    const vsSkyLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'sky'
    ).length;
    const vsSkyRate = (SkyWins+SkyLoses) > 0 ? (SkyWins / (SkyWins+SkyLoses)) * 100 : 0;

    const vsWhiteWins = playerGames.filter(
        (result) =>
        result.WinnerID.toLowerCase() === keyword &&
        result.LoserTier.toLowerCase() === 'white'
    ).length;
    const vsWhiteLoses = playerGames.filter(
        (result) =>
        result.LoserID.toLowerCase() === keyword &&
        result.WinnerTier.toLowerCase() === 'white'
    ).length;
    const vsWhiteRate = (WhiteWins+WhiteLoses) > 0 ? (WhiteWins / (WhiteWins+WhiteLoses)) * 100 : 0;


    
    const statsTable = document.getElementById(tableName);
    if (statsTable !== null) {
        // Check if profile picture exists
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
        let profilePictureSrc = false;
        let hasProfilePicture = false;

        // Check if the file with allowed extensions exists
        for (const extension of allowedExtensions) {
            profilePictureSrc = `./img/${playerThis[0].ID.toUpperCase()}${extension}`;
            try {
                hasProfilePicture = await imageExists(profilePictureSrc);
            } catch (error) {
                hasProfilePicture = false;
            }
            if (hasProfilePicture) {
                break;
            }
        }


        
        statsTable.innerHTML = `
        <tbody>            
            <tr${hasProfilePicture ? ` style="background-image: url(${profilePictureSrc}); min-height: 300px; background-position: center; background-size: contain; background-repeat: no-repeat;"` : ''}>
                <td colspan="2">
                    <div id="player-info" class="container text-center">
                    <h2 id="player-id">${playerThis[0].ID}</h2>
                        <h4 id="player-race">Rank-${playerThis[0].Rank} / ELO ${playerThis[0].Point} / ${playerThis[0].Tier}-${playerThis[0].RankInTier} ${playerThis[0].RankInTier === 1 ? '<i class="fas fa-crown" style="color: gold; text-shadow: 1px 1px 2px white;"></i>' : playerThis[0].RankInTier === 2 ? '<i class="fas fa-crown" style="color: silver; text-shadow: 1px 1px 2px white;"></i>' : playerThis[0].RankInTier === 3 ? '<i class="fas fa-crown" style="color: #cd7f32; text-shadow: 1px 1px 2px white; opacity: 0.4"></i>' : ''} / ${playerThis[0].Race}</h4>
                        <div id="trophies">${kplTrophiesHtml}</div>
                        <div id="medals">
                            ${goldMedalsHtml}
                            ${silverMedalsHtml}
                        </div>
                    </div>                    
                    ${compare ? `
                    <div id="player-infovs" class="container text-center"> VS </div>
                    <div id="player-info2" class="container text-center grey-color">
                    <h2 id="player-id">${playerThat[0].ID}</h2>
                        <h4 id="player-race2">Rank-${playerThat[0].Rank} / ELO ${playerThat[0].Point} / ${playerThat[0].Tier}-${playerThat[0].RankInTier} ${playerThat[0].RankInTier === 1 ? '<i class="fas fa-crown" style="color: gold; text-shadow: 1px 1px 2px white;"></i>' : playerThat[0].RankInTier === 2 ? '<i class="fas fa-crown" style="color: silver; text-shadow: 1px 1px 2px white;"></i>' : playerThat[0].RankInTier === 3 ? '<i class="fas fa-crown" style="color: #cd7f32; text-shadow: 1px 1px 2px white; opacity: 0.4"></i>' : ''} / ${playerThat[0].Race}</h4>
                    </div>
                    ` : ''}
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
                                        <td colspan="2" style="text-align: center;" class="subtitle-stats"> 종족별 전적  </td>
                                    </tr>                           
                                    <tr>
                                        <td style="text-align: center;">T vs T</td>
                                        <td>${playTWinsVsT}승 ${playTLosesVsT}패, 승률 ${playTRateVsT.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">T vs P</td>
                                        <td>${playTWinsVsP}승 ${playTLosesVsP}패, 승률 ${playTRateVsP.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">T vs Z</td>
                                        <td>${playTWinsVsZ}승 ${playTLosesVsZ}패, 승률 ${playTRateVsZ.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                    <td style="text-align: center;">P vs T</td>
                                        <td>${playPWinsVsT}승 ${playPLosesVsT}패, 승률 ${playPRateVsT.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">P vs P</td>
                                        <td>${playPWinsVsP}승 ${playPLosesVsP}패, 승률 ${playPRateVsP.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">P vs Z</td>
                                        <td>${playPWinsVsZ}승 ${playPLosesVsZ}패, 승률 ${playPRateVsZ.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                    <td style="text-align: center;">Z vs T</td>
                                        <td>${playZWinsVsT}승 ${playZLosesVsT}패, 승률 ${playZRateVsT.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">Z vs P</td>
                                        <td>${playZWinsVsP}승 ${playZLosesVsP}패, 승률 ${playZRateVsP.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;">Z vs Z</td>
                                        <td>${playZWinsVsZ}승 ${playZLosesVsZ}패, 승률 ${playZRateVsZ.toFixed(2)}%</td>
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
                                        <td style="text-align: center;"> KPL </td>
                                        <td colspan="2" style="text-align: center;"> ${KPLWin}승 ${KPLLose}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 공식이벤트 </td>
                                        <td colspan="2" style="text-align: center;"> ${EventWin}승 ${EventLose}패</td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> 풀리그 </td>
                                        <td colspan="2" style="text-align: center;"> ${FullWin}승 ${FullLose}패 </td>
                                    </tr>    
                                    <tr>
                                        <td style="text-align: center;"> ELO </td>
                                        <td colspan="2" style="text-align: center;"> ${ELOWin}승 ${ELOLose}패 </td>
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
                                        <td style="text-align: center;"> Gold </td>
                                        <td style="text-align: center;"> ${GoldWins}승 ${GoldLoses}패 </td>
                                        <td style="text-align: center;"> ${vsGoldWins}승 ${vsGoldLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> Yellow </td>
                                        <td style="text-align: center;"> ${YellowWins}승 ${YellowLoses}패 </td>
                                        <td style="text-align: center;"> ${vsYellowWins}승 ${vsYellowLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> Red </td>
                                        <td style="text-align: center;"> ${RedWins}승 ${RedLoses}패 </td>
                                        <td style="text-align: center;"> ${vsRedWins}승 ${vsRedLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> Violet </td>
                                        <td style="text-align: center;"> ${VioletWins}승 ${VioletLoses}패 </td>
                                        <td style="text-align: center;"> ${vsVioletWins}승 ${vsVioletLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> Blue </td>
                                        <td style="text-align: center;"> ${BlueWins}승 ${BlueLoses}패 </td>
                                        <td style="text-align: center;"> ${vsBlueWins}승 ${vsBlueLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> Sky </td>
                                        <td style="text-align: center;"> ${SkyWins}승 ${SkyLoses}패 </td>
                                        <td style="text-align: center;"> ${vsSkyWins}승 ${vsSkyLoses}패 </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: center;"> White </td>
                                        <td style="text-align: center;"> ${WhiteWins}승 ${WhiteLoses}패 </td>
                                        <td style="text-align: center;"> ${vsWhiteWins}승 ${vsWhiteLoses}패 </td>
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


    const playerInfoDiv = document.getElementById('trophies');
    // playerInfoDiv.innerHTML = `
    //     <h2 id="player-id">${playerThis[0].ID}</h2>
    //     <h4 id="player-race">${playerThis[0].Team} / ${playerThis[0].Tier} / ${playerThis[0].Race}</h3>
    //     <div id="trophies">${trophiesHtml}</div>
    //     <div id="medals">
    //         ${goldMedalsHtml}
    //         ${silverMedalsHtml}
    //     </div>
    // `;
    
    // Add event listener to the player-info div to show/hide the tooltip
    playerInfoDiv.addEventListener('mouseover', (event) => {
        const tooltipText = playerThis[0].EventAttendTeam || playerThis[0].EventAttendIndi;
        if (tooltipText) {
            showTooltip(event.pageX, event.pageY, tooltipText);
        }
      });
      
      playerInfoDiv.addEventListener('mouseout', () => {
        hideTooltip();
      });

    // Add event listeners to the trophy and medal images to show/hide the tooltip
    const trophyImages = document.querySelectorAll('.trophy');
    trophyImages.forEach((trophyImage) => {
        trophyImage.addEventListener('mouseover', (event) => {
            const tooltipText = event.target.getAttribute('title');
            if (tooltipText) {
                showTooltip(event.pageX, event.pageY, tooltipText);
            }
        });
        trophyImage.addEventListener('mouseout', () => {
            hideTooltip();
        });
    });

    const medalImages = document.querySelectorAll('.medal');
    medalImages.forEach((medalImage) => {
        medalImage.addEventListener('mouseover', (event) => {
            const tooltipText = event.target.getAttribute('title');
            if (tooltipText) {
                showTooltip(event.pageX, event.pageY, tooltipText);
            }
        });
        medalImage.addEventListener('mouseout', () => {
            hideTooltip();
        });
    });

    

    // Show and hide the tooltip
    function showTooltip(x, y, text) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');
        
        // declare and initialize the variable
        const tooltipText = text;
        tooltip.textContent = tooltipText;
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
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
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
    displayStatistics(filteredResults, tableName, keyword, false);
}

function search() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    
    if (keyword !== '') {
        // Show the loading spinner, hide the button text, and disable the button
        document.getElementById('buttonSpinner').classList.remove('d-none');
        document.getElementById('buttonText').classList.add('d-none');
        document.getElementById('searchButton').disabled = true;

        fetchGoogleSheetData()
            .then(gameResults => {
                const filteredResults = gameResults.filter(result => {
                    return (
                        result.WinnerID.toLowerCase() === keyword ||
                        result.LoserID.toLowerCase() === keyword
                    );
                });
                
                displayData(filteredResults, 'rankingTableBody', 100, 1);
                displayStatistics(filteredResults, 'statsTable', keyword, false);
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

        fetchGoogleSheetData()
            .then(gameResults => {
                displayData(gameResults, 'rankingTableBody', 100, 1);
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
    if (keyword1 !== '' && keyword2 !== '') {
        // Show the loading spinner, hide the button text, and disable the button
        document.getElementById('buttonSpinner2').classList.remove('d-none');
        document.getElementById('buttonText2').classList.add('d-none');
        document.getElementById('searchButton2').disabled = true;

        fetchGoogleSheetData()
            .then(gameResults => {
                const filteredResults = gameResults.filter(result => {
                    return (
                        (result.WinnerID.toLowerCase() === keyword1 && result.LoserID.toLowerCase() === keyword2) ||
                        (result.LoserID.toLowerCase() === keyword1 && result.WinnerID.toLowerCase() === keyword2) 
                    );
                });

                displayData(filteredResults, 'rankingTableBody2', 100, 1);
                displayStatistics(filteredResults, 'statsTable2', keyword1, keyword2);
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


document.getElementById('searchButton').addEventListener('click', search);
document.getElementById('searchButton2').addEventListener('click', searchTwo);

document.getElementById("searchInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("searchButton").click();
    }
});

document.getElementById("searchInput1").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("searchButton2").click();
    }
});

document.getElementById("searchInput2").addEventListener("keydown", function(event) {
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
fetchPlayerData().then(playerInfo => {
    playerInfoGlobal = playerInfo;
    updatePlayerIdList();
    // console.log(playerInfoGlobal)
});

fetchGoogleSheetData().then(gameResults => {
    const spinLoading = document.getElementById("loading-totalData");
    spinLoading.style.display = "block"; // show loading spinner
    gameResultsGlobal = gameResults;
    displayData(gameResults, 'gameTableTotalBody', 100, 1);
    spinLoading.style.display = "none"; // show loading spinner
});

document.querySelectorAll('.filter-header').forEach(header => {
    header.addEventListener('click', handleHeaderClick);
  });
  

function handleHeaderClick(event) {
    const field = event.target.dataset.field;
    const uniqueValues = new Set(gameResults.map(result => result[field]));
  
    const dropdown = document.createElement('select');
    dropdown.style.position = 'absolute';
    dropdown.style.left = `${event.clientX}px`;
    dropdown.style.top = `${event.clientY}px`;
  
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'All';
    dropdown.appendChild(defaultOption);
  
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.textContent = value;
      dropdown.appendChild(option);
    });
  
    dropdown.addEventListener('change', event => {
      filterTable(field, event.target.value);
    });
  
    document.body.appendChild(dropdown);
    dropdown.focus();
  
    dropdown.addEventListener('blur', () => {
      document.body.removeChild(dropdown);
    });
  }

  
function filterTable(field, value) {
    const spinLoading = document.getElementById("loading-totalData");
    spinLoading.style.display = "block"; // show loading spinner
    const filteredResults = gameResults.filter(result => (value === 'All' || result[field] === value));
    displayData(filteredResults, 'gameTableTotalBody', 100, 1);
    spinLoading.style.display = "none"; // show loading spinner
  }
  

function populatePlayerListTable(playerResults) {
    const tableBody = document.getElementById("playerListTableBody");
    tableBody.innerHTML = "";

    for (const player of playerResults) {
        if (!player.ID || !player.Tier) {
            continue; // Skip to the next iteration if ID or Tier is empty
        }
        
        const row = tableBody.insertRow();
        row.insertCell().textContent = player.Rank;
        row.insertCell().textContent = player.Point;

        const idCell = row.insertCell();
        idCell.innerHTML = `${player.ID} ${player.RankInTier === 1 ? '<i class="fas fa-crown" style="color: gold; text-shadow: 1px 1px 2px white;"></i>' : player.RankInTier === 2 ? '<i class="fas fa-crown" style="color: silver; text-shadow: 1px 1px 2px white;"></i>' : player.RankInTier === 3 ? '<i class="fas fa-crown" style="color: #cd7f32; text-shadow: 1px 1px 2px white; opacity: 0.4"></i>' : ''}${(() => {
            let wins = 0;
            let runnerUps = 0;
        
            if (player.EventAttendTeam.includes('우승')) {
                wins = player.EventAttendTeam.match(/우승/g).length;
            }
        
            if (player.EventAttendTeam.includes('준우승')) {
                runnerUps = player.EventAttendTeam.match(/준우승/g).length;
            }
        
            let stars = '';
            // for (let i = 0; i < wins-runnerUps; i++) {
            //     stars += '<i class="fas fa-star" style="color: gold;"></i>';
            // }
        
            // for (let i = 0; i < runnerUps; i++) {
            //     stars += '<i class="fas fa-star" style="color: silver;"></i>';
            // }
        
            return stars;
        })()}`;
        
        idCell.style.cursor = "pointer";
        idCell.addEventListener("click", () => {
            displayPlayerStatsModal(player.ID.toLowerCase());
        });

        row.insertCell().textContent = player.Tier;
        row.insertCell().textContent = player.Race;
        row.insertCell().textContent = player.Win;
        row.insertCell().textContent = player.Lose;
        row.insertCell().textContent = player.WinRate;
        row.insertCell().textContent = player.Games;
    }
}


function displayPlayerStatsModal(player) {
    // Call your function to populate the player stats table here
    populatePlayerStatsTable(player, "statsTableModal");

    // Show the modal
    const playerStatsModal = new bootstrap.Modal(document.getElementById("playerStatsModal"));
    playerStatsModal.show();
}

let sortAsc = true; // initial sort order is ascending

document.querySelectorAll("#playerListTable th").forEach(headerCell => {
  headerCell.addEventListener("click", () => {
    const sortBy = headerCell.dataset.sortKey;
    sortAsc = !sortAsc; // toggle the sort order
    const sortedData = [...playerResults].sort((a, b) => {
      const sortMultiplier = sortAsc ? 1 : -1; // set the sort multiplier based on the sort order
      let sortValueA = a[sortBy];
      let sortValueB = b[sortBy];
      if (sortBy === 'WinRate') { // convert WinRate to number if sorting by WinRate
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


document.getElementById("playerSearchInput").addEventListener("input", function (event) {
    const searchValue = event.target.value.toLowerCase().trim();
    const filteredData = playerResults.filter(player => {
        return player.ID.toLowerCase().includes(searchValue);
    });
    populatePlayerListTable(filteredData);
});




let pointChartInstance, tierChartInstance, raceChartInstance;

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
    const sortOrder = ['Gold', 'Yellow', 'Red', 'Violet', 'Blue', 'Sky', 'White'];
    return sortOrder.indexOf(a) - sortOrder.indexOf(b);
}


const kakaoPayIcon = document.getElementById('kakaoPayIcon');
if (kakaoPayIcon) {
  kakaoPayIcon.addEventListener('click', () => {
    const modalEl = document.getElementById('kakaoPayModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } else {
      console.error('KakaoPayModal element not found');
    }
  });
} else {
  console.error('KakaoPayIcon element not found');
}



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



let videosLoaded = false;
showVideo();

function showVideo() {
    if (!videosLoaded) {
        displayVideoGallery();
        videosLoaded = true;
    }
}

function displayVideoGallery() {
    // YouTube channel ID
    const channelId = googleConfig.youTubeChannelId; // Replace with your channel ID
    const key = googleConfig.youTubeKey;

    // Fetch videos from YouTube channel using YouTube Data API
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=9&order=date&type=video&key=${key}`)
        .then(response => response.json())
        .then(data => {
            const videoContainer = document.getElementById('videoRow');
            videoContainer.innerHTML = '';

            data.items.forEach(item => {
                const videoId = item.id.videoId;
                const videoTitle = item.snippet.title;
                const col = document.createElement('div');
                col.classList.add('col-md-4', 'col-lg-4', 'mb-4');

                const videoFrame = document.createElement('iframe');
                videoFrame.src = `https://www.youtube.com/embed/${videoId}`;
                videoFrame.width = '100%';
                videoFrame.height = '315';
                videoFrame.title = videoTitle;
                videoFrame.allowFullscreen = true;

                col.appendChild(videoFrame);
                videoContainer.appendChild(col);
            });
        })
        .catch(error => {
            console.error('Error fetching YouTube videos:', error);
        });
}

function updatePlayerIdList() {
    const playerIdList = document.getElementById("playerIds");
    playerIdList.innerHTML = "";
    playerInfoGlobal.forEach(player => {
      const option = document.createElement("option");
      option.value = player.ID;
      playerIdList.appendChild(option);
    });
}


function displayPaginationButtons(totalItems, pageContainerName, itemsPerPage, currentPage, displayFunction) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById(pageContainerName);
    paginationContainer.innerHTML = '';

    const createButton = (text, isEnabled, onClick) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('btn', 'btn-sm', 'mx-1');
        button.disabled = !isEnabled;
        button.addEventListener('click', onClick);

        if (isEnabled) {
            button.classList.add('btn-outline-primary');
        } else {
            button.classList.add('btn-secondary');
        }

        return button;
    };

    const firstButton = createButton('First', currentPage > 1, () => {
        displayFunction(1);
    });

    const prevButton = createButton('Prev', currentPage > 1, () => {
        displayFunction(currentPage - 1);
    });

    const nextButton = createButton('Next', currentPage < totalPages, () => {
        displayFunction(currentPage + 1);
    });

    const lastButton = createButton('Last', currentPage < totalPages, () => {
        displayFunction(totalPages);
    });

    paginationContainer.appendChild(firstButton);
    paginationContainer.appendChild(prevButton);

    const maxButtonsToShow = 5;
    const halfRange = Math.floor(maxButtonsToShow / 2);
    let startPage = Math.max(1, currentPage - halfRange);
    let endPage = Math.min(totalPages, currentPage + halfRange);

    if (currentPage - halfRange < 1) {
        endPage = Math.min(totalPages, maxButtonsToShow);
    }

    if (currentPage + halfRange > totalPages) {
        startPage = Math.max(1, totalPages - maxButtonsToShow + 1);
    }

    if (startPage > 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        paginationContainer.appendChild(ellipsis);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = createButton(i, i !== currentPage, () => {
            displayFunction(i);
        });

        if (i === currentPage) {
            button.classList.add('btn-primary');
        }

        paginationContainer.appendChild(button);
    }

    if (endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        paginationContainer.appendChild(ellipsis);
    }

    paginationContainer.appendChild(nextButton);
    paginationContainer.appendChild(lastButton);
}

export { fetchPlayerData, populatePlayerListTable };

// Function to check if an image file exists
function imageExists(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imageUrl;
    });
}

// Get all the menu items
const menuItems = document.querySelectorAll('.nav-link');

// Add a click event listener to each menu item
menuItems.forEach(item => {
  item.addEventListener('click', function() {
    // Remove the "active" class from all the menu items
    menuItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add the "active" class to the clicked menu item
    this.classList.add('active');
  });
});

function addKakaoAd(adRef) {
    if (adRef) {
      return;
    }
  
    const ins = document.createElement('ins');
    const script = document.createElement('script');
  
    ins.className = 'kakao_ad_area';
    ins.setAttribute('style', 'display: none;');
    ins.removeAttribute('user-select');
  
    // Window size-dependent ad size and unit ID
    const windowSize = window.innerWidth;
    ins.dataset.adWidth = (windowSize < 800) ? '320' : '728';
    ins.dataset.adHeight = (windowSize < 800) ? '50' : '90';
    ins.dataset.adUnit = (windowSize < 800) ? 'DAN-Ixy6G0JUxb9AWanm' : 'DAN-kMiHbxeKQnoSsyVT';
  
    script.async = false;
    script.type = 'text/javascript';
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.removeAttribute('user-select');
    script.setAttribute('async', ''); // Set async attribute without empty value

  
    const kakaoadSection = document.querySelector('#kakaoadSection');
    kakaoadSection?.appendChild(ins);
    kakaoadSection?.appendChild(script);
    
    // Update the ad loading status
    adRef = true;
    return adRef;
  }
  
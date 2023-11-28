// sheetAddress = "1fuQMaDOy4gNxR3MieEadhBnc1e0b0IrXjCNtLrC4ksU";

// var docParam = SpreadsheetApp.openById(sheetAddress).getSheetByName('설정');
// docParam_range = docParam.getRange(4,3,40,6);
// setParam = docParam_range.getValues();

// basicPointTier_HEL1 = setParam[1][1];
// basicPointTier_HEL2 = setParam[2][1];
// basicPointTier_AEL = setParam[3][1];
// basicPointTier_MEL = setParam[4][1];
// basicPointTier_IEL = setParam[5][1];
// basicPointTier_CEL1 = setParam[6][1];
// basicPointTier_CEL2 = setParam[7][1];
// basicPointTier_CEL3 = setParam[8][1];
// upPointTier_HEL1 = setParam[1][2];
// upPointTier_HEL2 = setParam[2][2];
// upPointTier_AEL = setParam[3][2];
// upPointTier_MEL = setParam[4][2];
// upPointTier_IEL = setParam[5][2];
// upPointTier_CEL1 = setParam[6][2];
// upPointTier_CEL2 = setParam[7][2];
// downPointTier_HEL2 = setParam[2][3];
// downPointTier_AEL = setParam[3][3];
// downPointTier_MEL = setParam[4][3];
// downPointTier_IEL = setParam[5][3];
// downPointTier_CEL1 = setParam[6][3];
// downPointTier_CEL2 = setParam[7][3];
// downPointTier_CEL3 = setParam[8][3];

// goUpRefPoint_HEL1 = setParam[1][4];
// goUpRefPoint_HEL2 = setParam[2][4];
// goUpRefPoint_AEL = setParam[3][4];
// goUpRefPoint_MEL = setParam[4][4];
// goUpRefPoint_IEL = setParam[5][4];
// goUpRefPoint_CEL1 = setParam[6][4];
// goUpRefPoint_CEL2 = setParam[7][4];

// goDownRefPoint_HEL2 = setParam[2][5];
// goDownRefPoint_AEL = setParam[3][5];
// goDownRefPoint_MEL = setParam[4][5];
// goDownRefPoint_IEL = setParam[5][5];
// goDownRefPoint_CEL1 = setParam[6][5];
// goDownRefPoint_CEL2 = setParam[7][5];
// goDownRefPoint_CEL3 = setParam[8][5];

// refPoint = setParam[10][1];
// refPointAbsent = setParam[11][1]; 

// // Logger.log(upPointTier_HEL1)
// // Logger.log(downPointTier_MEL);

// weight_STL = setParam[13][1];
// weight_SIL = setParam[14][1];
// weight_HST = setParam[15][1];
// weight_ClanTeam = setParam[16][1];
// weight_ClanIndi = setParam[17][1];
// weight_Other = setParam[18][1];

// set_weight_ace = setParam[22][1];
// set_weight_final = setParam[23][1];
// set_weight_semifinal = setParam[24][1];
// set_weight_34rank = setParam[25][1];
// set_weight_PO = setParam[26][1];

// tier_weight_HEL1lose = setParam[31][1];
// tier_weight_CEL3win = setParam[32][1];
	

// // Logger.log(weight_Clan)
// // Logger.log(weight_STL)

// function calculateELO() {
//   // 주종 입력
//   var docplayer = SpreadsheetApp.openById(sheetAddress).getSheetByName('선수Data');
//   var numRowPlayer = docplayer.getLastRow();
//   playerRange = docplayer.getRange(2,2,numRowPlayer,3);
//   playerData = playerRange.getValues();

//   var PlayersMainRace = new Map();

//   for (i=0; i<numRowELO; i++) {
//     playerID = playerData[i][1].toUpperCase();
//     playerRace = playerData[i][2].toUpperCase();

//     PlayersMainRace.set(playerID, playerRace);
//   }

//   //load game data
//   var doc = SpreadsheetApp.openById(sheetAddress).getSheetByName('전체리그Data');
//   var numRow = doc.getLastRow();
//   gameRange = doc.getRange(2,1,numRow,9);
//   gameData = gameRange.getValues();
//   // Logger.log(numRow)
//   //Logger.log(gameData)

//   var PlayersElo = new Map();
//   var PlayersTier = new Map();
//   var PlayersStat = new Map();

//   for (i=0; i<numRow; i++) {
//     // Date	WinnerTier	WinnerID	WinnerRace	LoserTier	LoserID	LoserRace	League1	League2 
//     winnerTier = gameData[i][1].toString();
//     winnerID = gameData[i][2].toString().toUpperCase();
//     winnerRace = gameData[i][3].toString().toUpperCase();
//     winner = winnerID + "&" + winnerRace
//     loserTier = gameData[i][4].toString();
//     loserID = gameData[i][5].toString().toUpperCase();
//     loserRace = gameData[i][6].toString().toUpperCase();
//     loser = loserID + "&" + loserRace
//     league = gameData[i][7];
//     gameSet = gameData[i][8].toString().toUpperCase();

//     // 없으면 플레이어 초기화
//     if (PlayersElo.get(winner) == null) {
//       if (winnerRace == PlayersMainRace.get(winner)) {
//         PlayersElo.set(winner, initElo(winnerTier));
//       } else {
//         PlayersElo.set(winner, initElo(winnerTier)-200);
//       }
      
//       PlayersTier.set(winner, winnerTier);
//       PlayersStat.set(winner, newStat());
//     } else if (PlayersTier.get(winner) != winnerTier) {
//       PlayersElo.set(winner, changeElo(PlayersTier.get(winner), winnerTier));
//       PlayersTier.set(winner, winnerTier);
//       PlayersStat.set(winner, newStat());
//     }
//     if (PlayersElo.get(loser) == null) {
//       if (loserRace == PlayersMainRace.get(loser)) {
//         PlayersElo.set(loser, initElo(loserTier));
//       } else {
//         PlayersElo.set(loser, initElo(loserTier)-200);
//       }
      
//       PlayersTier.set(loser, loserTier);
//       PlayersStat.set(loser, newStat());
//     } else if (PlayersTier.get(loser) != loserTier) {
//       PlayersElo.set(loser, changeElo(PlayersTier.get(loser), loserTier));
//       PlayersTier.set(loser, loserTier);
//       PlayersStat.set(loser, newStat());
//     }

//     // ELO 점수 업데이트
//     newELO = updateELO(PlayersElo.get(winner), PlayersElo.get(loser), refPointChecker(gameSet), weightLeague(league), weightTier(winnerTier, loserTier), weightSet(gameSet, league));
//     record = [[PlayersElo.get(winner),newELO[0]-PlayersElo.get(winner),newELO[0], PlayersElo.get(loser),newELO[1]-PlayersElo.get(loser),newELO[1]]];

//     // 승패 업데이트    
//     newStatWinner = updateStat(PlayersStat.get(winner), gameData[i][7], true);
//     newStatLoser = updateStat(PlayersStat.get(loser), gameData[i][7], false);
//     PlayersStat.set(winner, newStatWinner);
//     PlayersStat.set(loser, newStatLoser);

//     PlayersElo.set(winner, newELO[0]);
//     PlayersElo.set(loser, newELO[1]);

//     // record each game
//     gameRangeRecord = doc.getRange(2+i,10,1,6);
//     gameRangeRecord.setValues(record);

//   }
  
//   // for (var [key, value] of PlayersElo) {
//   //   console.log(key + ' = ' + value);
//   // }

//   // for (var [key, value] of PlayersStat) {
//   //   console.log(key + ' = ' + value.HTwin, value.HTlose, value.HIwin, value.HIlose, value.Owin, value.Olose);
//   // }
  
//   var docELO = SpreadsheetApp.openById(sheetAddress).getSheetByName('선수Data');
//   var numRowELO = docELO.getLastRow();
//   playerRange = docELO.getRange(2,2,numRowELO,3);
//   playerData = playerRange.getValues();

//   for (i=0; i<numRowELO; i++) {
//     playerTier = playerData[i][0];
//     playerID = playerData[i][1].toUpperCase();
//     playerRace = playerData[i][2].toUpperCase();

//     player = playerID + "&" + playerRace
//     if (PlayersElo.get(player) == null) {
//       ELO = initElo(playerTier)
//       stat = newStat();
//     } else if (PlayersTier.get(player) != playerTier) {
//       ELO = changeElo(PlayersTier.get(player), playerTier)
//       stat = newStat();
//     } else {
//       ELO = PlayersElo.get(player)
//       stat = PlayersStat.get(player);
//     }

//     // 티어 변동 여부 체크
//     tierChanged = tierChangeChecker(playerTier, ELO);

//     stats = [[ELO, tierChanged, stat.HTwin, stat.HTlose, stat.HIwin, stat.HIlose, stat.Owin, stat.Olose]];
//     docELO.getRange(2+i,5,1,8).setValues(stats);
//   }

// }

// function newStat() { 
//   var a = {HTwin: 0, HTlose: 0, HIwin: 0, HIlose: 0, Owin: 0, Olose: 0};

//   return a;
// }

// function initElo(tier) {
//   switch(tier) {
//     case "HEL1":
//       return basicPointTier_HEL1;
//     case "HEL2": 
//       return basicPointTier_HEL2;
//     case "AEL":
//       return basicPointTier_AEL;
//     case "MEL": 
//       return basicPointTier_MEL;
//     case "IEL":
//       return basicPointTier_IEL;
//     case "CEL1": 
//       return basicPointTier_CEL1;
//     case "CEL2":
//       return basicPointTier_CEL2;
//     case "CEL3": 
//       return basicPointTier_CEL3;
//     default:
//       return 500;
//   }
// }

// function changeElo(beforeTier, afterTier) {
//   switch(afterTier) {
//     case "HEL1":
//       return upPointTier_HEL1;
//     case "HEL2": 
//       if (beforeTier=="HEL1") return downPointTier_HEL2;
//       else return upPointTier_HEL2;
//     case "AEL":
//       if (beforeTier=="HEL2") return downPointTier_AEL;
//       else return upPointTier_AEL;
//     case "MEL": 
//       if (beforeTier=="AEL") return downPointTier_MEL;
//       else return upPointTier_MEL;
//     case "IEL":
//       if (beforeTier=="MEL") return downPointTier_IEL;
//       else return upPointTier_IEL;
//     case "CEL1": 
//       if (beforeTier=="IEL") return downPointTier_CEL1;
//       else return upPointTier_CEL1;
//     case "CEL2":
//       if (beforeTier=="CEL1") return downPointTier_CEL2;
//       else return upPointTier_CEL2;
//     case "CEL3": 
//       return downPointTier_CEL3;
//     default:
//       return 500;
//   }
// }

// function tierChangeChecker(playerTier, ELO) {
//   switch(playerTier) {
//     case "HEL1":
//       if (ELO <= goDownRefPoint_HEL2) return "강등 > HEL2"
//       return "";
//     case "HEL2": 
//       if (ELO <= goDownRefPoint_AEL) return "강등 > AEL"
//       else if (ELO >= goUpRefPoint_HEL1) return "승급 > HEL1"
//       return "";
//     case "AEL":
//       if (ELO <= goDownRefPoint_MEL) return "강등 > MEL"
//       else if (ELO >= goUpRefPoint_HEL2) return "승급 > HEL2"
//       return "";
//     case "MEL": 
//       if (ELO <= goDownRefPoint_IEL) return "강등 > IEL"
//       else if (ELO >= goUpRefPoint_AEL) return "승급 > AEL"
//       return "";
//     case "IEL":
//       if (ELO <= goDownRefPoint_CEL1) return "강등 > CEL1"
//       else if (ELO >= goUpRefPoint_MEL) return "승급 > MEL"
//       return "";
//     case "CEL1": 
//       if (ELO <= goDownRefPoint_CEL2) return "강등 > CEL2"
//       else if (ELO >= goUpRefPoint_IEL) return "승급 > IEL"
//       return "";
//     case "CEL2":
//       if (ELO <= goDownRefPoint_CEL3) return "강등 > CEL3"
//       else if (ELO >= goUpRefPoint_CEL1) return "승급 > CEL1"
//       return "";
//     case "CEL3": 
//       if (ELO >= goUpRefPoint_CEL2) return "승급 > CEL2"
//       return "";
//     default:
//       return "";
//   }
// }

// function weightLeague(league) {
//   if (league.includes("KPL") || league.includes("WPL") || league.includes("TPL") || league.includes("KaLeague")  || league.includes("WE CLAN LEAGUE") || league.includes("하믹 청정수리그 S3") ) return weight_ClanTeam; // 클랜/이벤트 팀리그
//   else if (league.includes("청정수리그") || league.includes("포워드배 오픈컵") ) return weight_ClanIndi; // 클랜/이벤트 개인리그
//   else if (league.includes("team") || league.includes("Team") || league.includes("TEAM")) return weight_STL; // hamic team leauge
//   else if (league.includes("HST")) return weight_HST; // 
//   else if (league.includes("HEL")||league.includes("AEL")||league.includes("MEL")||league.includes("IEL")||league.includes("CEL")) return weight_SIL; // 
//   return weight_Other; // other
// }

// function weightTier(winnerTier, loserTier) {
//   if (loserTier == "HEL1" ) {
//     tier_weight = tier_weight_HEL1lose;
//   } else if (winnerTier == "CEL3") {
//     tier_weight = tier_weight_CEL3win;
//   } else {
//     tier_weight = 1.0;
//   }

//   return tier_weight;
// }

// function weightSet(gameSet, league) {
//   if (gameSet.includes("ACE") || gameSet.includes("에이스")) {
//     set_weight = set_weight_ace;
//   } else if (gameSet.includes("PO")) {
//     set_weight = set_weight_PO;
//   } else if (gameSet.includes("FINAL") && (league.includes("team") || league.includes("Team") || league.includes("TEAM"))) {
//     set_weight = set_weight_PO;
//   } else if (gameSet.includes("SEMIFINAL") || gameSet.includes("SEMI FINAL") || gameSet.includes("4강")) {
//     set_weight = set_weight_semifinal;
//   } else if (gameSet.includes("FINAL")) {
//     set_weight = set_weight_final;
//   } else if (gameSet.includes("4위전")) {
//     set_weight = set_weight_34rank;
//   } else {
//     set_weight = 0.0;
//   }

//   return set_weight;
// }

// function refPointChecker(gameSet) {
//   if (gameSet.includes("부전")) return refPointAbsent;
//   else return refPoint;
// }

// function updateStat(stat, league, win) {
//   if (league.includes("KPL") || league.includes("WPL")|| league.includes("TPL") || league.includes("KaLeague")  || league.includes("WE CLAN LEAGUE") || league.includes("하믹 청정수리그 S3") ) {
//     if (win == true ) {stat.Owin = stat.Owin + 1;}
//     else {stat.Olose = stat.Olose + 1;}
//   }
//   else if (league.includes("청정수리그") || league.includes("포워드배 오픈컵") ) {
//     if (win == true ) {stat.Owin = stat.Owin + 1;}
//     else {stat.Olose = stat.Olose + 1;}
//   }
//   else if (league.includes("team") || league.includes("Team") ) {
//     if (win == true ) {stat.HTwin = stat.HTwin + 1;}
//     else {stat.HTlose = stat.HTlose + 1;}
//   }
//   else if (league.includes("HST")) {
//     if (win == true ) {stat.HIwin = stat.HIwin + 1;}
//     else {stat.HIlose = stat.HIlose + 1;}
//   }
//   else if (league.includes("HEL")||league.includes("AEL")||league.includes("MEL")||league.includes("IEL")||league.includes("CEL")) {
//     if (win == true ) {stat.HIwin = stat.HIwin + 1;}
//     else {stat.HIlose = stat.HIlose + 1;}
//   }
//   return stat;
// }

// function updateELO(rw, rl, refPoints, weight, tier_weight, set_weight) {
//   Pw = prob(rl, rw);
//   Pl = prob(rw, rl);

//   rw_new = rw + refPoints * (weight + set_weight) * tier_weight * (1 - Pw); 
//   rl_new = rl + refPoints * (weight + set_weight) * tier_weight * (0 - Pl); 

//   return [rw_new, rl_new];  
// }

// function prob(r1, r2) {
//   return 1.0 * 1.0 / (1 + 1.0 * Math.pow(10, 1.0 * (r1 - r2) / 400));
  
// }
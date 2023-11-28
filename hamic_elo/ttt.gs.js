// sheetAddress = "1YNpMGhZmJ_pWAN5QOq1dzur2BuSiAwgtEbd7qchZN6Q";
// // Define system parameters
// var beta = 25.0;
// var tau = 0.5;
// var draw_probability = 0.01;


// var docParam = SpreadsheetApp.openById(sheetAddress).getSheetByName('설정');
// docParam_range = docParam.getRange(4,3,40,8);
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

// divideRefPoint_HEL1_HEL2 = setParam[1][7];
// divideRefPoint_HEL2_AEL = setParam[2][7];
// divideRefPoint_AEL_MEL = setParam[3][7];
// divideRefPoint_MEL_IEL = setParam[4][7];
// divideRefPoint_IEL_CEL1 = setParam[5][7];
// divideRefPoint_CEL1_CEL2 = setParam[6][7];
// divideRefPoint_CEL2_CEL3 = setParam[7][7];

// refPoint = setParam[10][1];
// refPointAbsent = setParam[11][1]; 

// // Logger.log(upPointTier_HEL1)
// // Logger.log(downPointTier_MEL);

// weight_STL = setParam[13][1];
// weight_SILHST = setParam[14][1];
// weight_EventTeam = setParam[15][1];
// weight_EventIndi = setParam[16][1];
// weight_ClanTeam = setParam[17][1];
// weight_ClanIndi = setParam[18][1];
// weight_Other = setParam[19][1];

// set_weight_ace = setParam[22][1];
// set_weight_final = setParam[23][1];
// set_weight_semifinal = setParam[24][1];
// set_weight_34rank = setParam[25][1];
// set_weight_PO = setParam[26][1];

// tier_weight_HEL1lose = setParam[31][1];
// tier_weight_CEL3win = setParam[32][1];
	
// time_weight_last = setParam[37][1];
// time_weight_first = setParam[38][1];
// const first_time = new Date("2021.03.01").getTime();
// const last_time = new Date("2023.04.01").getTime();

// // Logger.log(weight_Clan)
// // Logger.log(weight_STL)

// function mainCalculateTTT() {
//   // 주종 입력
//   var docplayer = SpreadsheetApp.openById(sheetAddress).getSheetByName('선수Data');
//   var numRowPlayer = docplayer.getLastRow();
//   playerRange = docplayer.getRange(2,2,numRowPlayer,4);
//   playerData = playerRange.getValues();

//   var PlayersMainRace = new Map();
//   var PlayersTier = new Map();
//   var PlayersStat = new Map();
//   var PlayersTTT = new Map();



//   // 현재 티어의 점수로 초기화함
//   for (i=0; i<numRowPlayer-1; i++) {
//     playerTier = playerData[i][0].toUpperCase();
//     playerID = playerData[i][1].toUpperCase();
//     playerRace = playerData[i][2].toUpperCase();
//     playerTierChanged = playerData[i][3];

//     player = playerID + "&" + playerRace
// // 1650 > 1994
// // 1850 > 1995
// // 2050 > 1996
//     PlayersMainRace.set(playerID, playerRace);
//     PlayersTTT.set(player, {
//       mean: changeTTT_init(playerTier, playerTierChanged),
//       variance: changeTTT_init(playerTier, playerTierChanged) / 30
//     }); // 최근 승급/강등 선수는 경계값으로 세팅해줌
//     PlayersStat.set(player, newStat());
//     PlayersTier.set(playerID, playerTier);

//     if (PlayersTTT.get(player) == 500) {
//       Logger.log(PlayersTTT.get(player))
//       Logger.log(playerID)
//       Logger.log(playerRace)
//       Logger.log(playerTier)
//     }
    
//   }

//   //load game data
//   var doc = SpreadsheetApp.openById(sheetAddress).getSheetByName('전체리그Data');
//   var numRow = doc.getLastRow();
//   gameRange = doc.getRange(2,1,numRow-1,10);
//   gameData = gameRange.getValues();
//   Logger.log("전체 게임 데이터 수")
//   Logger.log(numRow)
//   //Logger.log(gameData)

  

//   for (jj=0; jj<numRow-1; jj++) {
//     // Date	WinnerTier	WinnerID	WinnerRace	LoserTier	LoserID	LoserRace	League1	League2 
//     date = new Date(gameData[jj][0]);
//     time_weight = (time_weight_last - time_weight_first) / (last_time - first_time) * (date.getTime() - last_time) + time_weight_last;

//     winnerTier = gameData[jj][1].toString().toUpperCase();
//     winnerID = gameData[jj][2].toString().toUpperCase();
//     winnerRace = gameData[jj][3].toString().toUpperCase();
//     winner = winnerID + "&" + winnerRace
//     loserTier = gameData[jj][4].toString().toUpperCase();
//     loserID = gameData[jj][5].toString().toUpperCase();
//     loserRace = gameData[jj][6].toString().toUpperCase();
//     loser = loserID + "&" + loserRace
//     map = gameData[jj][7];
//     league = gameData[jj][8];
//     gameSet = gameData[jj][9].toString().toUpperCase();

//     if (winnerTier == "-" || loserTier == "-" ) continue;

//     // 없으면 플레이어 초기화
//     if (PlayersTTT.get(winner) == null) {
//       if (PlayersMainRace.get(winnerID) == null) {
//         PlayersTTT.set(winner, {
//           mean: initTTT(winnerTier),
//           variance: initTTT(winnerTier) / 30
//         });
//       } else {
//         PlayersTTT.set(winner, {
//           mean: initTTT(winnerTier)-200,
//           variance: (initTTT(winnerTier)-200) / 30
//         });
//       }
      
//       PlayersTier.set(winner, winnerTier);
//       PlayersStat.set(winner, newStat());
//     } 
//     if (PlayersTTT.get(loser) == null) {
//       if (PlayersMainRace.get(loserID) == null) {
//         PlayersTTT.set(loser, {
//           mean: initTTT(loserTier),
//           variance: initTTT(loserTier) / 30
//         });
//       } else {
//         PlayersTTT.set(loser, {
//           mean: initTTT(loserTier)-200,
//           variance: (initTTT(loserTier)-200) / 30
//         });
//       }
      
//       PlayersTier.set(loser, loserTier);
//       PlayersStat.set(loser, newStat());
//     } 

//     // TTT 점수 업데이트
//     newTTT = updateTTT(PlayersTTT.get(winner), PlayersTTT.get(loser), refPointChecker(gameSet), weightLeague(league), weightTier(winnerTier, loserTier), weightSet(gameSet, league), time_weight);
//     record = [[PlayersTTT.get(winner),newTTT[0]-PlayersTTT.get(winner),newTTT[0], PlayersTTT.get(loser),newTTT[1]-PlayersTTT.get(loser),newTTT[1]]];

//     // 승패 업데이트    
//     newStatWinner = updateStat(PlayersStat.get(winner), league, true);
//     newStatLoser = updateStat(PlayersStat.get(loser), league, false);
//     PlayersStat.set(winner, newStatWinner);
//     PlayersStat.set(loser, newStatLoser);

//     // record each game
//     gameRangeRecord = doc.getRange(2+jj,11,1,6);
//     gameRangeRecord.setValues(record);

//   }
  
// function updateStat(stat, league, win) {
//   if (league.includes("KPL") || league.includes("WPL")|| league.includes("TPL") || league.includes("KaLeague")  || league.includes("WE CLAN LEAGUE") || league.includes("하믹 청정수리그 S3") ) {
//     if (win == true ) {stat.Owin = stat.Owin + 1;}
//     else {stat.Olose = stat.Olose + 1;}
//   }
//   else if (league.includes("청정수리그") || league.includes("포워드배 오픈컵")  || league.includes("하믹 연승전") ) {
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
  
//   var docTTTResult = SpreadsheetApp.openById(sheetAddress).getSheetByName('선수Data');
//   var numRowTTTResult = docTTTResult.getLastRow();
//   playerRangeResult = docTTTResult.getRange(2,2,numRowTTTResult-1,3);
//   playerDataResult = playerRangeResult.getValues();

//   for (i=0; i<numRowTTTResult-1; i++) {
//     playerTierR = playerDataResult[i][0].toUpperCase();
//     playerIDR = playerDataResult[i][1].toUpperCase();
//     playerRaceR = playerDataResult[i][2].toUpperCase();

//     playerR = playerIDR + "&" + playerRaceR
    
//     if (PlayersTTT.get(playerR) == null) {
//       TTT = initTTT(playerTierR)
//       stat = newStat();
//     } else {
//       TTT = PlayersTTT.get(playerR)
//       stat = PlayersStat.get(playerR);
//     }

//     // 티어 변동 여부 체크
//     tierChanged = tierChangeChecker(playerTierR, TTT);

//     stats = [[TTT, tierChanged, stat.HTwin, stat.HTlose, stat.HIwin, stat.HIlose, stat.Owin, stat.Olose]];
//     docTTTResult.getRange(2+i,6,1,8).setValues(stats);
//   }

// }

// function newStat() { 
//   var a = {HTwin: 0, HTlose: 0, HIwin: 0, HIlose: 0, Owin: 0, Olose: 0};

//   return a;
// }

// function initTTT(tier) {
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
//       Logger.log(tier);
//       return 500;
//   }
// }

// function changeTTT_init(tier, tierChanged) {
//   switch(tier) {
//     case "HEL1":
//       if (tierChanged.includes("HEL2") && tierChanged.includes("S10")) return (basicPointTier_HEL1+basicPointTier_HEL2)/2;
//       return basicPointTier_HEL1;
//     case "HEL2": 
//       if (tierChanged.includes("AEL") && tierChanged.includes("S10")) return (basicPointTier_AEL+basicPointTier_HEL2)/2;
//       else if (tierChanged.includes("HEL1") && tierChanged.includes("S10")) return (basicPointTier_HEL1+basicPointTier_HEL2)/2;
//       else return basicPointTier_HEL2;
//     case "AEL":
//       if (tierChanged.includes("MEL") && tierChanged.includes("S10")) return (basicPointTier_AEL+basicPointTier_MEL)/2;
//       else if (tierChanged.includes("HEL2") && tierChanged.includes("S10")) return (basicPointTier_AEL+basicPointTier_HEL2)/2;
//       else return basicPointTier_AEL;
//     case "MEL": 
//       if (tierChanged.includes("IEL") && tierChanged.includes("S10")) return (basicPointTier_IEL+basicPointTier_MEL)/2;
//       else if (tierChanged.includes("AEL") && tierChanged.includes("S10")) return (basicPointTier_AEL+basicPointTier_MEL)/2;
//       else return basicPointTier_MEL;
//     case "IEL":
//       if (tierChanged.includes("CEL1") && tierChanged.includes("S10")) return (basicPointTier_IEL+basicPointTier_CEL1)/2;
//       else if (tierChanged.includes("MEL") && tierChanged.includes("S10")) return (basicPointTier_IEL+basicPointTier_MEL)/2;
//       else return basicPointTier_IEL;
//     case "CEL1": 
//       if (tierChanged.includes("CEL2") && tierChanged.includes("S10")) return (basicPointTier_CEL2+basicPointTier_CEL1)/2;
//       else if (tierChanged.includes("IEL") && tierChanged.includes("S10")) return (basicPointTier_IEL+basicPointTier_CEL1)/2;
//       else return basicPointTier_CEL1;
//     case "CEL2":
//       if (tierChanged.includes("CEL3") && tierChanged.includes("S10")) return (basicPointTier_CEL2+basicPointTier_CEL3)/2;
//       else if (tierChanged.includes("CEL1") && tierChanged.includes("S10")) return (basicPointTier_CEL2+basicPointTier_CEL1)/2;
//       else return basicPointTier_CEL2;
//     case "CEL3": 
//       if (tierChanged.includes("CEL2") && tierChanged.includes("S10")) return (basicPointTier_CEL2+basicPointTier_CEL3)/2;
//       else return basicPointTier_CEL3;
//     default:
//       return 500;
//   }
// }


// function changeTTT_init2(tier, tierChanged) {
//   switch(tier) {
//     case "HEL1":
//       if (tierChanged.includes("승급")) return basicPointTier_HEL2;
//       return basicPointTier_HEL1;
//     case "HEL2": 
//       if (tierChanged.includes("승급")) return basicPointTier_AEL;
//       else if (tierChanged.includes("강등")) return basicPointTier_HEL1;
//       else return basicPointTier_HEL2;
//     case "AEL":
//       if (tierChanged.includes("승급")) return basicPointTier_MEL;
//       else if (tierChanged.includes("강등")) return basicPointTier_HEL2;
//       else return basicPointTier_AEL;
//     case "MEL": 
//       if (tierChanged.includes("승급")) return basicPointTier_IEL;
//       else if (tierChanged.includes("강등")) return basicPointTier_AEL;
//       else return basicPointTier_MEL;
//     case "IEL":
//       if (tierChanged.includes("승급")) return basicPointTier_CEL1;
//       else if (tierChanged.includes("강등")) return basicPointTier_MEL;
//       else return basicPointTier_IEL;
//     case "CEL1": 
//       if (tierChanged.includes("승급")) return basicPointTier_CEL2;
//       else if (tierChanged.includes("강등")) return basicPointTier_IEL;
//       else return basicPointTier_CEL1;
//     case "CEL2":
//       if (tierChanged.includes("승급")) return basicPointTier_CEL3;
//       else if (tierChanged.includes("강등")) return basicPointTier_CEL1;
//       else return basicPointTier_CEL2;
//     case "CEL3": 
//       if (tierChanged.includes("강등")) return basicPointTier_CEL2;
//       else return basicPointTier_CEL3;
//     default:
//       return 500;
//   }
// }

// function changeTTT(beforeTier, afterTier) {
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

// function tierChangeChecker(playerTier, TTT) {
//   switch(playerTier) {
//     case "HEL1":
//       if (TTT <= divideRefPoint_HEL1_HEL2) return "강등 > HEL2"
//       return "";
//     case "HEL2": 
//       if (TTT <= divideRefPoint_HEL2_AEL) return "강등 > AEL"
//       else if (TTT >= divideRefPoint_HEL1_HEL2) return "승급 > HEL1"
//       return "";
//     case "AEL":
//       if (TTT <= divideRefPoint_AEL_MEL) return "강등 > MEL"
//       else if (TTT >= divideRefPoint_HEL2_AEL) return "승급 > HEL2"
//       return "";
//     case "MEL": 
//       if (TTT <= divideRefPoint_MEL_IEL) return "강등 > IEL"
//       else if (TTT >= divideRefPoint_AEL_MEL) return "승급 > AEL"
//       return "";
//     case "IEL":
//       if (TTT <= divideRefPoint_IEL_CEL1) return "강등 > CEL1"
//       else if (TTT >= divideRefPoint_MEL_IEL) return "승급 > MEL"
//       return "";
//     case "CEL1": 
//       if (TTT <= divideRefPoint_CEL1_CEL2) return "강등 > CEL2"
//       else if (TTT >= divideRefPoint_IEL_CEL1) return "승급 > IEL"
//       return "";
//     case "CEL2":
//       if (TTT <= divideRefPoint_CEL2_CEL3) return "강등 > CEL3"
//       else if (TTT >= divideRefPoint_CEL1_CEL2) return "승급 > CEL1"
//       return "";
//     case "CEL3": 
//       if (TTT >= divideRefPoint_CEL2_CEL3) return "승급 > CEL2"
//       return "";
//     default:
//       return "";
//   }
// }

// function weightLeague(league) {
//   if (league.includes("KPL") || league.includes("WPL") || league.includes("TPL")   || league.includes("WE CLAN LEAGUE") || league.includes("프로리그") ) return weight_ClanTeam; // 클랜 팀리그
//   else if (league.includes("KaLeague")|| league.includes("하믹 청정수리그 S3") ) return weight_EventTeam; // 하믹 이벤트 팀리그
//   else if (league.includes("청정수리그") || league.includes("포워드배 오픈컵")  || league.includes("하믹 연승전") ) return weight_EventIndi; // 이벤트 개인리그
//   else if (league.includes("team") || league.includes("Team") || league.includes("TEAM")) return weight_STL; // hamic team leauge
//   else if (league.includes("HEL")||league.includes("AEL")||league.includes("MEL")||league.includes("IEL")||league.includes("CEL")||league.includes("HST")) return weight_SILHST; // 
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

// function updateTTT(rw, rl, refPoints, weight, tier_weight, set_weight, time_weight) {
//   Pw = prob(rl, rw);
//   Pl = prob(rw, rl);

//   // Calculate new skill means and variances using TTT algorithm
//   wResult = calculateTTT(rw, rl, weight, time_weight, tier_weight, set_weight, refPoints, Pw);
//   lResult = calculateTTT(rl, rw, weight, time_weight, tier_weight, set_weight, refPoints, Pl);
//   mu_w = wResult[0];
//   sigma_w = wResult[1];
//   mu_l = lResult[0];
//   sigma_l = lResult[1];

//   // Update player ratings with new skill means
//   rw_new = {mean: mu_w, variance: sigma_w};
//   rl_new = {mean: mu_l, variance: sigma_l};

//   return [rw_new, rl_new];
// }

// function calculateTTT(r, o, weight, time_weight, tier_weight, set_weight, refPoints, P) {
//   // Extract player's current skill mean and variance
//   mu_r = r.mean;
//   sigma_r = r.variance;

//   // Extract opponent's current skill mean and variance
//   mu_o = o.mean;
//   sigma_o = o.variance;

//   P = win_probability(mu_r, sigma_r, mu_o, sigma_o);

//   // Compute new skill mean and variance
//   mu_new = mu_r + time_weight * tier_weight * (weight + set_weight) * refPoints * (P - win_probability(mu_r, sigma_r, mu_o, sigma_o));
//   sigma_new = Math.sqrt((1 - time_weight * tier_weight * (weight + set_weight) * refPoints * c(mu_r, sigma_r, mu_o, sigma_o)) * sigma_r * sigma_r);

//   return [mu_new, sigma_new];
// }

// function win_probability(mu_r, sigma_r, mu_o, sigma_o) {
//   delta_mu = mu_r - mu_o;
//   denom = Math.sqrt(2 * (beta * beta) + sigma_r * sigma_r + sigma_o * sigma_o);
//   return cumulative_distribution(delta_mu / denom);
// }

// function cumulative_distribution(x) {
//   return 0.5 * (1 + erf(x / Math.sqrt(2)));
// }

// function c(mu_r, sigma_r, mu_o, sigma_o) {
//   delta_mu = mu_r - mu_o;
//   denom = Math.sqrt(2 * (beta * beta) + sigma_r * sigma_r + sigma_o * sigma_o);
//   return Math.sqrt(2 / (Math.PI * denom * denom)) * Math.exp(-0.5 * delta_mu * delta_mu / (denom * denom)) * (1 / denom);
// }


// function prob(r1, r2) {
//   return 1.0 * 1.0 / (1 + 1.0 * Math.pow(10, 1.0 * (r1 - r2) / 400));
// }

// function erf(x) {
//   // constants
//   var a1 =  0.254829592;
//   var a2 = -0.284496736;
//   var a3 =  1.421413741;
//   var a4 = -1.453152027;
//   var a5 =  1.061405429;
//   var p = 0.3275911;

//   // Save the sign of x
//   var sign = 1;
//   if (x < 0) {
//     sign = -1;
//   }
//   x = Math.abs(x);

//   // A&S formula 7.1.26
//   var t = 1.0 / (1.0 + p*x);
//   var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t) + a1*Math.pow(t,2)*Math.exp(-x*x);
  
//   return sign*y;
// }

// function cumulative_distribution(x) {
//   var t = 1 / (1 + 0.2316419 * Math.abs(x));
//   var d = 0.3989423 * Math.exp(-x * x / 2);
//   var prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
//   return x >= 0 ? 1 - prob : prob;
// }

// function win_probability(mu_r, sigma_r, mu_o, sigma_o) {
//   // Calculate the difference in skill ratings
//   delta_mu = mu_r - mu_o;
  
//   // Calculate the denominator of the win probability equation
//   denom = Math.sqrt(2 * (beta * beta) + sigma_r * sigma_r + sigma_o * sigma_o);
  
//   // Calculate the win probability using the cumulative distribution function of a normal distribution
//   return cumulative_distribution(delta_mu / denom);
// }


sheetAddress = "1YNpMGhZmJ_pWAN5QOq1dzur2BuSiAwgtEbd7qchZN6Q";

var docParam = SpreadsheetApp.openById(sheetAddress).getSheetByName("설정");
docParam_range = docParam.getRange(4, 3, 40, 8);
setParam = docParam_range.getValues();

basicPointTier_HEL1 = setParam[1][1];
basicPointTier_HEL2 = setParam[2][1];
basicPointTier_AEL = setParam[3][1];
basicPointTier_MEL = setParam[4][1];
basicPointTier_IEL = setParam[5][1];
basicPointTier_CEL1 = setParam[6][1];
basicPointTier_CEL2 = setParam[7][1];
basicPointTier_CEL3 = setParam[8][1];
upPointTier_HEL1 = setParam[1][2];
upPointTier_HEL2 = setParam[2][2];
upPointTier_AEL = setParam[3][2];
upPointTier_MEL = setParam[4][2];
upPointTier_IEL = setParam[5][2];
upPointTier_CEL1 = setParam[6][2];
upPointTier_CEL2 = setParam[7][2];
downPointTier_HEL2 = setParam[2][3];
downPointTier_AEL = setParam[3][3];
downPointTier_MEL = setParam[4][3];
downPointTier_IEL = setParam[5][3];
downPointTier_CEL1 = setParam[6][3];
downPointTier_CEL2 = setParam[7][3];
downPointTier_CEL3 = setParam[8][3];

goUpRefPoint_HEL1 = setParam[1][4];
goUpRefPoint_HEL2 = setParam[2][4];
goUpRefPoint_AEL = setParam[3][4];
goUpRefPoint_MEL = setParam[4][4];
goUpRefPoint_IEL = setParam[5][4];
goUpRefPoint_CEL1 = setParam[6][4];
goUpRefPoint_CEL2 = setParam[7][4];

goDownRefPoint_HEL2 = setParam[2][5];
goDownRefPoint_AEL = setParam[3][5];
goDownRefPoint_MEL = setParam[4][5];
goDownRefPoint_IEL = setParam[5][5];
goDownRefPoint_CEL1 = setParam[6][5];
goDownRefPoint_CEL2 = setParam[7][5];
goDownRefPoint_CEL3 = setParam[8][5];

divideRefPoint_HEL1_HEL2 = setParam[1][7];
divideRefPoint_HEL2_AEL = setParam[2][7];
divideRefPoint_AEL_MEL = setParam[3][7];
divideRefPoint_MEL_IEL = setParam[4][7];
divideRefPoint_IEL_CEL1 = setParam[5][7];
divideRefPoint_CEL1_CEL2 = setParam[6][7];
divideRefPoint_CEL2_CEL3 = setParam[7][7];

refPoint = setParam[10][1];
refPointAbsent = setParam[11][1];

weight_STL = setParam[13][1];
weight_SILHST = setParam[14][1];
weight_EventTeam = setParam[15][1];
weight_EventIndi = setParam[16][1];
weight_ClanTeam = setParam[17][1];
weight_ClanIndi = setParam[18][1];
weight_Other = setParam[19][1];

set_weight_ace = setParam[22][1];
set_weight_final = setParam[23][1];
set_weight_semifinal = setParam[24][1];
set_weight_34rank = setParam[25][1];
set_weight_PO = setParam[26][1];

tier_weight_HEL1lose = setParam[31][1];
tier_weight_CEL3win = setParam[32][1];

time_weight_last = setParam[37][1];
time_weight_first = (setParam[38][1] * 13) / 14;
const first_time = new Date("2021.03.01").getTime();
const last_time = new Date("2023.05.01").getTime();

docParam_Lrange = docParam.getRange(57, 4, 20, 4);
var leagueList = docParam_Lrange.getValues();

function calculateELO() {
  // 주종 입력
  var docplayer =
    SpreadsheetApp.openById(sheetAddress).getSheetByName("PlayersData");
  var numRowPlayer = docplayer.getLastRow() - 1;
  playerRange = docplayer.getRange(2, 2, numRowPlayer, 4);
  playerData = playerRange.getValues();

  // var docELOResult = SpreadsheetApp.openById(sheetAddress).getSheetByName('PlayersData');
  // var numRowELOResult = docELOResult.getLastRow();
  // playerRangeResult = docELOResult.getRange(2,2,numRowELOResult-1,3);
  // playerDataResult = playerRangeResult.getValues();

  // Logger.log(numRowELOResult)
  // Logger.log(playerDataResult)

  var docplayerInit =
    SpreadsheetApp.openById(sheetAddress).getSheetByName("초기티어");
  var numRowPlayerInit = docplayerInit.getLastRow();
  playerRangeInit = docplayerInit.getRange(2, 2, numRowPlayerInit, 4);
  playerDataInit = playerRangeInit.getValues();

  var PlayersInitTier = new Map();
  var PlayersInitTierChanged = new Map();
  var PlayersElo = new Map();

  var PlayersMainRace = new Map();
  var PlayersTier = new Map();
  var PlayersStat = new Map();

  for (i = 0; i < numRowPlayerInit - 1; i++) {
    playerInitID = playerDataInit[i][1].toString().toUpperCase();
    playerInitTier = playerDataInit[i][0].toString().toUpperCase();
    playerInitTierChanged = playerDataInit[i][3].toString();
    playerInitRace = playerDataInit[i][2].toString().toUpperCase();
    playerInit = playerInitID + "&" + playerInitRace;
    PlayersInitTier.set(playerInit, playerInitTier);
    PlayersInitTierChanged.set(playerInit, playerInitTierChanged);

    PlayersElo.set(
      playerInit,
      changeElo_init(playerInitTier, playerInitTierChanged),
    ); // 2023.4.2 이전의 티어로 초기화를 함.
    PlayersStat.set(playerInit, newStat());
  }

  // 현재 티어의 점수로 초기화함
  for (i = 0; i < numRowPlayer - 1; i++) {
    if (playerData[i][0] && playerData[i][1] && playerData[i][2]) {
      playerTier = playerData[i][0].toString().toUpperCase();
      playerID = playerData[i][1].toString().toUpperCase();
      playerRace = playerData[i][2].toString().toUpperCase();
      playerTierChanged = playerData[i][3].toString();
    } else {
      continue;
    }
    player = playerID + "&" + playerRace;

    PlayersMainRace.set(playerID, playerRace);

    // if (playerID == "IRIVER") {
    //   Logger.log(basicPointTier_AEL);
    //   PlayersElo.set(player, basicPointTier_AEL);
    // }
    // else
    // if (PlayersInitTier.get(player)) {
    //   PlayersElo.set(player, changeElo_init(PlayersInitTier.get(player), PlayersInitTierChanged.get(player))); // 2023.4.2 이전의 티어로 초기화를 함.
    // } else {
    //   PlayersElo.set(player, initElo(playerTier));
    // }
    if (PlayersElo.get(player) == null) {
      PlayersElo.set(player, initElo(playerTier));
      PlayersStat.set(player, newStat());
    }

    // 아이리버: 엘헬2중간 --> 2416.44
    // 아이리버: 2250 --> 2383.33
    // PlayersElo.set(player, 2000); // 모든 선수를 2000으로 세팅
    // PlayersElo.set(player, initElo(playerTier)); // 현재 티어를 이용해 세팅함
    // PlayersElo.set(player, changeElo_init2(playerTier, playerTierChanged)); // 최근 승급/강등 선수는 이전 티어로 세팅해줌

    PlayersTier.set(playerID, playerTier);

    if (PlayersElo.get(player) == 500) {
      Logger.log(PlayersElo.get(player));
      Logger.log(playerID);
      Logger.log(playerRace);
      Logger.log(playerTier);
    }
  }

  //load game data
  var doc =
    SpreadsheetApp.openById(sheetAddress).getSheetByName("전체리그Data");
  var numRow = doc.getLastRow();
  gameRange = doc.getRange(2, 1, numRow - 1, 10);
  // gameData = gameRange.getValues();
  // Logger.log("전체 게임 데이터 수")
  // Logger.log(numRow)
  var values = doc.getRange(2, 1, numRow - 1, 1).getValues();
  var numRowsUpdated = values.filter(function (row) {
    return row[0] !== "";
  }).length;
  numRows = numRowsUpdated;
  gameRange = doc.getRange(2, 1, numRow, 10);
  gameData = gameRange.getValues();
  Logger.log("전체 게임 데이터 수");
  Logger.log(numRows);

  for (jj = 0; jj < numRow - 1; jj++) {
    // Date	WinnerTier	WinnerID	WinnerRace	LoserTier	LoserID	LoserRace	League1	League2
    date = new Date(gameData[jj][0]);
    time_weight =
      ((time_weight_last - time_weight_first) / (last_time - first_time)) *
        (date.getTime() - last_time) +
      time_weight_last;

    winnerTier = gameData[jj][1].toString().toUpperCase();
    winnerID = gameData[jj][2].toString().toUpperCase();
    winnerRace = gameData[jj][3].toString().toUpperCase();
    winner = winnerID + "&" + winnerRace;
    loserTier = gameData[jj][4].toString().toUpperCase();
    loserID = gameData[jj][5].toString().toUpperCase();
    loserRace = gameData[jj][6].toString().toUpperCase();
    loser = loserID + "&" + loserRace;
    map = gameData[jj][7];
    league = gameData[jj][8].toString().toUpperCase();
    gameSet = gameData[jj][9].toString().toUpperCase();

    if (winnerTier == "-" || loserTier == "-") continue;
    if (
      winnerTier &&
      winnerID &&
      winnerRace &&
      loserTier &&
      loserID &&
      loserRace
    ) {
    } else {
      continue;
    }

    // 없으면 플레이어 초기화
    if (PlayersElo.get(winner) == null) {
      if (PlayersMainRace.get(winnerID) == null) {
        PlayersElo.set(winner, initElo(winnerTier));
      } else {
        PlayersElo.set(winner, initElo(winnerTier) - 200);
      }

      PlayersTier.set(winner, winnerTier);
      PlayersStat.set(winner, newStat());
    }
    if (PlayersElo.get(loser) == null) {
      if (PlayersMainRace.get(loserID) == null) {
        PlayersElo.set(loser, initElo(loserTier));
      } else {
        PlayersElo.set(loser, initElo(loserTier) - 200);
      }

      PlayersTier.set(loser, loserTier);
      PlayersStat.set(loser, newStat());
    }

    if (PlayersElo.get(winner) == 500) {
      Logger.log(winnerTier);
      Logger.log(winnerID);
      Logger.log(winnerRace);
      Logger.log(winner);
      Logger.log(gameData[jj]);
    }
    if (PlayersElo.get(loser) == 500) {
      Logger.log(loserTier);
      Logger.log(loserID);
      Logger.log(loserRace);
      Logger.log(loser);
      Logger.log(gameData[jj]);
    }
    // ELO 점수 업데이트
    gameRefPoint = refPointChecker(gameSet);
    leagueDecision = weightLeague(league);
    gameLeagueWeight = leagueDecision[0];
    gameLeague = leagueDecision[1];
    gameTierWeight = weightTier(winnerTier, loserTier);
    gameSetWeight = weightSet(gameSet, gameLeague);
    newELO = updateELO(
      PlayersElo.get(winner),
      PlayersElo.get(loser),
      gameRefPoint,
      gameLeagueWeight,
      gameTierWeight,
      gameSetWeight,
      time_weight,
    );
    record = [
      [
        PlayersElo.get(winner),
        newELO[0] - PlayersElo.get(winner),
        newELO[0],
        PlayersElo.get(loser),
        newELO[1] - PlayersElo.get(loser),
        newELO[1],
        gameRefPoint,
        gameLeagueWeight,
        gameTierWeight,
        gameSetWeight,
        time_weight,
        newELO[2],
        newELO[3],
        PlayersElo.get(winner) - PlayersElo.get(loser),
      ],
    ];

    // 승패 업데이트
    newStatWinner = updateStat(PlayersStat.get(winner), league, true);
    newStatLoser = updateStat(PlayersStat.get(loser), league, false);
    PlayersStat.set(winner, newStatWinner);
    PlayersStat.set(loser, newStatLoser);

    PlayersElo.set(winner, newELO[0]);
    PlayersElo.set(loser, newELO[1]);

    // record each game
    gameRangeRecord = doc.getRange(2 + jj, 11, 1, 14);
    gameRangeRecord.setValues(record);
  }

  // for (var [key, value] of PlayersElo) {
  //   console.log(key + ' = ' + value);
  // }

  // for (var [key, value] of PlayersStat) {
  //   console.log(key + ' = ' + value.HTwin, value.HTlose, value.HIwin, value.HIlose, value.Owin, value.Olose);
  // }

  for (i = 0; i < numRowPlayer - 1; i++) {
    playerTierR = playerData[i][0].toUpperCase();
    playerIDR = playerData[i][1].toUpperCase();
    playerRaceR = playerData[i][2].toUpperCase();

    // Logger.log(i, playerData[i][0], playerData[i][1], playerData[i][2])

    playerR = playerIDR + "&" + playerRaceR;

    if (PlayersElo.get(playerR) == null) {
      ELO = initElo(playerTierR);
      stat = newStat();
    } else {
      ELO = PlayersElo.get(playerR);
      stat = PlayersStat.get(playerR);
    }
    // Logger.log(playerR, stat)

    // 티어 변동 여부 체크
    tierChanged = tierChangeChecker(playerTierR, ELO);

    stats = [
      [
        ELO,
        tierChanged,
        stat.HTwin,
        stat.HTlose,
        stat.HIwin,
        stat.HIlose,
        stat.Owin,
        stat.Olose,
      ],
    ];
    docplayer.getRange(2 + i, 6, 1, 8).setValues(stats);
  }

  var docELOResultAll =
    SpreadsheetApp.openById(sheetAddress).getSheetByName("모든 선수 데이터");
  var cnt = 1;
  for (const [player, eloScore] of PlayersElo) {
    cnt = cnt + 1;
    var [playerId, race] = player.split("&");
    row = [[playerId, race, eloScore]];
    docELOResultAll.getRange(cnt, 3, 1, 3).setValues(row);
  }

  // timeScoring()
}

function newStat() {
  var a = { HTwin: 0, HTlose: 0, HIwin: 0, HIlose: 0, Owin: 0, Olose: 0 };

  return a;
}

function initElo(tier) {
  switch (tier) {
    case "HEL":
      return basicPointTier_HEL1;
    case "HEL0":
      return basicPointTier_HEL1;
    case "HEL1":
      return basicPointTier_HEL1;
    case "HEL2":
      return basicPointTier_HEL2;
    case "AEL":
      return basicPointTier_AEL;
    case "MEL":
      return basicPointTier_MEL;
    case "IEL":
      return basicPointTier_IEL;
    case "CEL1":
      return basicPointTier_CEL1;
    case "CEL2":
      return basicPointTier_CEL2;
    case "CEL3":
      return basicPointTier_CEL3;
    case "CEL":
      return basicPointTier_CEL1;
    default:
      return 500;
  }
}

function changeElo_init(tier, tierChanged) {
  switch (tier) {
    case "HEL1":
      if (tierChanged.includes("HEL2") && tierChanged.includes("S10"))
        return (basicPointTier_HEL1 + basicPointTier_HEL2) / 2;
      return basicPointTier_HEL1;
    case "HEL2":
      if (tierChanged.includes("AEL") && tierChanged.includes("S10"))
        return (basicPointTier_AEL + basicPointTier_HEL2) / 2;
      else if (tierChanged.includes("HEL1") && tierChanged.includes("S10"))
        return (basicPointTier_HEL1 + basicPointTier_HEL2) / 2;
      else return basicPointTier_HEL2;
    case "AEL":
      if (tierChanged.includes("MEL") && tierChanged.includes("S10"))
        return (basicPointTier_AEL + basicPointTier_MEL) / 2;
      else if (tierChanged.includes("HEL2") && tierChanged.includes("S10"))
        return (basicPointTier_AEL + basicPointTier_HEL2) / 2;
      else return basicPointTier_AEL;
    case "MEL":
      if (tierChanged.includes("IEL") && tierChanged.includes("S10"))
        return (basicPointTier_IEL + basicPointTier_MEL) / 2;
      else if (tierChanged.includes("AEL") && tierChanged.includes("S10"))
        return (basicPointTier_AEL + basicPointTier_MEL) / 2;
      else return basicPointTier_MEL;
    case "IEL":
      if (tierChanged.includes("CEL1") && tierChanged.includes("S10"))
        return (basicPointTier_IEL + basicPointTier_CEL1) / 2;
      else if (tierChanged.includes("MEL") && tierChanged.includes("S10"))
        return (basicPointTier_IEL + basicPointTier_MEL) / 2;
      else return basicPointTier_IEL;
    case "CEL1":
      if (tierChanged.includes("CEL2") && tierChanged.includes("S10"))
        return (basicPointTier_CEL2 + basicPointTier_CEL1) / 2;
      else if (tierChanged.includes("IEL") && tierChanged.includes("S10"))
        return (basicPointTier_IEL + basicPointTier_CEL1) / 2;
      else return basicPointTier_CEL1;
    case "CEL2":
      if (tierChanged.includes("CEL3") && tierChanged.includes("S10"))
        return (basicPointTier_CEL2 + basicPointTier_CEL3) / 2;
      else if (tierChanged.includes("CEL1") && tierChanged.includes("S10"))
        return (basicPointTier_CEL2 + basicPointTier_CEL1) / 2;
      else return basicPointTier_CEL2;
    case "CEL3":
      if (tierChanged.includes("CEL2") && tierChanged.includes("S10"))
        return (basicPointTier_CEL2 + basicPointTier_CEL3) / 2;
      else return basicPointTier_CEL3;
    case "HEL2HEL1":
      return goDownRefPoint_HEL2;
    case "AELHEL2":
      return goDownRefPoint_AEL;
    case "MELAEL":
      return goDownRefPoint_MEL;
    case "IELMEL":
      return goDownRefPoint_IEL;
    case "CEL1IEL":
      return goDownRefPoint_CEL1;
    case "CEL2CEL1":
      return goDownRefPoint_CEL2;
    case "CEL3CEL2":
      return goDownRefPoint_CEL3;
    case "HEL1HEL2":
      return goUpRefPoint_HEL1;
    case "HEL2AEL":
      return goUpRefPoint_HEL2;
    case "AELMEL":
      return goUpRefPoint_AEL;
    case "MELIEL":
      return goUpRefPoint_MEL;
    case "IELCEL1":
      return goUpRefPoint_IEL;
    case "CEL1CEL2":
      return goUpRefPoint_CEL1;
    case "CEL2CEL3":
      return goUpRefPoint_CEL2;
    default:
      return 500;
  }
}

function changeElo_init2(tier, tierChanged) {
  switch (tier) {
    case "HEL1":
      if (tierChanged.includes("승급")) return basicPointTier_HEL2;
      return basicPointTier_HEL1;
    case "HEL2":
      if (tierChanged.includes("승급")) return basicPointTier_AEL;
      else if (tierChanged.includes("강등")) return basicPointTier_HEL1;
      else return basicPointTier_HEL2;
    case "AEL":
      if (tierChanged.includes("승급")) return basicPointTier_MEL;
      else if (tierChanged.includes("강등")) return basicPointTier_HEL2;
      else return basicPointTier_AEL;
    case "MEL":
      if (tierChanged.includes("승급")) return basicPointTier_IEL;
      else if (tierChanged.includes("강등")) return basicPointTier_AEL;
      else return basicPointTier_MEL;
    case "IEL":
      if (tierChanged.includes("승급")) return basicPointTier_CEL1;
      else if (tierChanged.includes("강등")) return basicPointTier_MEL;
      else return basicPointTier_IEL;
    case "CEL1":
      if (tierChanged.includes("승급")) return basicPointTier_CEL2;
      else if (tierChanged.includes("강등")) return basicPointTier_IEL;
      else return basicPointTier_CEL1;
    case "CEL2":
      if (tierChanged.includes("승급")) return basicPointTier_CEL3;
      else if (tierChanged.includes("강등")) return basicPointTier_CEL1;
      else return basicPointTier_CEL2;
    case "CEL3":
      if (tierChanged.includes("강등")) return basicPointTier_CEL2;
      else return basicPointTier_CEL3;
    default:
      return 500;
  }
}

function changeElo(beforeTier, afterTier) {
  switch (afterTier) {
    case "HEL1":
      return upPointTier_HEL1;
    case "HEL2":
      if (beforeTier == "HEL1") return downPointTier_HEL2;
      else return upPointTier_HEL2;
    case "AEL":
      if (beforeTier == "HEL2") return downPointTier_AEL;
      else return upPointTier_AEL;
    case "MEL":
      if (beforeTier == "AEL") return downPointTier_MEL;
      else return upPointTier_MEL;
    case "IEL":
      if (beforeTier == "MEL") return downPointTier_IEL;
      else return upPointTier_IEL;
    case "CEL1":
      if (beforeTier == "IEL") return downPointTier_CEL1;
      else return upPointTier_CEL1;
    case "CEL2":
      if (beforeTier == "CEL1") return downPointTier_CEL2;
      else return upPointTier_CEL2;
    case "CEL3":
      return downPointTier_CEL3;
    default:
      return 500;
  }
}

function tierChangeChecker(playerTier, ELO) {
  switch (playerTier) {
    case "HEL1":
      if (ELO <= goDownRefPoint_HEL2) return "강등 > HEL2";
      return "";
    case "HEL2":
      if (ELO <= goDownRefPoint_AEL) return "강등 > AEL";
      else if (ELO >= goUpRefPoint_HEL1) return "승급 > HEL1";
      return "";
    case "AEL":
      if (ELO <= goDownRefPoint_MEL) return "강등 > MEL";
      else if (ELO >= goUpRefPoint_HEL2) return "승급 > HEL2";
      return "";
    case "MEL":
      if (ELO <= goDownRefPoint_IEL) return "강등 > IEL";
      else if (ELO >= goUpRefPoint_AEL) return "승급 > AEL";
      return "";
    case "IEL":
      if (ELO <= goDownRefPoint_CEL1) return "강등 > CEL1";
      else if (ELO >= goUpRefPoint_MEL) return "승급 > MEL";
      return "";
    case "CEL1":
      if (ELO <= goDownRefPoint_CEL2) return "강등 > CEL2";
      else if (ELO >= goUpRefPoint_IEL) return "승급 > IEL";
      return "";
    case "CEL2":
      if (ELO <= goDownRefPoint_CEL3) return "강등 > CEL3";
      else if (ELO >= goUpRefPoint_CEL1) return "승급 > CEL1";
      return "";
    case "CEL3":
      if (ELO >= goUpRefPoint_CEL2) return "승급 > CEL2";
      return "";
    default:
      return "";
  }
}

function weightLeague(league) {
  leagueInfo = findLeagueInfo(league);
  if (leagueInfo != null) {
    leagueType = leagueInfo.type;
    if (leagueType.includes("팀리그")) {
      return [leagueInfo.weight, "team"];
    }
    return [leagueInfo.weight, "indi"];
  }
  // if (
  //   leagueInfo != league.includes("프로리그") ||
  //   league.includes("클랜친선경기") ||
  //   league.includes("KPL") ||
  //   league.includes("WPL") ||
  //   league.includes("3050 프로리그") ||
  //   league.includes("사일배 클랜리그") ||
  //   league.includes("TPL") ||
  //   league.includes("WE CLAN LEAGUE") ||
  //   league.includes("AHCL") ||
  //   league.includes("&클랜 ESL") ||
  //   league.includes("WHITE 클랜팀리그")
  // )
  //   return [weight_ClanTeam, "team"]; // 클랜 팀리그
  // else if (
  //   league.includes("KALEAGUE") ||
  //   league.includes("하믹 청정수리그 S3") ||
  //   league.includes("청정수팀리그") ||
  //   league.includes("홍토스배 친선하믹클랜전")
  // )
  //   return [weight_EventTeam, "team"]; // 하믹 이벤트 팀리그
  // else if (
  //   league.includes("청정수리그") ||
  //   league.includes("포워드배 오픈컵") ||
  //   league.includes("하믹 연승전") ||
  //   league.includes("홍토스배 CEL2 야간종족최강전") ||
  //   league.includes("사일배 당일치기 토너먼트") ||
  //   league.includes("끝장전")
  // )
  //   return [weight_EventIndi, "indi"]; // 이벤트 개인리그
  else if (
    league.includes("team") ||
    league.includes("Team") ||
    league.includes("TEAM")
  )
    return [weight_STL, "team"]; // hamic team leauge
  else if (
    league.includes("HEL") ||
    league.includes("AEL") ||
    league.includes("MEL") ||
    league.includes("IEL") ||
    league.includes("CEL") ||
    league.includes("HST")
  )
    return [weight_SILHST, "indi"]; //
  else if (league.includes("클랜스타리그")) return [weight_ClanIndi, "indi"];
  else {
    return weight_Other; // other
  }
}

function weightTier(winnerTier, loserTier) {
  if (loserTier == "HEL1") {
    tier_weight = tier_weight_HEL1lose;
  } else if (winnerTier == "CEL3") {
    tier_weight = tier_weight_CEL3win;
  } else {
    tier_weight = 1.0;
  }

  return tier_weight;
}

function weightSet(gameSet, league) {
  if (gameSet.includes("PO") && league == "team") {
    set_weight = set_weight_PO;
  } else if (
    gameSet.includes("FINAL") &&
    (league.includes("team") ||
      league.includes("Team") ||
      league.includes("TEAM"))
  ) {
    set_weight = set_weight_PO;
  } else if (
    gameSet.includes("SEMIFINAL") ||
    gameSet.includes("SEMI FINAL") ||
    gameSet.includes("4강")
  ) {
    set_weight = set_weight_semifinal;
  } else if (gameSet.includes("FINAL")) {
    set_weight = set_weight_final;
  } else if (gameSet.includes("4위전")) {
    set_weight = set_weight_34rank;
  } else {
    set_weight = 1.0;
  }
  if (gameSet.includes("ACE") || gameSet.includes("에이스")) {
    set_weight = set_weight * set_weight_ace;
  }

  return set_weight;
}

function refPointChecker(gameSet) {
  if (gameSet.includes("부전")) return refPointAbsent;
  else return refPoint;
}

function updateStat(stat, league, win) {
  if (
    league.includes("프로리그") ||
    league.includes("KALEAGUE") ||
    league.includes("하믹 청정수리그 S3") ||
    league.includes("청정수팀리그") ||
    league.includes("클랜친선경기") ||
    league.includes("KPL") ||
    league.includes("WPL") ||
    league.includes("3050 프로리그") ||
    league.includes("사일배 클랜리그") ||
    league.includes("TPL") ||
    league.includes("WE CLAN LEAGUE") ||
    league.includes("AHCL") ||
    league.includes("WHITE 클랜팀리그") ||
    league.includes("홍토스배 친선하믹클랜전")
  ) {
    if (win == true) {
      stat.Owin = stat.Owin + 1;
    } else {
      stat.Olose = stat.Olose + 1;
    }
  } else if (
    league.includes("청정수리그") ||
    league.includes("포워드배 오픈컵") ||
    league.includes("하믹 연승전") ||
    league.includes("청정수팀리그") ||
    league.includes("홍토스배 CEL2 야간종족최강전") ||
    league.includes("사일배 당일치기 토너먼트") ||
    league.includes("클랜스타리그") ||
    league.includes("끝장전")
  ) {
    if (win == true) {
      stat.Owin = stat.Owin + 1;
    } else {
      stat.Olose = stat.Olose + 1;
    }
  } else if (
    league.includes("team") ||
    league.includes("Team") ||
    league.includes("TEAM")
  ) {
    if (win == true) {
      stat.HTwin = stat.HTwin + 1;
    } else {
      stat.HTlose = stat.HTlose + 1;
    }
  } else if (league.includes("HST")) {
    if (win == true) {
      stat.HIwin = stat.HIwin + 1;
    } else {
      stat.HIlose = stat.HIlose + 1;
    }
  } else if (
    league.includes("HEL") ||
    league.includes("AEL") ||
    league.includes("MEL") ||
    league.includes("IEL") ||
    league.includes("CEL")
  ) {
    if (win == true) {
      stat.HIwin = stat.HIwin + 1;
    } else {
      stat.HIlose = stat.HIlose + 1;
    }
  }
  return stat;
}

function updateELO(
  rw,
  rl,
  refPoints,
  weight,
  tier_weight,
  set_weight,
  time_weight,
) {
  Pw = prob(rl, rw);
  Pl = prob(rw, rl);

  rw_new =
    rw + refPoints * time_weight * weight * set_weight * tier_weight * (1 - Pw);
  rl_new =
    rl + refPoints * time_weight * weight * set_weight * tier_weight * (0 - Pl);

  return [rw_new, rl_new, Pw, Pl];
}

function prob(r1, r2) {
  const K = 400;
  return (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (r1 - r2)) / K));
}

function findLeagueInfo(leagueName) {
  var leagueInfo = {};

  for (var col = 0; col < leagueList[0].length; col++) {
    for (var row = 2; row < leagueList.length - 1; row++) {
      if (!leagueList[row][col] || leagueList[row][col].trim() === "") {
        continue;
      }

      // Compare names (ignoring case for English names)
      var leagueNameToCompare = leagueName.toLowerCase().replace(/\r?\n|\r/g, "");
      var leagueListNameToCompare = leagueList[row][col].toLowerCase().replace(/\r?\n|\r/g, "");

      if (leagueNameToCompare.includes(leagueListNameToCompare) || leagueNameToCompare === leagueListNameToCompare) {
        var weight = leagueList[0][col]; // Weight is in the first row of the column
        var type = leagueList[1][col]; // Type is in the second row of the column
        leagueInfo = { type: type, weight: weight };
        return leagueInfo;
      }
    }
  }

  return null;
}

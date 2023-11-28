function timeScoring() {
  sheetAddressTimeScore = "1YNpMGhZmJ_pWAN5QOq1dzur2BuSiAwgtEbd7qchZN6Q";
  var eloSheet = SpreadsheetApp.openById(sheetAddressTimeScore).getSheetByName('시간별ELO');
  var playerRange = eloSheet.getRange(2,1,10,1);
  var players = playerRange.getValues();
  
  var docGame = SpreadsheetApp.openById(sheetAddressTimeScore).getSheetByName('전체리그Data')
  var numRow = docGame.getLastRow();
  gameRangeAll = docGame.getRange(2, 1, numRow-1, 25);
  gameRange = gameRangeAll.getValues();

  // extract Elo changes for each player's games
  players.forEach(function(player, i) {
    var playerRow = i + 2;
    var playerEloColumn = 2 * (i + 1)+1;
    var gameDates = [];
    var gameElos = [];

    gameRange.forEach(function(game) {
      var winner = game[2].toString().toUpperCase();
      var loser = game[5].toString().toUpperCase();
      var postWinnerElo = game[12];
      var postLoserElo = game[15];
      if (player.toString().toUpperCase() == winner || player.toString().toUpperCase() == loser) {
        var date = new Date(game[0]);       
        elo = (player.toString().toUpperCase() == winner) ? postWinnerElo : postLoserElo;
        gameDates.push(date);
        gameElos.push(elo);
      }
    });

    // write Elo changes to 시간별ELO sheet
    eloSheet.getRange(1, 2 * (i + 1)+1, 1, 2).setValues([["date", player]]);
    for (var j = 0; j < gameDates.length; j++) {      
      eloSheet.getRange(j+2, 2 * (i + 1)+1, 1, 1).setValue(gameDates[j]);
      eloSheet.getRange(j+2, 2 * (i + 1)+2, 1, 1).setValue(gameElos[j]);
    }
  });
  
}



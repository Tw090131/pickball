// server/utils/scoring.js
// 八人转计分系统

/**
 * 计算局比分对应的积分
 * @param {Number} gamesWon - 获胜局数
 * @param {Number} gamesLost - 失败局数
 * @returns {Number} 积分
 */
function calculatePoints(gamesWon, gamesLost) {
  // 2:0 或 1:0 积 2 分
  if (gamesWon === 2 && gamesLost === 0) return 2;
  if (gamesWon === 1 && gamesLost === 0) return 2;
  
  // 2:1 积 1 分
  if (gamesWon === 2 && gamesLost === 1) return 1;
  
  // 败北积 0 分
  return 0;
}

/**
 * 解析局比分字符串
 * @param {String} scoreStr - 比分字符串，如 "2:0", "2:1", "1:0"
 * @returns {Object} {gamesWon, gamesLost}
 */
function parseGameScore(scoreStr) {
  const parts = scoreStr.split(':');
  if (parts.length !== 2) {
    throw new Error('比分格式错误，应为 "2:0" 或 "2:1" 格式');
  }
  
  const gamesWon = parseInt(parts[0]);
  const gamesLost = parseInt(parts[1]);
  
  if (isNaN(gamesWon) || isNaN(gamesLost)) {
    throw new Error('比分必须是数字');
  }
  
  if (gamesWon < 0 || gamesLost < 0) {
    throw new Error('比分不能为负数');
  }
  
  if (gamesWon > 3 || gamesLost > 3) {
    throw new Error('局比分不能超过3局');
  }
  
  return { gamesWon, gamesLost };
}

/**
 * 应用让分规则
 * @param {Number} originalScore - 原始比分
 * @param {Object} handicapRules - 让分规则
 * @param {Array} players - 玩家列表（用于判断性别等）
 * @returns {Number} 调整后的比分
 */
function applyHandicap(originalScore, handicapRules, players) {
  if (!handicapRules || !handicapRules.enabled) {
    return originalScore;
  }
  
  // 检查是否有女选手
  const hasFemale = players.some(p => p.gender === 2);
  const hasMale = players.some(p => p.gender === 1);
  
  if (hasFemale && hasMale && handicapRules.genderHandicap) {
    // 男女混搭让分
    if (handicapRules.genderHandicap.type === 'female_advantage') {
      // 女选手获胜基础分更高
      return originalScore + handicapRules.genderHandicap.points;
    } else if (handicapRules.genderHandicap.type === 'male_penalty') {
      // 男选手需多赢一球
      return originalScore - handicapRules.genderHandicap.points;
    }
  }
  
  return originalScore;
}

/**
 * 验证局比分是否有效
 * @param {Number} gamesWon - 获胜局数
 * @param {Number} gamesLost - 失败局数
 * @returns {Boolean}
 */
function isValidGameScore(gamesWon, gamesLost) {
  // 必须有一方获胜
  if (gamesWon === gamesLost) {
    return false;
  }
  
  // 最多3局
  if (gamesWon > 3 || gamesLost > 3) {
    return false;
  }
  
  // 必须有一方达到获胜条件（2局或3局）
  if (gamesWon < 2 && gamesLost < 2) {
    return false;
  }
  
  return true;
}

module.exports = {
  calculatePoints,
  parseGameScore,
  applyHandicap,
  isValidGameScore
};


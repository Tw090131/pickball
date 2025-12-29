// server/utils/rotation.js
// 八人转排表算法

/**
 * 生成八人转比赛排表
 * @param {Array} participants - 参与者列表 [{id, name, ...}]
 * @param {Object} options - 配置选项
 * @param {String} options.mode - 6人或7人的特殊模式（可选）
 * @param {Boolean} options.randomize - 是否随机打乱（默认true）
 * @returns {Array} 比赛列表 [{round, match, teamA, teamB}]
 */
function generateRotationSchedule(participants, options = {}) {
  const n = participants.length;
  
  if (n < 4 || n > 13) {
    throw new Error('参与人数必须在 4-13 人之间');
  }

  // 随机打乱参与者顺序（保证公平性）
  let shuffledParticipants = [...participants];
  if (options.randomize !== false) {
    shuffledParticipants = shuffleArray([...participants]);
  }

  // 6人和7人的特殊处理
  if (n === 6 && options.sixPlayerMode) {
    return generateSixPlayerSchedule(shuffledParticipants, options.sixPlayerMode);
  }
  
  if (n === 7 && options.sevenPlayerMode) {
    return generateSevenPlayerSchedule(shuffledParticipants, options.sevenPlayerMode);
  }

  const matches = [];
  let matchId = 1;
  
  // 如果是偶数人数，使用标准轮转算法
  if (n % 2 === 0) {
    // 固定第一个位置，其他位置轮转
    for (let round = 1; round < n; round++) {
      const teams = [];
      
      // 第一对：固定第一个 + 当前轮的第一个对手
      teams.push({
        players: [shuffledParticipants[0], shuffledParticipants[round]],
        name: `${shuffledParticipants[0].name}/${shuffledParticipants[round].name}`
      });
      
      // 其他对：对称配对
      for (let i = 1; i < n / 2; i++) {
        const p1 = (round + i - 1) % (n - 1) + 1;
        const p2 = (round - i + n - 2) % (n - 1) + 1;
        
        teams.push({
          players: [shuffledParticipants[p1], shuffledParticipants[p2]],
          name: `${shuffledParticipants[p1].name}/${shuffledParticipants[p2].name}`
        });
      }
      
      // 生成该轮的所有比赛（每两个队伍打一场）
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({
            id: matchId++,
            round: round,
            matchNumber: Math.floor(i / 2) + 1,
            teamA: teams[i],
            teamB: teams[i + 1],
            status: 'pending'
          });
        }
      }
    }
  } else {
    // 奇数人数：添加一个"轮空"虚拟参与者
    const virtualParticipant = {
      id: 'virtual',
      name: '轮空',
      isVirtual: true
    };
    
    const extendedParticipants = [...participants, virtualParticipant];
    
    for (let round = 1; round < n; round++) {
      const teams = [];
      
      // 第一对：固定第一个 + 当前轮的第一个对手
      teams.push({
        players: [shuffledParticipants[0], extendedParticipants[round]],
        name: extendedParticipants[round].isVirtual 
          ? shuffledParticipants[0].name + '（轮空）'
          : `${shuffledParticipants[0].name}/${extendedParticipants[round].name}`
      });
      
      // 其他对：对称配对
      for (let i = 1; i < (n + 1) / 2; i++) {
        const p1 = (round + i - 1) % n + 1;
        const p2 = (round - i + n) % n + 1;
        
        const player1 = extendedParticipants[p1];
        const player2 = extendedParticipants[p2];
        
        if (player1.isVirtual || player2.isVirtual) {
          // 有轮空的情况
          const realPlayer = player1.isVirtual ? player2 : player1;
          teams.push({
            players: [realPlayer],
            name: realPlayer.name + '（轮空）',
            hasBye: true
          });
        } else {
          teams.push({
            players: [player1, player2],
            name: `${player1.name}/${player2.name}`
          });
        }
      }
      
      // 生成该轮的所有比赛
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          // 跳过两个都是轮空的比赛
          if (!teams[i].hasBye && !teams[i + 1].hasBye) {
            matches.push({
              id: matchId++,
              round: round,
              matchNumber: Math.floor(i / 2) + 1,
              teamA: teams[i],
              teamB: teams[i + 1],
              status: 'pending'
            });
          }
        }
      }
    }
  }
  
  return matches;
}

/**
 * 生成6人转排表（特殊处理）
 * @param {Array} participants - 参与者列表
 * @param {String} mode - 模式：'standard', 'full', 'super'
 * @returns {Array} 比赛列表
 */
function generateSixPlayerSchedule(participants, mode = 'standard') {
  const matches = [];
  let matchId = 1;
  
  const modes = {
    standard: { rounds: 3, matchesPerRound: 2 }, // 每人4场，共6场
    full: { rounds: 4, matchesPerRound: 2 },     // 每人6场，共9场
    super: { rounds: 5, matchesPerRound: 3 }     // 每人10场，共15场
  };
  
  const config = modes[mode] || modes.standard;
  
  // 生成所有可能的搭档组合
  const allPairs = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      allPairs.push({
        players: [participants[i], participants[j]],
        name: `${participants[i].name}/${participants[j].name}`
      });
    }
  }
  
  // 根据模式选择组合
  let selectedPairs = [];
  if (mode === 'standard') {
    // 标准模式：选择6对，确保每人4场
    selectedPairs = selectPairsForStandard(allPairs, participants);
  } else if (mode === 'full') {
    // 完整模式：选择9对，确保每人6场
    selectedPairs = selectPairsForFull(allPairs, participants);
  } else {
    // 超完整模式：使用所有15对
    selectedPairs = allPairs;
  }
  
  // 随机打乱并分组
  const shuffled = shuffleArray([...selectedPairs]);
  
  // 按轮次分组
  for (let round = 1; round <= config.rounds; round++) {
    const roundMatches = shuffled.slice(
      (round - 1) * config.matchesPerRound,
      round * config.matchesPerRound
    );
    
    // 生成该轮比赛
    for (let i = 0; i < roundMatches.length; i += 2) {
      if (i + 1 < roundMatches.length) {
        matches.push({
          id: matchId++,
          round: round,
          matchNumber: Math.floor(i / 2) + 1,
          teamA: roundMatches[i],
          teamB: roundMatches[i + 1],
          status: 'pending'
        });
      }
    }
  }
  
  return matches;
}

/**
 * 生成7人转排表（特殊处理）
 * @param {Array} participants - 参与者列表
 * @param {String} mode - 模式：'standard', 'full'
 * @returns {Array} 比赛列表
 */
function generateSevenPlayerSchedule(participants, mode = 'standard') {
  const matches = [];
  let matchId = 1;
  
  const modes = {
    standard: { rounds: 7, matchesPerRound: 2 },  // 每人8场，共14场
    full: { rounds: 7, matchesPerRound: 3 }       // 每人12场，共21场
  };
  
  const config = modes[mode] || modes.standard;
  
  // 生成所有可能的搭档组合
  const allPairs = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      allPairs.push({
        players: [participants[i], participants[j]],
        name: `${participants[i].name}/${participants[j].name}`
      });
    }
  }
  
  // 根据模式选择组合
  let selectedPairs = [];
  if (mode === 'standard') {
    // 标准模式：选择14对，确保每人8场
    selectedPairs = selectPairsForSevenStandard(allPairs, participants);
  } else {
    // 完整模式：使用所有21对
    selectedPairs = allPairs;
  }
  
  // 随机打乱并分组
  const shuffled = shuffleArray([...selectedPairs]);
  
  // 按轮次分组
  for (let round = 1; round <= config.rounds; round++) {
    const roundMatches = shuffled.slice(
      (round - 1) * config.matchesPerRound,
      round * config.matchesPerRound
    );
    
    // 生成该轮比赛
    for (let i = 0; i < roundMatches.length; i += 2) {
      if (i + 1 < roundMatches.length) {
        matches.push({
          id: matchId++,
          round: round,
          matchNumber: Math.floor(i / 2) + 1,
          teamA: roundMatches[i],
          teamB: roundMatches[i + 1],
          status: 'pending'
        });
      }
    }
  }
  
  return matches;
}

/**
 * 为6人标准模式选择搭档对
 */
function selectPairsForStandard(allPairs, participants) {
  // 选择6对，确保每人出现4次
  const selected = [];
  const playerCount = new Map();
  participants.forEach(p => playerCount.set(p.id, 0));
  
  // 贪心算法：优先选择出现次数少的玩家
  const available = [...allPairs];
  
  while (selected.length < 6 && available.length > 0) {
    // 找到当前出现次数最少的玩家
    let minCount = Math.min(...Array.from(playerCount.values()));
    
    // 选择包含最少出现次数玩家的对
    const candidate = available.find(pair => {
      const count1 = playerCount.get(pair.players[0].id);
      const count2 = playerCount.get(pair.players[1].id);
      return count1 === minCount || count2 === minCount;
    }) || available[0];
    
    selected.push(candidate);
    available.splice(available.indexOf(candidate), 1);
    
    playerCount.set(candidate.players[0].id, playerCount.get(candidate.players[0].id) + 1);
    playerCount.set(candidate.players[1].id, playerCount.get(candidate.players[1].id) + 1);
  }
  
  return selected;
}

/**
 * 为6人完整模式选择搭档对
 */
function selectPairsForFull(allPairs, participants) {
  // 选择9对，确保每人出现6次
  const selected = [];
  const playerCount = new Map();
  participants.forEach(p => playerCount.set(p.id, 0));
  
  const available = [...allPairs];
  
  while (selected.length < 9 && available.length > 0) {
    let minCount = Math.min(...Array.from(playerCount.values()));
    
    const candidate = available.find(pair => {
      const count1 = playerCount.get(pair.players[0].id);
      const count2 = playerCount.get(pair.players[1].id);
      return count1 === minCount || count2 === minCount;
    }) || available[0];
    
    selected.push(candidate);
    available.splice(available.indexOf(candidate), 1);
    
    playerCount.set(candidate.players[0].id, playerCount.get(candidate.players[0].id) + 1);
    playerCount.set(candidate.players[1].id, playerCount.get(candidate.players[1].id) + 1);
  }
  
  return selected;
}

/**
 * 为7人标准模式选择搭档对
 */
function selectPairsForSevenStandard(allPairs, participants) {
  // 选择14对，确保每人出现8次
  const selected = [];
  const playerCount = new Map();
  participants.forEach(p => playerCount.set(p.id, 0));
  
  const available = [...allPairs];
  
  while (selected.length < 14 && available.length > 0) {
    let minCount = Math.min(...Array.from(playerCount.values()));
    
    const candidate = available.find(pair => {
      const count1 = playerCount.get(pair.players[0].id);
      const count2 = playerCount.get(pair.players[1].id);
      return count1 === minCount || count2 === minCount;
    }) || available[0];
    
    selected.push(candidate);
    available.splice(available.indexOf(candidate), 1);
    
    playerCount.set(candidate.players[0].id, playerCount.get(candidate.players[0].id) + 1);
    playerCount.set(candidate.players[1].id, playerCount.get(candidate.players[1].id) + 1);
  }
  
  return selected;
}

/**
 * 随机打乱数组
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 验证参与人数是否支持八人转
 * @param {Number} count - 参与人数
 * @returns {Boolean}
 */
function isValidRotationCount(count) {
  return count >= 4 && count <= 13;
}

/**
 * 计算八人转需要的轮数
 * @param {Number} count - 参与人数
 * @returns {Number} 轮数
 */
function calculateRounds(count) {
  if (count < 4 || count > 13) {
    return 0;
  }
  // 每轮每个人都要打，所以轮数 = 人数 - 1
  return count - 1;
}

/**
 * 计算总比赛场数
 * 公式：N = A × (A-1) / 4
 * @param {Number} count - 参与人数
 * @returns {Number} 总比赛场数
 */
function calculateTotalMatches(count) {
  if (count < 4 || count > 13) {
    return 0;
  }
  // 公式：N = A × (A-1) / 4
  return Math.floor((count * (count - 1)) / 4);
}

/**
 * 计算每轮比赛数
 * @param {Number} count - 参与人数
 * @returns {Number} 每轮比赛数
 */
function calculateMatchesPerRound(count) {
  if (count < 4 || count > 13) {
    return 0;
  }
  
  if (count % 2 === 0) {
    // 偶数：每轮 n/2 场比赛
    return count / 2;
  } else {
    // 奇数：每轮 (n-1)/2 场比赛（有轮空）
    return Math.floor(count / 2);
  }
}

/**
 * 获取6人转的特殊场次选项
 * @returns {Array} 场次选项
 */
function getSixPlayerOptions() {
  return [
    {
      name: '标准模式',
      matchesPerPlayer: 4,
      totalMatches: 6,
      description: '每人4场，共6场'
    },
    {
      name: '完整模式',
      matchesPerPlayer: 6,
      totalMatches: 9,
      description: '每人6场，共9场'
    },
    {
      name: '超完整模式',
      matchesPerPlayer: 10,
      totalMatches: 15,
      description: '每人10场，共15场'
    }
  ];
}

/**
 * 获取7人转的特殊场次选项
 * @returns {Array} 场次选项
 */
function getSevenPlayerOptions() {
  return [
    {
      name: '标准模式',
      matchesPerPlayer: 8,
      totalMatches: 14,
      description: '每人8场，共14场'
    },
    {
      name: '完整模式',
      matchesPerPlayer: 12,
      totalMatches: 21,
      description: '每人12场，共21场'
    }
  ];
}

/**
 * 获取八人转玩法描述
 * @param {Number} count - 参与人数
 * @returns {String} 描述
 */
function getRotationDescription(count) {
  if (!isValidRotationCount(count)) {
    return '参与人数必须在 4-13 人之间';
  }
  
  const rounds = calculateRounds(count);
  const matchesPerRound = calculateMatchesPerRound(count);
  const totalMatches = rounds * matchesPerRound;
  
  return `支持 ${count} 人参与，共 ${rounds} 轮，每轮 ${matchesPerRound} 场比赛，总计 ${totalMatches} 场比赛。每个人都会和其他参与者搭档一次。`;
}

module.exports = {
  generateRotationSchedule,
  isValidRotationCount,
  calculateRounds,
  calculateMatchesPerRound,
  calculateTotalMatches,
  getRotationDescription,
  getSixPlayerOptions,
  getSevenPlayerOptions
};


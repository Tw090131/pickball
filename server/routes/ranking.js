// server/routes/ranking.js
const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Registration = require('../models/Registration');

/**
 * 获取赛事排名
 * GET /api/ranking/event/:eventId
 */
router.get('/event/:eventId', async (req, res, next) => {
  try {
    const eventId = req.params.eventId;

    // 获取赛事信息
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 获取所有完成的比赛
    const matches = await Match.find({
      event: eventId,
      status: 'completed'
    });

    // 获取所有报名用户
    const registrations = await Registration.find({ event: eventId })
      .populate('user', 'nickName avatarUrl');

    // 检查是否是八人转
    const isRotation = event.rotationRule === '八人转';

    // 计算排名
    const rankingMap = new Map();

    // 初始化排名数据
    registrations.forEach(reg => {
      rankingMap.set(reg.user._id.toString(), {
        userId: reg.user._id,
        name: reg.user.nickName,
        avatar: reg.user.avatarUrl,
        wins: 0,
        losses: 0,
        totalScore: 0,
        againstScore: 0,
        netScore: 0,
        totalMatches: 0,
        // 八人转专用字段
        totalPoints: 0,        // 总积分
        gamesWon: 0,           // 总获胜局数
        gamesLost: 0,          // 总失败局数
        netGames: 0            // 净胜局数
      });
    });

    // 统计比赛结果（支持八人转个人成绩统计）
    matches.forEach(match => {
      if (isRotation && match.teamA.gameScore) {
        // 八人转：使用积分和局比分
        match.teamA.players.forEach(playerId => {
          const player = rankingMap.get(playerId.toString());
          if (player) {
            player.totalPoints += match.teamA.points || 0;
            player.gamesWon += match.teamA.gameScore.gamesWon || 0;
            player.gamesLost += match.teamA.gameScore.gamesLost || 0;
            player.totalMatches += 1;
            
            if (match.teamA.winner) {
              player.wins += 1;
            } else {
              player.losses += 1;
            }
          }
        });
        
        match.teamB.players.forEach(playerId => {
          const player = rankingMap.get(playerId.toString());
          if (player) {
            player.totalPoints += match.teamB.points || 0;
            player.gamesWon += match.teamB.gameScore.gamesWon || 0;
            player.gamesLost += match.teamB.gameScore.gamesLost || 0;
            player.totalMatches += 1;
            
            if (match.teamB.winner) {
              player.wins += 1;
            } else {
              player.losses += 1;
            }
          }
        });
      } else {
        // 传统计分方式
        if (match.teamA.winner) {
          // A 队获胜
          match.teamA.players.forEach(playerId => {
            const player = rankingMap.get(playerId.toString());
            if (player) {
              player.wins += 1;
              player.totalScore += match.teamA.score || 0;
              player.againstScore += match.teamB.score || 0;
              player.totalMatches += 1;
            }
          });
          match.teamB.players.forEach(playerId => {
            const player = rankingMap.get(playerId.toString());
            if (player) {
              player.losses += 1;
              player.totalScore += match.teamB.score || 0;
              player.againstScore += match.teamA.score || 0;
              player.totalMatches += 1;
            }
          });
        } else if (match.teamB.winner) {
          // B 队获胜
          match.teamB.players.forEach(playerId => {
            const player = rankingMap.get(playerId.toString());
            if (player) {
              player.wins += 1;
              player.totalScore += match.teamB.score || 0;
              player.againstScore += match.teamA.score || 0;
              player.totalMatches += 1;
            }
          });
          match.teamA.players.forEach(playerId => {
            const player = rankingMap.get(playerId.toString());
            if (player) {
              player.losses += 1;
              player.totalScore += match.teamA.score || 0;
              player.againstScore += match.teamB.score || 0;
              player.totalMatches += 1;
            }
          });
        }
      }
    });

    // 计算净胜分、净胜局和胜率
    rankingMap.forEach(player => {
      player.netScore = player.totalScore - player.againstScore;
      player.netGames = player.gamesWon - player.gamesLost;
      player.winRate = player.totalMatches > 0 
        ? (player.wins / player.totalMatches * 100).toFixed(1) 
        : 0;
    });

    // 转换为数组并排序
    const ranking = Array.from(rankingMap.values())
      .sort((a, b) => {
        if (isRotation) {
          // 八人转排名规则：1. 积分高者得冠；2. 积分相同，净胜局高者得冠
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          // 积分相同，按净胜局排序
          if (b.netGames !== a.netGames) {
            return b.netGames - a.netGames;
          }
          // 净胜局相同，按总获胜局数排序
          return b.gamesWon - a.gamesWon;
        } else {
          // 传统排名规则：1. 胜场数；2. 净胜分；3. 总得分
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          if (b.netScore !== a.netScore) {
            return b.netScore - a.netScore;
          }
          return b.totalScore - a.totalScore;
        }
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    // 统计信息
    const completedMatches = matches.length;
    const inProgressMatches = await Match.countDocuments({
      event: eventId,
      status: 'in_progress'
    });
    const totalMatches = await Match.countDocuments({
      event: eventId
    });

    res.json({
      success: true,
      data: {
        ranking,
        stats: {
          totalMatches,
          completedMatches,
          inProgressMatches,
          totalParticipants: registrations.length
        },
        rotationType: event.rotationRule
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


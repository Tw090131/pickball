// server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

/**
 * 获取用户信息
 * GET /api/users/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-openid -unionid');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新用户信息
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限修改'
      });
    }

    const user = await User.findById(req.userId);
    Object.assign(user, req.body);
    await user.save();

    res.json({
      success: true,
      message: '更新成功',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户统计数据
 * GET /api/users/:id/stats
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const userId = req.params.id;

    // 获取报名数量
    const registeredCount = await Registration.countDocuments({
      user: userId,
      status: 'registered'
    });

    // 获取创建的赛事数量
    const createdCount = await Event.countDocuments({
      organizer: userId
    });

    // 获取历史记录
    const historyCount = await Registration.countDocuments({
      user: userId,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        stats: {
          registeredCount,
          createdCount,
          historyCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户战绩统计
 * GET /api/users/:id/record
 */
router.get('/:id/record', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const Match = require('../models/Match');

    // 获取用户参与的所有比赛（作为 teamA 或 teamB 的成员）
    const matches = await Match.find({
      $or: [
        { 'teamA.players': userId },
        { 'teamB.players': userId }
      ],
      status: 'completed'
    }).populate('event', 'title format rotationRule');

    // 统计战绩
    let totalMatches = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalPoints = 0; // 八人转积分
    let totalGamesWon = 0; // 八人转获胜局数
    let totalGamesLost = 0; // 八人转失败局数
    let totalScore = 0; // 传统计分总得分
    let totalAgainstScore = 0; // 传统计分总失分

    matches.forEach(match => {
      const isInTeamA = match.teamA.players.some(p => p.toString() === userId.toString());
      const isInTeamB = match.teamB.players.some(p => p.toString() === userId.toString());
      
      if (!isInTeamA && !isInTeamB) return;

      totalMatches++;

      // 判断是否获胜
      const isWinner = (isInTeamA && match.teamA.winner) || (isInTeamB && match.teamB.winner);
      
      if (isWinner) {
        totalWins++;
      } else {
        totalLosses++;
      }

      // 八人转统计
      if (match.event?.rotationRule === '八人转' && match.teamA.gameScore) {
        if (isInTeamA) {
          totalPoints += match.teamA.points || 0;
          totalGamesWon += match.teamA.gameScore.gamesWon || 0;
          totalGamesLost += match.teamA.gameScore.gamesLost || 0;
        } else if (isInTeamB) {
          totalPoints += match.teamB.points || 0;
          totalGamesWon += match.teamB.gameScore.gamesWon || 0;
          totalGamesLost += match.teamB.gameScore.gamesLost || 0;
        }
      } else {
        // 传统计分统计
        if (isInTeamA) {
          totalScore += match.teamA.score || 0;
          totalAgainstScore += match.teamB.score || 0;
        } else if (isInTeamB) {
          totalScore += match.teamB.score || 0;
          totalAgainstScore += match.teamA.score || 0;
        }
      }
    });

    // 计算胜率
    const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : 0;
    
    // 计算净胜分/净胜局
    const netScore = totalScore - totalAgainstScore;
    const netGames = totalGamesWon - totalGamesLost;

    // 获取最近5场比赛
    const recentMatches = matches
      .sort((a, b) => new Date(b.endTime || b.updatedAt) - new Date(a.endTime || a.updatedAt))
      .slice(0, 5)
      .map(match => {
        const isInTeamA = match.teamA.players.some(p => p.toString() === userId.toString());
        const isInTeamB = match.teamB.players.some(p => p.toString() === userId.toString());
        const isWinner = (isInTeamA && match.teamA.winner) || (isInTeamB && match.teamB.winner);
        
        // 格式化日期
        const date = match.endTime || match.updatedAt;
        const dateStr = date ? new Date(date).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : '';
        
        return {
          id: match._id,
          eventTitle: match.event?.title || '未知赛事',
          isWinner,
          result: isWinner ? '胜' : '负',
          date: dateStr
        };
      });

    res.json({
      success: true,
      data: {
        record: {
          totalMatches,
          totalWins,
          totalLosses,
          winRate: parseFloat(winRate),
          // 八人转数据
          totalPoints,
          totalGamesWon,
          totalGamesLost,
          netGames,
          // 传统计分数据
          totalScore,
          totalAgainstScore,
          netScore,
          // 最近战绩
          recentMatches
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


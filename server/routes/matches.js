// server/routes/matches.js
const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/admin');

/**
 * 获取赛事比赛列表
 * GET /api/matches/event/:eventId
 */
router.get('/event/:eventId', optionalAuth, async (req, res, next) => {
  try {
    const matches = await Match.find({ event: req.params.eventId })
      .populate('teamA.players', 'nickName avatarUrl')
      .populate('teamB.players', 'nickName avatarUrl')
      .sort({ round: 1, matchNumber: 1 });

    res.json({
      success: true,
      data: {
        matches
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建比赛
 * POST /api/matches
 */
router.post('/', authenticate, isOrganizer, async (req, res, next) => {
  try {
    const { eventId, teamA, teamB, round, matchNumber } = req.body;

    const match = new Match({
      event: eventId,
      teamA: {
        name: teamA.name,
        players: teamA.players || [],
        score: 0
      },
      teamB: {
        name: teamB.name,
        players: teamB.players || [],
        score: 0
      },
      round: round || 1,
      matchNumber: matchNumber || 1,
      status: 'pending'
    });

    await match.save();

    res.status(201).json({
      success: true,
      message: '比赛创建成功',
      data: {
        match
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新比分（支持传统比分和局比分）
 * PUT /api/matches/:id/score
 */
router.put('/:id/score', authenticate, async (req, res, next) => {
  try {
    const { scoreA, scoreB, gameScoreA, gameScoreB } = req.body;

    const match = await Match.findById(req.params.id).populate('event').populate('teamA.players teamB.players');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '比赛不存在'
      });
    }

    const event = match.event;
    const isRotation = event.rotationRule === '八人转';

    // 八人转使用局比分
    if (isRotation && (gameScoreA !== undefined || gameScoreB !== undefined)) {
      const { parseGameScore, calculatePoints, isValidGameScore } = require('../utils/scoring');
      
      // 解析局比分
      let gamesWonA, gamesLostA, gamesWonB, gamesLostB;
      
      if (typeof gameScoreA === 'string') {
        const parsed = parseGameScore(gameScoreA);
        gamesWonA = parsed.gamesWon;
        gamesLostA = parsed.gamesLost;
      } else {
        gamesWonA = gameScoreA?.gamesWon || 0;
        gamesLostA = gameScoreA?.gamesLost || 0;
      }
      
      if (typeof gameScoreB === 'string') {
        const parsed = parseGameScore(gameScoreB);
        gamesWonB = parsed.gamesWon;
        gamesLostB = parsed.gamesLost;
      } else {
        gamesWonB = gameScoreB?.gamesWon || 0;
        gamesLostB = gameScoreB?.gamesLost || 0;
      }

      // 验证局比分
      if (!isValidGameScore(gamesWonA, gamesLostA) || !isValidGameScore(gamesWonB, gamesLostB)) {
        return res.status(400).json({
          success: false,
          message: '局比分无效，必须有一方获胜且格式正确（如 2:0, 2:1）'
        });
      }

      // 更新局比分
      match.teamA.gameScore = {
        gamesWon: gamesWonA,
        gamesLost: gamesLostA
      };
      match.teamB.gameScore = {
        gamesWon: gamesWonB,
        gamesLost: gamesLostB
      };

      // 计算积分
      match.teamA.points = calculatePoints(gamesWonA, gamesLostA);
      match.teamB.points = calculatePoints(gamesWonB, gamesLostB);

      // 判断获胜方（积分高的获胜）
      if (match.teamA.points > match.teamB.points) {
        match.teamA.winner = true;
        match.teamB.winner = false;
      } else if (match.teamB.points > match.teamA.points) {
        match.teamA.winner = false;
        match.teamB.winner = true;
      } else {
        match.teamA.winner = false;
        match.teamB.winner = false;
      }

      match.status = 'completed';
      match.endTime = new Date();
    } else {
      // 传统比分（非八人转）
      match.teamA.score = scoreA || 0;
      match.teamB.score = scoreB || 0;

      // 判断获胜方
      const maxScore = event.scoringSystem || 11;
      if (scoreA >= maxScore && scoreA - scoreB >= 2) {
        match.teamA.winner = true;
        match.teamB.winner = false;
        match.status = 'completed';
        match.endTime = new Date();
      } else if (scoreB >= maxScore && scoreB - scoreA >= 2) {
        match.teamA.winner = false;
        match.teamB.winner = true;
        match.status = 'completed';
        match.endTime = new Date();
      } else {
        match.status = 'in_progress';
        if (!match.startTime) {
          match.startTime = new Date();
        }
      }
    }

    await match.save();

    res.json({
      success: true,
      message: '比分更新成功',
      data: {
        match
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 完成比赛
 * PUT /api/matches/:id/complete
 */
router.put('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '比赛不存在'
      });
    }

    match.status = 'completed';
    match.endTime = new Date();
    await match.save();

    res.json({
      success: true,
      message: '比赛已完成',
      data: {
        match
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


import { Router } from 'express';
import Joi from 'joi';
import { Services } from './index';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import { createLogger } from '../../utils/logger';

const logger = createLogger('quote-api');

// Validation schema
const quoteSchema = Joi.object({
  sourceChain: Joi.string().valid('base', 'ethereum', 'polygon').required(),
  destinationChain: Joi.string().valid('near').required(),
  sourceToken: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  destinationToken: Joi.string().required(),
  amount: Joi.string().pattern(/^\d+$/).required(),
  urgency: Joi.string().valid('fast', 'normal', 'slow').default('normal'),
});

export function quoteRouter(services: Services): Router {
  const router = Router();
  const { dutchAuctionSimulator, metricsCollector } = services;

  // Get quote with Dutch auction simulation
  router.post(
    '/',
    validateRequest(quoteSchema),
    asyncHandler(async (req, res) => {
      const startTime = Date.now();
      logger.info('Getting quote', { body: req.body });

      const { sourceChain, destinationChain, sourceToken, destinationToken, amount, urgency } = req.body;

      // Simulate Dutch auction
      const quote = await dutchAuctionSimulator.getQuote({
        sourceChain,
        destinationChain,
        sourceToken,
        destinationToken,
        amount,
        urgency,
      });

      // Record metrics
      metricsCollector.recordApiLatency('get_quote', Date.now() - startTime);

      res.json({
        quote: {
          sourceAmount: quote.sourceAmount,
          destinationAmount: quote.destinationAmount,
          rate: quote.rate,
          priceImpact: quote.priceImpact,
          validUntil: quote.validUntil,
        },
        dutchAuction: {
          startPrice: quote.dutchAuction.startPrice,
          endPrice: quote.dutchAuction.endPrice,
          duration: quote.dutchAuction.duration,
          currentPrice: quote.dutchAuction.currentPrice,
        },
        fees: {
          protocol: quote.fees.protocol,
          network: quote.fees.network,
        },
      });
    })
  );

  // Get historical quotes
  router.get(
    '/history',
    asyncHandler(async (req, res) => {
      const { pair, limit = 100 } = req.query;
      
      const history = await dutchAuctionSimulator.getQuoteHistory({
        pair: pair as string,
        limit: Number(limit),
      });

      res.json({
        history,
        count: history.length,
      });
    })
  );

  // Get supported pairs
  router.get(
    '/pairs',
    asyncHandler(async (req, res) => {
      const pairs = await dutchAuctionSimulator.getSupportedPairs();
      
      res.json({
        pairs,
        count: pairs.length,
      });
    })
  );

  return router;
}
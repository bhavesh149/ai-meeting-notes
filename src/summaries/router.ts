import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import pino from 'pino';
import { prisma } from '../db';
import { summarizeTranscript } from '../llm/groq';
import { sendSummaryEmail } from './sendEmail';
import {
  generateSummarySchema,
  updateSummarySchema,
  shareSummarySchema,
  listSummariesQuerySchema,
  summaryParamsSchema,
  fileUploadSchema,
  type GenerateSummaryInput,
  type UpdateSummaryInput,
  type ShareSummaryInput,
  type ListSummariesQuery,
  type SummaryParams,
} from './schemas';

const router = express.Router();
const logger = pino({ name: 'summaries-router' });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'));
    }
  },
});

// Validation middleware
const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      logger.warn({ error, body: req.body }, 'Request body validation failed');
      res.status(400).json({
        error: 'Validation failed',
        details: error,
      });
    }
  };
};

const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      logger.warn({ error, params: req.params }, 'Request params validation failed');
      res.status(400).json({
        error: 'Invalid parameters',
        details: error,
      });
    }
  };
};

const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      logger.warn({ error, query: req.query }, 'Request query validation failed');
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error,
      });
    }
  };
};

// POST /api/summaries/generate
router.post('/generate', upload.single('transcript'), async (req: Request, res: Response) => {
  try {
    let transcriptText: string;
    let prompt: string;
    let model: string;

    // Handle file upload or text input
    if (req.file) {
      // Validate uploaded file
      try {
        const fileData = fileUploadSchema.parse({
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
        });
        transcriptText = fileData.buffer.toString('utf-8');
      } catch (error) {
        logger.warn({ error, file: req.file }, 'File validation failed');
        res.status(400).json({
          error: 'Invalid file upload',
          details: error,
        });
        return;
      }

      // Get prompt and model from form data
      prompt = req.body.prompt || 'Please provide a comprehensive summary of this meeting transcript.';
      model = req.body.model || 'llama3-70b-8192';
    } else {
      // Validate JSON body
      try {
        const validatedBody = generateSummarySchema.parse(req.body);
        transcriptText = validatedBody.transcript;
        prompt = validatedBody.prompt;
        model = validatedBody.model;
      } catch (error) {
        logger.warn({ error, body: req.body }, 'Request body validation failed');
        res.status(400).json({
          error: 'Validation failed',
          details: error,
        });
        return;
      }
    }

    logger.info({
      transcriptLength: transcriptText.length,
      promptLength: prompt.length,
      model,
      hasFile: !!req.file,
    }, 'Starting summary generation');

    // Create initial summary record
    const summary = await prisma.summary.create({
      data: {
        transcript: transcriptText,
        prompt,
        model,
        aiSummary: '', // Will be updated after LLM call
        status: 'pending',
      },
    });

    try {
      // Call LLM to generate summary
      const llmResult = await summarizeTranscript({
        transcript: transcriptText,
        prompt,
        model,
      });

      // Update summary with results
      const updatedSummary = await prisma.summary.update({
        where: { id: summary.id },
        data: {
          aiSummary: llmResult.summary,
          tokensIn: llmResult.tokensIn,
          tokensOut: llmResult.tokensOut,
          status: 'completed',
        },
      });

      logger.info({
        summaryId: updatedSummary.id,
        tokensIn: llmResult.tokensIn,
        tokensOut: llmResult.tokensOut,
        model: llmResult.model,
      }, 'Summary generated successfully');

      res.status(201).json({
        id: updatedSummary.id,
        aiSummary: updatedSummary.aiSummary,
        tokensIn: updatedSummary.tokensIn,
        tokensOut: updatedSummary.tokensOut,
        model: updatedSummary.model,
      });
    } catch (llmError) {
      // Update summary status to failed
      await prisma.summary.update({
        where: { id: summary.id },
        data: { status: 'failed' },
      });

      logger.error({ error: llmError, summaryId: summary.id }, 'LLM call failed');
      res.status(500).json({
        error: 'Failed to generate summary',
        message: llmError instanceof Error ? llmError.message : 'Unknown error',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Summary generation failed');
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PATCH /api/summaries/:id
router.patch('/:id', 
  validateParams(summaryParamsSchema),
  validateBody(updateSummarySchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as SummaryParams;
      const { editedSummary } = req.body as UpdateSummaryInput;

      // Check if summary exists
      const existingSummary = await prisma.summary.findUnique({
        where: { id },
      });

      if (!existingSummary) {
        res.status(404).json({
          error: 'Summary not found',
        });
        return;
      }

      // Update the summary
      const updatedSummary = await prisma.summary.update({
        where: { id },
        data: { editedSummary },
      });

      logger.info({ summaryId: id }, 'Summary updated successfully');

      res.json({
        id: updatedSummary.id,
        editedSummary: updatedSummary.editedSummary,
        updatedAt: updatedSummary.updatedAt,
      });
    } catch (error) {
      logger.error({ error }, 'Summary update failed');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/summaries/:id
router.get('/:id', 
  validateParams(summaryParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as SummaryParams;

      const summary = await prisma.summary.findUnique({
        where: { id },
        include: {
          shares: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Limit to recent shares
          },
        },
      });

      if (!summary) {
        res.status(404).json({
          error: 'Summary not found',
        });
        return;
      }

      logger.info({ summaryId: id }, 'Summary retrieved successfully');

      res.json(summary);
    } catch (error) {
      logger.error({ error }, 'Summary retrieval failed');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// POST /api/summaries/:id/share
router.post('/:id/share',
  validateParams(summaryParamsSchema),
  validateBody(shareSummarySchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as SummaryParams;
      const { recipients, subject } = req.body as ShareSummaryInput;

      // Check if summary exists
      const summary = await prisma.summary.findUnique({
        where: { id },
      });

      if (!summary) {
        res.status(404).json({
          error: 'Summary not found',
        });
        return;
      }

      // Determine which summary to send (edited version takes precedence)
      const summaryToSend = summary.editedSummary || summary.aiSummary;
      const emailSubject = subject || `Meeting Summary - ${new Date().toLocaleDateString()}`;

      logger.info({
        summaryId: id,
        recipients: recipients.length,
        subject: emailSubject,
      }, 'Starting email share');

      // Send email
      const emailResult = await sendSummaryEmail({
        recipients,
        subject: emailSubject,
        summary: summaryToSend,
        summaryId: id,
      });

      if (!emailResult.success) {
        res.status(500).json({
          error: 'Failed to send email',
          message: emailResult.error,
        });
        return;
      }

      // Create share record
      const share = await prisma.share.create({
        data: {
          summaryId: id,
          recipients,
          subject: emailSubject,
          bodyHtml: emailResult.bodyHtml,
        },
      });

      logger.info({
        shareId: share.id,
        summaryId: id,
        recipients: recipients.length,
        messageId: emailResult.messageId,
      }, 'Summary shared successfully');

      res.json({
        success: true,
        shareId: share.id,
        recipients,
        subject: emailSubject,
        messageId: emailResult.messageId,
      });
    } catch (error) {
      logger.error({ error }, 'Summary sharing failed');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/summaries
router.get('/',
  validateQuery(listSummariesQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, userId } = req.query as unknown as ListSummariesQuery;

      const skip = (page - 1) * limit;
      const where = userId ? { userId } : {};

      // Get total count for pagination
      const total = await prisma.summary.count({ where });

      // Get summaries
      const summaries = await prisma.summary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transcript: false, // Don't include large transcript in list view
          prompt: true,
          aiSummary: true,
          editedSummary: true,
          model: true,
          tokensIn: true,
          tokensOut: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          _count: {
            select: {
              shares: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / limit);

      logger.info({
        page,
        limit,
        total,
        totalPages,
        userId,
      }, 'Summaries retrieved successfully');

      res.json({
        summaries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Summaries list retrieval failed');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// DELETE /api/summaries/:id
router.delete('/:id',
  validateParams(summaryParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as SummaryParams;

      // Check if summary exists
      const summary = await prisma.summary.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              shares: true,
            },
          },
        },
      });

      if (!summary) {
        res.status(404).json({
          error: 'Summary not found',
        });
        return;
      }

      // Delete associated shares first (cascade)
      await prisma.share.deleteMany({
        where: { summaryId: id },
      });

      // Delete the summary
      await prisma.summary.delete({
        where: { id },
      });

      logger.info({
        summaryId: id,
        sharesDeleted: summary._count.shares,
      }, 'Summary deleted successfully');

      res.json({
        success: true,
        message: 'Summary deleted successfully',
        deletedId: id,
      });
    } catch (error) {
      logger.error({ error, summaryId: req.params.id }, 'Summary deletion failed');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
